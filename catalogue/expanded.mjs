import {catalogue as original} from './requested.mjs'
import {myFirstContents} from './my-first-contents.mjs'
import {supplementPreviews} from './preview-supplements.mjs'
import audio from './audio-listings.json' with {type:'json'}

const normalize=s=>s.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/gi,'').toLowerCase()
const aliases={
 'cookiesjourneyupthemountain':'cookiesjourney',
 'constructionzonesteamshovelforlh':'constructionzone'
}
function mergeRows(book,entries) {
 const used=new Set()
 const rows=entries.map((entry,i)=>{
  const titleKey=normalize(entry.title)
  const old=book.songs.find(s=>!used.has(s.key) && normalize(s.title)===(aliases[titleKey]||titleKey))
  const key=old?.key||`contents-${titleKey}`
  if(old)used.add(old.key)
  return {...entry,key,sort_order:(i+1)*10,page_number:entry.page_number??old?.page_number??null,
   // Preserve independent page evidence when a new source supplies only the title/order.
   additional_sources:old && old.source_url!==entry.source_url?[old.source_url]:[]}
 })
 const missing=book.songs.filter(s=>!used.has(s.key))
 return {rows,missing}
}
export const catalogue=original.map(book=>{
 const first=book.key.match(/^my-first-([abc])-/)
 if(first) {
  const {rows,missing}=mergeRows(book,myFirstContents[first[1]])
  if(missing.length)throw Error(`Unreconciled old entries in ${book.key}: ${missing.map(s=>s.title)}`)
  return {...book,songs:rows,sources:[...new Set([...book.sources,...rows.map(s=>s.source_url)])],catalogue_status:'verified_complete',
   catalogue_notes:'Complete page-indexed learning entries from the publisher’s two-page Progress Chart: pieces, exercises, and learning activities. Excludes Writing Book references, audio-only tracks, certificates and reference-library pages.'}
 }
 const match=book.key.match(/^all-in-two-(1|2a|2b|3)-lesson-theory-/)
 if(match) {
  const listing=audio[match[1]]
  const entries=listing.titles.map(title=>({title,source_url:listing.source_url}))
  const {rows,missing}=mergeRows(book,entries)
  // Retain the separately verified p17 exercise before the known p20 piece.
  // Full placement relative to unpaginated audio entries remains unverified.
  for(const s of missing) {
   const next=rows.findIndex(r=>r.page_number!==null&&r.page_number>s.page_number)
   rows.splice(next<0?rows.length:next,0,{...s,additional_sources:[]})
  }
  return {...book,songs:rows.map((s,i)=>({...s,sort_order:(i+1)*10})),sources:[...book.sources,listing.source_url],
   catalogue_notes:`Publisher All-in-Two audio-index sequence, with practice-speed duplicates removed. Full printed contents and most page numbers remain unverified.${missing.length?' Supplemental exercises are placed before the next verified page; their exact position among unpaginated entries is not confirmed.':''}`}
 }
 return book
}).map(supplementPreviews)
