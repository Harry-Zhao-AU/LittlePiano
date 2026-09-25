import {describe,it,expect} from 'vitest'
import {readFile} from 'node:fs/promises'
import {catalogue} from './catalogue.mjs'
import {catalogue as previous} from './requested.mjs'
import {seedSQL} from '../scripts/seed.mjs'
import {photoSource} from './family-level-1.mjs'
import {techniquePhotoSource} from './family-level-1-technique.mjs'
import {level2aPhotoSource} from './family-level-2a.mjs'
import {level2aTechniquePhotoSource} from './family-level-2a-technique.mjs'
import {level2bPhotoSource} from './family-level-2b.mjs'
import {level2bTechniquePhotoSource} from './family-level-2b-technique.mjs'
describe('publisher catalogue',()=>{
 it('contains nine retained editions and excludes Levels 3 and 4–5',()=>{
  expect(catalogue).toHaveLength(9)
  expect(catalogue.some(b=>/^all-in-two-(3|4-5)-/.test(b.key))).toBe(false)
  expect(catalogue.slice(0,3).map(b=>b.songs.length)).toEqual([60,64,45])
  expect(catalogue.every(b=>b.catalogue_status==='verified_complete')).toBe(true)
 })
 it('preserves old keys and keeps source evidence on every entry',()=>{
  for(const b of catalogue){
   expect(new Set(b.songs.map(s=>s.key)).size).toBe(b.songs.length)
   expect(new Set(b.songs.map(s=>s.sort_order)).size).toBe(b.songs.length)
   for(const s of previous.find(p=>p.key===b.key).songs)expect(b.songs.some(n=>n.key===s.key)).toBe(true)
   for(const s of b.songs){expect(s.title).toBeTruthy();if(![photoSource,techniquePhotoSource,level2aPhotoSource,level2aTechniquePhotoSource,level2bPhotoSource,level2bTechniquePhotoSource].includes(s.source_url))expect(new URL(s.source_url).hostname).toMatch(/^([a-z]+\.)?pianoadventures\.(com|com\.au|co\.uk)$/);expect(s.page_number===null||s.page_number>0).toBe(true)}
  }
 })
 it('leaves unknown audio-index pages null and removes speed/tuning duplicates',()=>{
  const b=catalogue.find(b=>b.key==='all-in-two-1-lesson-theory-anglicised')
  expect(b.songs.find(s=>s.title==='Sailing in the Sun').page_number).toBeNull()
  expect(b.songs.find(s=>s.title==='Little River').page_number).toBe(10)
  expect(b.songs.find(s=>s.title==='Little River').additional_sources).toContain('https://pianoadventures.co.uk/wp-content/uploads/sites/10/2013/06/IEFF8004EA-p06.jpg')
  expect(b.songs.find(s=>s.title==='Firefly').page_number).toBe(8)
  expect(b.songs.some(s=>/Tuning|\(Slow\)/.test(s.title))).toBe(false)
 })
 it('ships exactly the generated SQL',async()=>expect(await readFile('supabase/seeds/catalogue.sql','utf8')).toBe(seedSQL()))
 it('reconciles the final Technique chart with separate sonatina movements and its own pages',()=>{
  const b=catalogue.find(b=>b.key==='all-in-two-2b-technique-performance-anglicised')
  expect(b.songs).toHaveLength(47)
  expect(b.songs.filter(s=>s.title.startsWith('Classic Sonatina')).map(s=>s.page_range)).toEqual(['52-53','54-55','56-57'])
  expect(b.songs.find(s=>s.title==='Pedal Rhythms').page_number).toBe(5)
  expect(b.songs.find(s=>s.title==='Pedal Pushers').page_number).toBe(32)
  expect(b.songs.find(s=>s.title==='Rockin’ Bagpipes').page_number).toBeNull()
  expect(b.songs.at(-1).page_range).toBe('60-63')
  expect(b.songs.every(s=>s.source_url===level2bTechniquePhotoSource)).toBe(true)
  expect(b.songs.some(s=>s.title==='Certificate of Achievement'||s.title==='Classic Sonatina')).toBe(false)
 })
 it('matches the Level 2B printed edition rather than substituting audio-only titles',()=>{
  const b=catalogue.find(b=>b.key==='all-in-two-2b-lesson-theory-anglicised')
  expect(b.songs).toHaveLength(48)
  expect(b.songs.find(s=>s.title==='I’ve Got Peace Like a River').page_number).toBe(42)
  expect(b.songs.find(s=>s.title==='Deep River').page_number).toBe(43)
  expect(b.songs.find(s=>s.title==='Aria').page_number).toBe(83)
  expect(b.songs.some(s=>['Camptown Races Duet','Boom Boom!'].includes(s.title))).toBe(false)
  expect(b.retired_song_keys).toEqual(['contents-camptownracesduet','contents-boomboom'])
  expect(b.songs.every(s=>s.source_url===level2bPhotoSource)).toBe(true)
 })
 it('reconciles Level 2A Technique secrets, Explorer and starred reference rows',()=>{
  const b=catalogue.find(b=>b.key==='all-in-two-2a-technique-performance-anglicised')
  expect(b.songs).toHaveLength(37)
  expect(b.songs.filter(s=>s.title.startsWith('The Explorer —')).map(s=>s.page_number)).toEqual([34,34,35,35])
  expect(b.songs.find(s=>s.title==='Dancing Thumb').page_number).toBe(5)
  expect(b.songs.find(s=>s.title==='Busy Places! — The Market').page_number).toBe(6)
  expect(b.songs.find(s=>s.title==='Busy Places! — The Market').page_range).toBe('6-7')
  expect(b.songs.at(-1).page_range).toBe('46-47')
  expect(b.songs.every(s=>s.source_url===level2aTechniquePhotoSource)).toBe(true)
 })
 it('reconciles Level 2A hands, lead sheet, theory and warm-ups from its own page column',()=>{
  const b=catalogue.find(b=>b.key==='all-in-two-2a-lesson-theory-anglicised')
  expect(b.songs).toHaveLength(58)
  for(const title of ['This R.H. Old Man','This L.H. Old Man'])expect(b.songs.find(s=>s.title===title).page_number).toBe(50)
  expect(b.songs.find(s=>s.title==='Lead Sheet for Go Tell Aunt Rhody').page_number).toBe(83)
  expect(b.songs.find(s=>s.title==='Jazz Blast Improvisation').page_number).toBeNull()
  expect(b.songs.find(s=>s.title==='Jazz Blast Improvisation').page_range).toBe('78-79')
  expect(b.songs.at(-1).page_range).toBe('86-87')
  expect(b.songs.every(s=>s.source_url===level2aPhotoSource)).toBe(true)
 })
 it('includes the Technique chart exercises and challenge without guessing shared-row pages',()=>{
  const b=catalogue.find(b=>b.key==='all-in-two-1-technique-performance-anglicised')
  expect(b.songs).toHaveLength(49)
  expect(b.songs.find(s=>s.title==='Silent Play').page_number).toBe(5)
  expect(b.songs.find(s=>s.title==='A Sunny Parade').page_number).toBe(34)
  expect(b.songs.find(s=>s.title==='A Rainy Parade').page_number).toBeNull()
  expect(b.songs.find(s=>s.title==='A Rainy Parade').page_range).toBe('34-35')
  expect(b.songs.at(-1).page_range).toBe('54-55')
  expect(b.songs.every(s=>s.source_url===techniquePhotoSource)).toBe(true)
  expect(b.songs.some(s=>/Certificate/.test(s.title))).toBe(false)
 })
 it('reconciles the family chart without inventing exact pages or importing companion references',()=>{
  const b=catalogue.find(b=>b.key==='all-in-two-1-lesson-theory-anglicised')
  expect(b.songs).toHaveLength(56)
  expect(b.songs.find(s=>s.title==='Jumping Beans').page_number).toBe(17)
  expect(b.songs.find(s=>s.title==='Forest Song').page_range).toBe('52-53')
  expect(b.songs.find(s=>s.title==='Merlin the Wizard').page_number).toBeNull()
  expect(b.songs.find(s=>s.title==='Merlin the Wizard').page_range).toBe('58-59')
  expect(b.songs.some(s=>['Forest Drums','Mexican Jumping Beans','Certificate of Achievement','Canoe Ride'].includes(s.title))).toBe(false)
  expect(b.songs.every(s=>s.source_url===photoSource)).toBe(true)
 })
})
