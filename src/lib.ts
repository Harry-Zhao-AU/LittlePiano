import { createClient } from '@supabase/supabase-js'
export interface Book { id: string; series: string; title: string; level: string; book_type: string; edition: string; language: string; catalogue_status: 'partial' | 'verified_complete'; catalogue_active?: boolean; catalogue_order?: number; catalogue_notes?: string | null }
export function compareBooks(a: Book, b: Book) {
  return (a.catalogue_order ?? 1000) - (b.catalogue_order ?? 1000) || a.level.localeCompare(b.level, undefined, {numeric:true}) || a.title.localeCompare(b.title)
}
export function selectableBooks(books: Book[], selected: StudentBook[]) {
  return books.filter(b => b.catalogue_active !== false && !selected.some(s => s.book_id === b.id)).sort(compareBooks)
}
export interface Song { id: string; book_id: string; title: string; page_number: number | null; sort_order: number }
export interface Student { id: string; display_name: string }
export interface StudentBook { id: string; student_id: string; book_id: string; archived_at?: string | null }
export interface Assessment { id: string; student_book_id: string; song_id: string; fluency: number; dynamics: number; rhythm: number; feedback: string | null; assessed_at: string; excluded?: boolean; revision_number?: number; revised_at?: string | null }
export interface AssessmentRevision extends Ratings { id: string; assessment_id: string; revision_number: number; feedback: string | null; excluded: boolean; created_at: string }
export function shelfBooks(selected: StudentBook[], archived: boolean) { return selected.filter(b => !!b.archived_at === archived) }
export const dimensions = ['fluency', 'dynamics', 'rhythm'] as const
export type Ratings = Record<typeof dimensions[number], number>
export function validateDimensions(ratings: Ratings, feedback: string) {
  for (const dimension of dimensions) validateRating(ratings[dimension], feedback)
}
export function ratingSummary(a: Assessment) {
  return dimensions.map(d => `${d[0].toUpperCase()+d.slice(1)}: ${'★'.repeat(a[d] ?? 0)} · ${meanings[a[d] ?? 0]}`).join(' / ')
}
export function wellLearned(a?: Assessment) {
  return !!a && !a.excluded && dimensions.every(d => a[d] === 3)
}
export const meanings = ['Not assessed', 'Getting started', 'Almost there', 'Well learned']
export function newest(rows: Assessment[]): Assessment[] {
  return [...rows].sort((a,b) => b.assessed_at.localeCompare(a.assessed_at) || b.id.localeCompare(a.id))
}
export function latest(rows: Assessment[], bookId: string, songId: string) {
  return newest(rows.filter(a => !a.excluded && a.student_book_id === bookId && a.song_id === songId))[0]
}
export function validateRating(stars: number, feedback: string) {
  if (!Number.isInteger(stars) || stars < 1 || stars > 3) throw new Error('Choose 1, 2, or 3 stars.')
  if (feedback.length > 2000) throw new Error('Please keep feedback under 2,000 characters.')
}
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
export const configured = !!url && /^https?:\/\//.test(url) && !!key && !url.includes('your-project') && key !== 'your-publishable-key'
export const supabase = configured ? createClient(url, key) : null
export async function saveAssessment(row: { id: string; student_book_id: string; song_id: string; feedback: string } & Ratings) {
  validateDimensions(row, row.feedback)
  if (!supabase) throw new Error('Cloud connection is not configured.')
  const { data, error } = await supabase.from('assessments').insert(row).select().single()
  if (error) throw error
  return data as Assessment
}
