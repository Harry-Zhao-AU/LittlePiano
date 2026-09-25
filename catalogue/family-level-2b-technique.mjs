// Transcribed from the family's printed Progress Chart photo, 2026-09-25.
export const level2bTechniquePhotoSource='urn:little-piano:family-photo:2026-09-25:level-2b-technique-performance:1'
const rows=[
 ['Arms with Weights','4','Arm Weight'],
 ['Small Wrist Lift','4','Slur Gesture'],
 ['Travelling Thumb','5','Light, Active Thumb'],
 ['Pedal Rhythms','5','Connected Pedalling'],
 ['Moon Buggy','6'],
 ['R.H. Brush Stroke','7'],['L.H. Brush Stroke','7'],
 ['Chinese Painting','8','Etude'],
 ['Fruit Drop Warm-ups','9'],
 ['Recital Sonatina','10-11','Performance'],
 ['Caballero Warm-ups','12'],
 ['The Caballero’s Stallion','13','Etude'],
 ['Dragon Dance','14-15','Performance'],
 ['Bicycle Built for 6','16'],
 ['The Hurdy-Gurdy','17','Etude'],
 ['Aria (Theme from La Traviata)','18-19','Performance'],
 ['Jazz Cat Patterns','20'],['Jazz Cat Jumps','20'],
 ['House of Mirrors','21','Etude'],
 ['Chords by the Bay','22'],
 ['Snow Globe Waltz','23','Etude'],
 ['Winter Wind','24-25','Performance'],
 ['Vive la G Major','26'],
 ['Camptown Chords','27'],
 ['Little Dance','28','Etude'],
 ['Mexican Tambourines','29-31','Performance'],
 ['Pedal Pushers','32'],
 ['Tower Bells','33','Etude'],
 ['Cat Prowl','34-35','Performance'],
 ['Equal Partners','36'],
 ['Moonlit Pasture','37','Etude'],
 ['Dudelsack','38','Performance'],
 ['Rockin’ Bagpipes','38-39','Performance'],
 ['Deck the Room… with Dotted Crotchets','40'],
 ['Kum Ba Yah','41','Etude'],
 ['The Notorious Pirate','42-43','Performance'],
 ['Daily Dozen Lazy Chords','44'],
 ['Melody for the Left Hand','45','Etude'],
 ['In My Red Convertible','46-47','Performance'],
 ['Obstacle Course in F Major','48'],
 ['Half Daily Dozen','49'],
 ['Grand Etude in F Major','50-51','Etude'],
 ['Classic Sonatina — 1. Allegro','52-53','Performance'],
 ['Classic Sonatina — 2. Andante','54-55','Performance'],
 ['Classic Sonatina — 3. Presto','56-57','Performance'],
 ['Major Cross-Hand Arpeggios','58-59','Reference section'],
 ['Major Scales and Primary Chords: C, G, F, D, A, E, and B','60-63','Reference section'],
]
const normalize=s=>s.normalize('NFKD').replace(/[^a-z0-9]/gi,'').toLowerCase()
export function reconcileLevel2bTechniquePhoto(book){
 const used=new Set()
 const songs=rows.map(([title,page_range,chart_context],index)=>{
  const old=book.songs.find(s=>normalize(s.title)===normalize(title))
  if(old)used.add(old.key)
  const [start,end=start]=page_range.split('-').map(Number)
  const page_number=start===end?start:old?.page_number>=start&&old.page_number<=end?old.page_number:null
  return {key:old?.key??`photo-${normalize(title)}`,title,page_number,page_range,chart_context:chart_context??null,sort_order:(index+1)*10,source_url:level2bTechniquePhotoSource,additional_sources:old?[old.source_url,...(old.additional_sources??[])]:[]}
 })
 const missing=book.songs.filter(s=>!used.has(s.key))
 if(missing.length)throw Error('Unreconciled Level 2B Technique entries: '+missing.map(s=>s.title).join(', '))
 return {...book,songs,sources:[...book.sources,level2bTechniquePhotoSource],catalogue_status:'verified_complete',catalogue_notes:'Complete learning entries from the family’s Level 2B Technique & Performance Progress Chart. Includes four Technique Secrets and both starred reference rows; certificate excluded. R.H./L.H. Brush Stroke and Jazz Cat exercises are split. Classic Sonatina is represented by its three named movements, without duplicating the parent heading. Uses only the Technique & Performance page column. Printed ranges are retained without guessing individual start pages. Cover, ISBN and printing are not visible and remain unconfirmed from this photo.'}
}
