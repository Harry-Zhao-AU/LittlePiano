import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'

export async function testManagement({db,as,ok,denied,A,B,student,sb,song,third,insertDimensions,awardSQL,award}){
 const before=(await db.query('select * from assessments order by id')).rows
 const certificates=(await db.query('select * from certificates order by id')).rows
 await db.exec(await readFile('supabase/migrations/202609270007_everyday_management.sql','utf8'))
 await ok('v0.2 migration preserves populated assessments and certificate snapshots',async()=>{
  assert.deepEqual((await db.query('select * from assessments order by id')).rows,before)
  assert.deepEqual((await db.query('select * from certificates order by id')).rows,certificates)
  assert.equal((await as('authenticated',A,'select * from effective_assessments')).length,before.length)
 })
 await ok('owner renames profile without rewriting certificate snapshots',async()=>{
  const [row]=await as('authenticated',A,'update students set display_name=$1 where id=$2 returning *',['New pianist',student])
  assert.equal(row.display_name,'New pianist')
  assert.deepEqual((await db.query('select * from certificates order by id')).rows,certificates)
 })
 await ok('unrelated account cannot rename another child',async()=>assert.equal((await as('authenticated',B,"update students set display_name='Forged' returning *")).length,0))
 await denied('anonymous cannot rename profile',()=>as('anon',null,"update students set display_name='Forged'"),'42501')
 for(const column of ['id','owner_user_id','created_at'])await denied(`profile ${column} remains immutable`,()=>as('authenticated',A,`update students set ${column}=${column}`),'42501')
 for(const value of ['','   ','x'.repeat(81)])await denied('invalid profile name rejected',()=>as('authenticated',A,'update students set display_name=$1',[value]),'23514')
 const archive=(user,value)=>as('authenticated',user,'select (public.set_book_archived($1,$2)).*',[sb,value])
 await denied('unrelated account cannot archive or restore book',()=>archive(B,true),'42501')
 await denied('anonymous cannot archive book',()=>as('anon',null,'select public.set_book_archived($1,true)',[sb]),'42501')
 await denied('browser cannot directly update selected-book relationships',()=>as('authenticated',A,'update student_books set book_id=book_id'),'42501')
 await denied('null archive action rejected',()=>archive(A,null),'22023')
 await ok('archive is repeatable and retains selected row and history',async()=>{
  const [first]=await archive(A,true),[again]=await archive(A,true)
  assert.ok(first.archived_at);assert.deepEqual(first,again)
  assert.deepEqual((await db.query('select * from assessments order by id')).rows,before)
  assert.deepEqual((await db.query('select * from certificates order by id')).rows,certificates)
 })
 await denied('archived book blocks new practice',()=>as('authenticated',A,insertDimensions,[crypto.randomUUID(),sb,song,2,2,2,'']),'23514')
 await denied('archived book blocks new certificate',()=>as('authenticated',A,awardSQL,[crypto.randomUUID(),...award.slice(1)]),'23514')
 await ok('unrelated special award remains possible while book archived',async()=>{
  await as('authenticated',A,awardSQL,[crypto.randomUUID(),student,null,null,'special','awesome','New pianist','Great effort','','Dad','2026-09-27'])
 })
 const reviseSQL='select * from public.revise_assessment($1,$2,$3,$4,$5,$6,$7,$8)'
 const revision=crypto.randomUUID(),args=[revision,third,0,2,3,2,'Correction',false]
 const revise=(values,user=A)=>as('authenticated',user,reviseSQL,values)
 await denied('unrelated user cannot revise assessment',()=>revise(args,B),'42501')
 await denied('anonymous cannot revise assessment',()=>as('anon',null,reviseSQL,args),'42501')
 await ok('correction works while archived and preserves original practice time and row',async()=>{
  const [r]=await revise(args);assert.equal(r.revision_number,1)
  const [effective]=await as('authenticated',A,'select * from effective_assessments where id=$1',[third])
  const original=before.find(a=>a.id===third)
  assert.deepEqual(effective.assessed_at,original.assessed_at);assert.equal(effective.fluency,2);assert.equal(effective.feedback,'Correction')
  assert.deepEqual((await db.query('select * from assessments order by id')).rows,before)
 })
 await ok('identical revision retry returns one saved revision',async()=>{
  const [r]=await revise(args);assert.equal(r.id,revision)
  assert.equal((await as('authenticated',A,'select * from assessment_revisions')).length,1)
 })
 await denied('same UUID with changed payload rejected',()=>revise([revision,third,0,1,3,2,'Correction',false]),'22023')
 await denied('stale edit rejected instead of overwriting correction',()=>revise([crypto.randomUUID(),third,0,1,1,1,'Stale',false]),'40001')
 for(const scores of [[0,2,2],[2,4,2],[2,2,null],[1.5,2,2]])await denied('invalid revision scores rejected',()=>revise([crypto.randomUUID(),third,1,...scores,'Invalid',false]))
 await denied('overlong corrected feedback rejected',()=>revise([crypto.randomUUID(),third,1,2,2,2,'x'.repeat(2001),false]),'23514')
 await denied('null exclusion rejected',()=>revise([crypto.randomUUID(),third,1,2,2,2,'',null]),'23502')
 await denied('negative expected revision rejected',()=>revise([crypto.randomUUID(),third,-1,2,2,2,'',false]),'22023')
 for(const table of ['assessment_revisions','effective_assessments','latest_assessments']){
  await ok(`unrelated account cannot read ${table}`,async()=>assert.equal((await as('authenticated',B,`select * from ${table}`)).length,0))
  await denied(`anonymous cannot read ${table}`,()=>as('anon',null,`select * from ${table}`),'42501')
 }
 await denied('direct revision inserts cannot forge edit history or timestamps',()=>as('authenticated',A,"insert into assessment_revisions(id,assessment_id,revision_number,fluency,dynamics,rhythm,feedback,excluded,created_at) values ($1,$2,99,3,3,3,'',false,'2099-01-01')",[crypto.randomUUID(),third]),'42501')
 await denied('revisions cannot be updated',()=>as('authenticated',A,'update assessment_revisions set fluency=1'),'42501')
 await denied('revisions cannot be deleted',()=>as('authenticated',A,'delete from assessment_revisions'),'42501')
 await denied('original ratings cannot be rewritten',()=>as('authenticated',A,'update assessments set fluency=1'),'42501')
 await ok('legacy catalogue selection can be restored without duplicate rows',async()=>{
  const count=(await db.query('select count(*) from student_books')).rows[0].count
  const [restored]=await archive(A,false);assert.equal(restored.archived_at,null)
  await archive(A,false)
  assert.equal((await db.query('select count(*) from student_books')).rows[0].count,count)
 })
 const newer=crypto.randomUUID()
 await ok('new practice and awards work after restoration',async()=>{
  await as('authenticated',A,insertDimensions,[newer,sb,song,1,1,1,'Later practice'])
  await as('authenticated',A,awardSQL,[crypto.randomUUID(),...award.slice(1)])
 })
 const current=()=>as('authenticated',A,'select * from latest_assessments where student_book_id=$1 and song_id=$2',[sb,song])
 await ok('correcting an older assessment never makes it latest',async()=>{
  await revise([crypto.randomUUID(),third,1,3,3,3,null,false])
  assert.equal((await current())[0].id,newer)
  assert.equal((await as('authenticated',A,'select feedback from effective_assessments where id=$1',[third]))[0].feedback,null)
 })
 await ok('retry of old committed revision succeeds even after another edit',async()=>assert.equal((await revise(args))[0].revision_number,1))
 await ok('excluding latest restores previous effective scores',async()=>{
  await revise([crypto.randomUUID(),newer,0,1,1,1,'Later practice',true])
  const [row]=await current();assert.equal(row.id,third);assert.equal(row.fluency,3)
 })
 await ok('excluding every entry makes song unassessed but retains history',async()=>{
  await revise([crypto.randomUUID(),third,2,3,3,3,null,true])
  assert.equal((await current()).length,0)
  assert.equal((await as('authenticated',A,'select * from effective_assessments where student_book_id=$1 and song_id=$2',[sb,song])).length,2)
 })
 await ok('restoring preserves original ordering and edit history',async()=>{
  await revise([crypto.randomUUID(),newer,1,1,1,1,'Later practice',false])
  const [row]=await current();assert.equal(row.id,newer);assert.equal(row.fluency,1)
  assert.equal((await as('authenticated',A,'select * from assessment_revisions where assessment_id=$1',[newer])).length,2)
 })
 await ok('revision table has RLS enabled',async()=>assert.equal((await db.query("select relrowsecurity from pg_class where relname='assessment_revisions'")).rows[0].relrowsecurity,true))
}
