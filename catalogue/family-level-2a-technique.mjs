// Family's Level 2A Technique & Performance Progress Chart, 2026-09-25.
export const level2aTechniquePhotoSource='urn:little-piano:family-photo:2026-09-25:level-2a-technique-performance:1'
const rows=[
 ['Round Bird House','4','Firm Fingertips'],
 ['Teamwork','4','Hands-Together Skill'],
 ['Dancing Thumb','5','Light Thumb'],
 ['Finger Speed','5','Fast Fingers'],
 ['Making Rainbows','5','Wrist Float-Off'],
 ['Busy Places! — The Market','6-7','Busy Places: subsection title and exact page verified in publisher preview'],
 ['Busy Places! — The Train Station','6-7','Busy Places: subsection title and exact page verified in publisher preview'],
 ['Run and Hop','8'],['Run, Hop, and Leap','8'],
 ['Race Car Etude','9','Etude'],
 ['Five-Note Sonatina','10-11','Performance'],
 ['Mr. Haydn’s R.H. Pattern','12'],['Mr. Haydn’s L.H. Pattern','12'],
 ['Colourful Sunset','13','Etude'],
 ['Hunter’s Chorus','14-15','Performance'],
 ['The Storm and the Rainbow','16-17','Performance'],
 ['Beethoven’s Phrases','18'],
 ['The Brave Knight','19','Etude'],
 ['Mr. McGill’s Boop Sha-Bop!','20-21','Performance'],
 ['Semitone Sleuth','22'],
 ['Star Traveller','23','Etude'],
 ['The Loch Ness Monster','24-25','Performance'],
 ['Let’s Play in D!','26'],
 ['Sonatina in D','27','Etude'],
 ['March of the English Guard','28-29','Performance'],
 ['Let’s Play in A!','30'],
 ['Neverland Waltz','31','Etude'],
 ['Mountain Train','32','Performance'],
 ['The Explorer — Spotting a Bear','34','Dm'],
 ['The Explorer — Soft Rain','34','Gm'],
 ['The Explorer — Finding a Cave','35','Am'],
 ['The Explorer — Comet in the Sky!','35','Cm'],
 ['Malagueña','36-37','Performance'],
 ['Walk in a Rainbow','38-39','Performance'],
 ['Dance of the Irish','40-41','Performance'],
 ['All 12 Major 5-Finger Scales on the Grand Stave','42-45','Reference section: C-G-F, D-A-E, D♭-A♭-E♭, F♯(G♭)-B♭-B'],
 ['The 7 White-Key Minor 5-Finger Scales on the Grand Stave','46-47','Reference section: Cm-Gm-Fm, Dm-Am-Em, Bm'],
]
const normalize=s=>s.normalize('NFKD').replace(/[^a-z0-9]/gi,'').toLowerCase()
export function reconcileLevel2aTechniquePhoto(book){
 const used=new Set()
 const songs=rows.map(([title,page_range,chart_context],index)=>{
  const old=book.songs.find(s=>normalize(s.title)===normalize(title))
  if(old)used.add(old.key)
  const [start,end=start]=page_range.split('-').map(Number)
  const page_number=start===end?start:old?.page_number>=start&&old.page_number<=end?old.page_number:null
  return {key:old?.key??`photo-${normalize(title)}`,title,page_number,page_range,chart_context:chart_context??null,sort_order:(index+1)*10,source_url:level2aTechniquePhotoSource,additional_sources:old?[old.source_url,...(old.additional_sources??[])]:[]}
 })
 const missing=book.songs.filter(s=>!used.has(s.key))
 if(missing.length)throw Error('Unreconciled Level 2A Technique entries: '+missing.map(s=>s.title).join(', '))
 return {...book,songs,sources:[...book.sources,level2aTechniquePhotoSource],catalogue_status:'verified_complete',catalogue_notes:'All learning rows in the family’s Level 2A Technique & Performance Progress Chart are represented. Includes five Technique Secrets, four Explorer pieces, and both starred scale-reference rows; certificate excluded. Combined named exercises are split. Busy Places spans pages 6–7: its two previously verified page-6 exercises are retained; the chart does not name any further subsections on page 7, so this is chart-level completeness, not verification of every subsection. Uses the Technique & Performance column; ranges do not imply exact start pages. Cover, ISBN and printing remain unconfirmed from this photo.'}
}
