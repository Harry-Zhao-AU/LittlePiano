// Family photo: Level 1 Technique & Performance Progress Chart, 2026-09-25.
export const techniquePhotoSource='urn:little-piano:family-photo:2026-09-25:level-1-technique-performance:1'
const rows=[
 ['Hand Cups','4','Round Hand Shape'],
 ['Wrist Float-off','4','Relaxed Wrist'],
 ['Woodpecker Taps','5','Light Hand Bounce'],
 ['Silent Play','5','Finger Independence'],
 ['Canoe Ride','6'],['Kayak Ride','6'],
 ['Ferris Wheel Up','7'],['Ferris Wheel Down','7'],
 ['Jumping Bean Race No. 1','8'],['Jumping Bean Race No. 2','8'],
 ['Mouse Hunt for Cheese','9','Etude'],
 ['Finger Games','10'],
 ['Legato Etude','11'],['Legato/Staccato Etude','11'],
 ['The Wild Colt','12-13','Performance'],
 ['No Rain on My Spaceship','14'],
 ['Above the Pines','15','Etude'],
 ['The Clock Shop','16-17','Performance'],
 ['Paper Airplane Flight','18'],
 ['Two Songbirds','19','Etude'],
 ['I’m a Fine Musician','20-21','Performance'],
 ['Horse Path','22'],
 ['Mixed-Up Intervals','23'],
 ['A Merry March','24','Etude'],
 ['Pastel Painting','25','Etude'],
 ['Legend of the Buffalo','26-27','Performance'],
 ['Playing by the Stream','28'],
 ['Robot in the Dark','29'],
 ['Kaleidoscope Colours','30-31','Performance'],
 ['Magic Sparkles','32'],
 ['Crazy Clown','33','Etude'],
 ['A Sunny Parade','34-35','Performance: Two Little Marches'],
 ['A Rainy Parade','34-35','Performance: Two Little Marches'],
 ['Jumps and Slides','36'],
 ['Journey by Camel','37','Performance'],
 ['C Chord Warm-up','38'],['C Chord Study','38'],
 ['Carousel','39','Etude'],
 ['Hill and Gully Rider','40-41','Performance'],
 ['Little Star Chords','42'],
 ['The Frog Prince','43','Etude'],
 ['Walking Bass Etude','44-45','Etude'],
 ['Walking Bass with Chords!','44-45','Etude'],
 ['I’ve Got Music','46-47','Performance'],
 ['Backstage Warm-up','48'],
 ['Tick-Tock Etude','49','Etude'],
 ['Pop! Goes the Weasel','50-51','Performance'],
 ['The San Francisco Trolley','52-53','Performance'],
 ['Adventure Warm-ups with Major 5-Finger Scales','54-55','Challenge section'],
]
const normalize=s=>s.normalize('NFKD').replace(/[^a-z0-9]/gi,'').toLowerCase()
export function reconcileTechniquePhoto(book){
 const used=new Set()
 const songs=rows.map(([title,page_range,chart_context],index)=>{
  const old=book.songs.find(s=>normalize(s.title)===normalize(title))
  if(old)used.add(old.key)
  const [start,end=start]=page_range.split('-').map(Number)
  const page_number=start===end?start:old?.page_number>=start&&old.page_number<=end?old.page_number:null
  return {key:old?.key??`photo-${normalize(title)}`,title,page_number,page_range,chart_context:chart_context??null,sort_order:(index+1)*10,source_url:techniquePhotoSource,additional_sources:old?[old.source_url,...(old.additional_sources??[])]:[]}
 })
 const missing=book.songs.filter(s=>!used.has(s.key))
 if(missing.length)throw Error('Unreconciled Technique entries: '+missing.map(s=>s.title).join(', '))
 return {...book,songs,sources:[...book.sources,techniquePhotoSource],catalogue_status:'verified_complete',catalogue_notes:'Complete learning entries from the family’s photographed Level 1 Technique & Performance Progress Chart. Includes four Technique Secrets and the Challenge Section; excludes the certificate. Combined named exercises are split for individual assessment (including Up/Down and numbered variants); chart ranges are preserved without guessing individual start pages. Uses the Technique & Performance column, not Lesson & Theory cross-references. Cover, ISBN and printing are not visible; edition metadata remains provisional pending a cover/copyright photo.'}
}
