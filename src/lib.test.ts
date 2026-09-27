import { describe, it, expect } from 'vitest'
import { latest, newest, validateRating, validateDimensions, wellLearned, ratingSummary, selectableBooks, shelfBooks, type Book, type Assessment } from './lib'
const assessment=(id:string,stars:number,time:string,book='book',song='song'):Assessment=>({id,fluency:stars,dynamics:stars,rhythm:stars,assessed_at:time,student_book_id:book,song_id:song,feedback:null})
describe('three dimensions',()=>{
 it('requires all skills and never substitutes an overall score',()=>{
  expect(()=>validateDimensions({fluency:3,dynamics:2,rhythm:0},'')).toThrow()
  expect(()=>validateDimensions({fluency:3,dynamics:2,rhythm:1},'')).not.toThrow()
  expect(wellLearned(undefined)).toBe(false)
 })
 it('requires three threes to count a song as well learned',()=>{
  const row={...assessment('a',3,'2026-01-01'),stars:null,fluency:3,dynamics:3,rhythm:2}
  expect(wellLearned(row)).toBe(false);expect(wellLearned({...row,rhythm:3})).toBe(true)
  expect(ratingSummary(row)).toContain('Rhythm: ★★')

 })
 it('hides inactive editions and selected books while keeping catalogue order',()=>{
  const b=(id:string,order:number,active=true)=>({id,title:id,level:id,catalogue_order:order,catalogue_active:active}) as Book
  expect(selectableBooks([b('b',2),b('legacy',0,false),b('a',1),b('chosen',3)],[{id:'sb',student_id:'s',book_id:'chosen'}]).map(x=>x.id)).toEqual(['a','b'])
 })
})
describe('assessment history',()=>{
 it('uses original dates for corrected entries and skips excluded entries',()=>{
  const older={...assessment('old',3,'2026-01-01'),revision_number:2,revised_at:'2026-03-01'}
  const newer=assessment('new',1,'2026-02-01')
  expect(latest([older,newer],'book','song')?.id).toBe('new')
  expect(latest([older,{...newer,excluded:true}],'book','song')?.id).toBe('old')
  expect(latest([{...older,excluded:true}],'book','song')).toBeUndefined()
  expect(wellLearned({...older,excluded:true})).toBe(false)
 })
 it('separates archived books and never offers a duplicate selection',()=>{
  const selected=[{id:'a',student_id:'s',book_id:'active'},{id:'b',student_id:'s',book_id:'archived',archived_at:'2026-01-01'}]
  expect(shelfBooks(selected,false).map(b=>b.id)).toEqual(['a'])
  expect(shelfBooks(selected,true).map(b=>b.id)).toEqual(['b'])
  expect(selectableBooks([{id:'archived'} as Book],selected)).toEqual([])
 })
 it('distinguishes unassessed from one star',()=>{expect(latest([],'book','song')).toBeUndefined();expect(latest([assessment('a',1,'2026-09-01')],'book','song')?.fluency).toBe(1)})
 it('uses newest, not highest rating, and isolates song and book',()=>{
  const rows=[assessment('a',3,'2026-09-01'),assessment('b',1,'2026-09-02'),assessment('c',2,'2026-09-03','other'),assessment('d',3,'2026-09-04','book','other')]
  expect(latest(rows,'book','song')?.id).toBe('b');expect(rows[0].id).toBe('a')
 })
 it('breaks timestamp ties deterministically to match the SQL view',()=>{expect(newest([assessment('a',3,'2026-09-01'),assessment('b',2,'2026-09-01')])[0].id).toBe('b')})
 it.each([0,4,-1,1.5,NaN,Infinity])('rejects invalid stars %s',n=>expect(()=>validateRating(n,'')).toThrow())
 it.each([1,2,3])('accepts %s stars and optional feedback',n=>expect(()=>validateRating(n,'')).not.toThrow())
 it('limits feedback',()=>expect(()=>validateRating(2,'a'.repeat(2001))).toThrow())
})
