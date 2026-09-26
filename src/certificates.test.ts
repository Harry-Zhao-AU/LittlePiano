import {describe,it,expect} from 'vitest'
import {validateCertificate,certificateFilename,templates,type Certificate} from './certificates'
const row:Certificate={id:'id',student_id:'student',book_id:'book',song_id:null,kind:'book',template_id:'piano-party',template_version:1,child_name:'Mia',title:'Book A',message:'',awarded_by:'Dad',awarded_on:'2026-09-26'}
describe('certificate snapshots',()=>{
 it('accepts a parent-issued book certificate without ratings',()=>expect(()=>validateCertificate(row)).not.toThrow())
 it('supports a special award without a book',()=>expect(()=>validateCertificate({...row,kind:'special',template_id:'little-star',book_id:null,message:'Lovely effort'})).not.toThrow())
 it.each([
  {child_name:''},{awarded_by:' '},{title:'x'.repeat(161)},{message:'x'.repeat(301)},
  {awarded_on:'2026-02-30'},{awarded_on:'bad'},{template_id:'little-star'},
  {template_version:2},{book_id:null},{song_id:'song'},{message:'not for book'}
 ])('rejects invalid fields %j',change=>expect(()=>validateCertificate({...row,...change})).toThrow())
 it('all template IDs are unique',()=>expect(new Set(templates.map(t=>t.id)).size).toBe(templates.length))
 it('uses a safe download filename',()=>expect(certificateFilename({...row,child_name:'Mia / <3'})).toBe('certificate-Mia----3-2026-09-26.pdf'))
})
