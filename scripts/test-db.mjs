// Real PostgreSQL engine (WASM), real migration and RLS; no cloud credentials.
import { PGlite } from '@electric-sql/pglite'
import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
import { seedSQL, id } from './seed.mjs'
import { catalogue as legacy } from '../catalogue/legacy-us.mjs'
import { catalogue as previous } from '../catalogue/requested.mjs'
import { catalogue as researched } from '../catalogue/expanded.mjs'
import { catalogue } from '../catalogue/catalogue.mjs'
const db=new PGlite()
await db.exec(`create role anon nologin; create role authenticated nologin;
 create schema auth; create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as
 $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 grant usage on schema auth,public to anon,authenticated;
 grant execute on function auth.uid() to anon,authenticated;`)
await db.exec(await readFile('supabase/migrations/202609240001_initial.sql','utf8'))
await db.exec(await readFile('supabase/migrations/202609240002_catalogue_selection.sql','utf8'))
await db.exec(await readFile('supabase/migrations/202609250004_family_catalogue_sources.sql','utf8'))
await db.exec(seedSQL(legacy))
await db.exec(seedSQL(previous))
await db.exec(seedSQL(researched))
await db.exec(seedSQL());await db.exec(seedSQL())
const A='10000000-0000-4000-a000-000000000001', B='10000000-0000-4000-a000-000000000002'
const student='20000000-0000-4000-a000-000000000001', sb='30000000-0000-4000-a000-000000000001'
const book=id('primer-lesson-us-2'), song=id('primer-lesson-us-2/entry-001'), otherSong=id('1-lesson-us-2/entry-001')
await db.query('insert into auth.users values ($1),($2)',[A,B])
let count=0
async function as(role,user,sql,params=[]) {
 await db.exec('begin')
 try {
  await db.exec(`set local role ${role}`)
  await db.query("select set_config('request.jwt.claim.sub',$1,true)",[user??''])
  const result=await db.query(sql,params)
  await db.exec('commit');return result.rows
 } catch(e) {await db.exec('rollback');throw e}
}
async function ok(name,fn){await fn();count++;console.log(`PASS ${name}`)}
async function denied(name,fn,code){await ok(name,async()=>{await assert.rejects(fn,e=>!code||e.code===code)})}
await ok('catalogue seed is repeatable without duplicating rows',async()=>{
 const rows=await as('authenticated',A,'select count(*)::int as n from public.books where catalogue_active');assert.equal(rows[0].n,catalogue.length)
 const removed=await as('authenticated',A,"select count(*)::int as n from public.books where catalogue_active and level in ('3','4-5')")
 assert.equal(removed[0].n,0)
})
await ok('expanded catalogue keeps every previous song ID and imports exact active counts',async()=>{
 const {rows}=await db.query('select id from songs');const ids=new Set(rows.map(r=>r.id))
 for(const b of previous)for(const s of b.songs)assert.ok(ids.has(id(`${b.key}/${s.key}`)))
 const active=await as('authenticated',A,'select count(*)::int as n from songs join books on books.id=songs.book_id where catalogue_active')
 assert.equal(active[0].n,catalogue.reduce((n,b)=>n+b.songs.length,0))
})
await ok('owner creates profile and selects a book',async()=>{
 await as('authenticated',A,'insert into public.students(id,display_name) values ($1,$2)',[student,'Test pianist'])
 await as('authenticated',A,'insert into public.student_books(id,student_id,book_id) values ($1,$2,$3)',[sb,student,book])
})
await denied('a second child cannot be added for the same owner',()=>as('authenticated',A,"insert into public.students(display_name) values ('Second')"),'23505')
await denied('same book cannot be added twice',()=>as('authenticated',A,'insert into public.student_books(student_id,book_id) values ($1,$2)',[student,book]),'23505')
const insert='insert into public.assessments(id,student_book_id,song_id,stars,feedback) values ($1,$2,$3,$4,$5) returning *'
const first='40000000-0000-4000-a000-000000000001', second='40000000-0000-4000-a000-000000000002'
await ok('save and reload every assessment; latest is newest rather than best',async()=>{
 await as('authenticated',A,insert,[first,sb,song,3,'Well done'])
 await as('authenticated',A,insert,[second,sb,song,1,'New focus'])
 const rows=await as('authenticated',A,'select * from public.assessments order by assessed_at');assert.equal(rows.length,2);assert.equal(rows[0].feedback,'Well done')
 const newest=await as('authenticated',A,'select * from public.latest_assessments');assert.equal(newest.length,1);assert.equal(newest[0].id,second);assert.equal(newest[0].stars,1)
})
await denied('reusing an assessment UUID cannot duplicate a submission',()=>as('authenticated',A,insert,[second,sb,song,2,'retry']),'23505')
for(const stars of [0,4,-1]) await denied(`invalid stars ${stars} rejected by database`,()=>as('authenticated',A,insert,[crypto.randomUUID(),sb,song,stars,'']),'23514')
await denied('fractional stars rejected',()=>as('authenticated',A,insert,[crypto.randomUUID(),sb,song,1.5,'']),'22P02')
await denied('oversized feedback rejected',()=>as('authenticated',A,insert,[crypto.randomUUID(),sb,song,2,'x'.repeat(2001)]),'23514')
await denied('song from another book rejected',()=>as('authenticated',A,insert,[crypto.randomUUID(),sb,otherSong,2,'']),'23514')
for(const table of ['students','student_books','assessments','latest_assessments']) {
 await denied(`anonymous cannot read ${table}`,()=>as('anon',null,`select * from public.${table}`),'42501')
 await ok(`unrelated account sees no ${table}`,async()=>assert.equal((await as('authenticated',B,`select * from public.${table}`)).length,0))
}
await denied('anonymous cannot create progress',()=>as('anon',null,insert,[crypto.randomUUID(),sb,song,2,'']),'42501')
await denied('unrelated account cannot assess another child',()=>as('authenticated',B,insert,[crypto.randomUUID(),sb,song,2,'']))
await denied('unrelated account cannot attach a book to another child',()=>as('authenticated',B,'insert into public.student_books(student_id,book_id) values ($1,$2)',[student,id('1-lesson-us-2')]),'42501')
await denied('unrelated account cannot forge student ownership',()=>as('authenticated',B,"insert into public.students(owner_user_id,display_name) values ($1,'Forged')",[A]),'42501')
await denied('owner cannot transfer ownership',()=>as('authenticated',A,'update public.students set owner_user_id=$1 where id=$2',[B,student]),'42501')
await denied('owner cannot swap book relationships',()=>as('authenticated',A,'update public.student_books set book_id=$1 where id=$2',[id('1-lesson-us-2'),sb]),'42501')
await denied('owner cannot rewrite history',()=>as('authenticated',A,'update public.assessments set stars=3'),'42501')
await denied('owner cannot delete history',()=>as('authenticated',A,'delete from public.assessments'),'42501')
await denied('client cannot forge assessment time',()=>as('authenticated',A,"insert into public.assessments(student_book_id,song_id,stars,assessed_at) values ($1,$2,2,'2099-01-01')",[sb,song]),'42501')
for(const table of ['books','songs','catalogue_sources']){
 await denied(`anonymous cannot read catalogue ${table}`,()=>as('anon',null,`select * from public.${table}`),'42501')
 await denied(`authenticated cannot delete catalogue ${table}`,()=>as('authenticated',A,`delete from public.${table}`),'42501')
}
await ok('every exposed base table has RLS enabled',async()=>{
 const {rows}=await db.query("select relname,relrowsecurity from pg_class join pg_namespace n on n.oid=relnamespace where n.nspname='public' and relkind='r'")
 assert.equal(rows.length,6);assert.ok(rows.every(r=>r.relrowsecurity))
})
// Discard only local test fixtures before the empty-table design migration.
await db.exec('delete from public.assessments')
await db.exec(await readFile('supabase/migrations/202609250003_assessment_dimensions.sql','utf8'))
await ok('catalogue refresh preserves previous progress and hides old editions',async()=>{
 await db.exec(seedSQL())
 assert.equal((await as('authenticated',A,'select * from student_books')).length,1)
 assert.equal((await as('authenticated',A,'select catalogue_active from books where id=$1',[book]))[0].catalogue_active,false)
})
const insertDimensions='insert into public.assessments(id,student_book_id,song_id,fluency,dynamics,rhythm,feedback) values ($1,$2,$3,$4,$5,$6,$7) returning *'
const third=crypto.randomUUID()
await ok('save and reload different scores for all three dimensions; latest view includes them',async()=>{
 await as('authenticated',A,insertDimensions,[third,sb,song,3,2,1,'Three skills'])
 const rows=await as('authenticated',A,'select * from latest_assessments');assert.equal(rows[0].id,third);assert.equal(rows[0].fluency,3);assert.equal(rows[0].dynamics,2);assert.equal(rows[0].rhythm,1);assert.equal(rows[0].stars,undefined)
})
for(const index of [0,1,2]) for(const value of [0,4,null,1.5]) {
 const scores=[1,2,3];scores[index]=value
 await denied(`dimension ${index} rejects ${value}`,()=>as('authenticated',A,insertDimensions,[crypto.randomUUID(),sb,song,...scores,'']))
}
await denied('new overall-only submissions rejected',()=>as('authenticated',A,insert,[crypto.randomUUID(),sb,song,2,'']),'42703')
await denied('dimension assessment rejects wrong-book song',()=>as('authenticated',A,insertDimensions,[crypto.randomUUID(),sb,otherSong,1,2,3,'']),'23514')
await denied('anonymous cannot save dimension ratings',()=>as('anon',null,insertDimensions,[crypto.randomUUID(),sb,song,1,2,3,'']),'42501')
await denied('unrelated account cannot save dimension ratings',()=>as('authenticated',B,insertDimensions,[crypto.randomUUID(),sb,song,1,2,3,'']))
await ok('unrelated account cannot read new ratings through latest view',async()=>assert.equal((await as('authenticated',B,'select * from latest_assessments')).length,0))
await denied('duplicate dimension submission rejected',()=>as('authenticated',A,insertDimensions,[third,sb,song,1,2,3,'']),'23505')
await ok('reseed after a rating preserves its song reference and new catalogue order',async()=>{
 const selectedId=crypto.randomUUID(),ratingId=crypto.randomUUID(),oldBook=previous[0],oldSong=oldBook.songs[0]
 await as('authenticated',A,'insert into student_books(id,student_id,book_id) values ($1,$2,$3)',[selectedId,student,id(oldBook.key)])
 await as('authenticated',A,insertDimensions,[ratingId,selectedId,id(`${oldBook.key}/${oldSong.key}`),1,2,3,'Preserve this reference'])
 await db.exec(seedSQL());await db.exec(seedSQL())
 const [saved]=await as('authenticated',A,'select a.song_id,s.title,s.sort_order from assessments a join songs s on s.id=a.song_id where a.id=$1',[ratingId])
 assert.equal(saved.song_id,id(`${oldBook.key}/${oldSong.key}`));assert.equal(saved.title,'Roll Call');assert.equal(saved.sort_order,20)
})
await ok('edition correction removes unassessed mismatches and refuses to delete assessed songs',async()=>{
 const bookKey='all-in-two-2b-lesson-theory-anglicised',removedId=id(`${bookKey}/contents-boomboom`)
 assert.equal((await db.query('select id from songs where id=$1',[removedId])).rows.length,0)
 await db.exec(seedSQL([researched.find(b=>b.key===bookKey)]))
 const selectedId=crypto.randomUUID(),ratingId=crypto.randomUUID()
 await as('authenticated',A,'insert into student_books(id,student_id,book_id) values ($1,$2,$3)',[selectedId,student,id(bookKey)])
 await as('authenticated',A,insertDimensions,[ratingId,selectedId,removedId,1,2,3,'Do not delete'])
 await assert.rejects(db.exec(seedSQL()),e=>e.message.includes('excluded song has assessments'))
 await db.exec('rollback')
 assert.equal((await db.query('select id from assessments where id=$1',[ratingId])).rows.length,1)
 assert.equal((await db.query('select title from songs where id=$1',[removedId])).rows[0].title,'Boom Boom!')
})
await db.close();console.log(`${count} PostgreSQL checks passed. No remote database contacted.`)
