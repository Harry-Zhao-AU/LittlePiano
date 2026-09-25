export const level2bPhotoSource='urn:little-piano:family-photo:2026-09-25:level-2b-lesson-theory:1'
// Printed Lesson & Theory column; companion-book references are not lesson pages.
const rows=[
 ['Get Ready for Take-off! (Level 2A Review)','4-5'],
 ['Moon Walker','6'],['Almost Like a Dream','7'],
 ['Captain Hook’s Rockin’ Party','8-9','THEORY: “Sea” Notes!'],
 ['Sounds from the Fruit Drop Factory','10-11','THEORY: Fruit Drop Intervals'],
 ['Cross-Hand Arpeggios','12-13'],['Spanish Caballero','14-15'],
 ['THEORY: Caballero Chords and Arpeggios, Arpeggio Endings','16-17'],
 ['Sixth Hour','18'],['Freight Train Rumble','19'],['Shave and a Haircut','20-21'],
 ['THEORY: Sixths on the Keyboard, Freight Train Sixths','22-23'],
 ['C Scale Warm-ups','24-25'],['Jumpin’ Jazz Cat','26-27'],
 ['THEORY: Build the C Major Scale, Complete the Melodies','28-29'],
 ['Down by the Bay','30-31'],['The Ice Skaters','32-33'],
 ['THEORY: I and V7 Chord Talk, Picnic by the Bay, Ice Spinners Waltz','34-35'],
 ['G Scale Warm-ups','36-37'],['Vive la France!','38-39'],
 ['THEORY: Build the G Major Scale, Complete the Melodies','40-41'],
 ['I’ve Got Peace Like a River','42'],['Deep River','43'],
 ['Horse-Drawn Carriage','44-45'],
 ['THEORY: I and V7 Chord Talk in G, Musical Terms Review, Carriage Sounds','46-47'],
 ['Three Rules for Pedalling, Pedal Warm-ups','48'],
 ['Pedal Power','49'],['Beach Party','50-51'],['Riding the Wind','52-53'],
 ['Pumpkin Boogie','54-55'],
 ['THEORY: Drawing a Quaver Rest, All Kinds of Rests','56-57'],
 ['Deck the Keys','58-59'],['God Save the Queen','60-61'],
 ['Lead Sheet for Hey, Ho, Nobody Home','62-63',null,'Hey, Ho, Nobody Home'],
 ['THEORY: Two-Handed Rhythms, Hey, Ho, Somebody Home','64-65'],
 ['Chord Jumps','66'],['Lazy Chord Blues','67'],
 ['THEORY: Measure the I, IV, and V7 Chords, The Harvesters','68-69'],
 ['New World Symphony Theme','70-71'],['Duke of York Strut','72-73'],
 ['THEORY: The Duke of Chords and His Men, Minuet in G','74-75'],
 ['Canoeing in the Moonlight','76-77'],['F Scale Warm-ups','78-79'],
 ['Turkish March','80-81'],['Latin Sounds','82'],['Aria','83'],
 ['THEORY: Build the F Major Scale, One Final Tune to Guess!','84-85'],
 ['Auld Lang Syne','86-87'],
]
const normalize=s=>s.normalize('NFKD').replace(/[^a-z0-9]/gi,'').toLowerCase()
export function reconcileLevel2bPhoto(book){
 const used=new Set()
 const songs=rows.map(([title,page_range,chart_context,alias],index)=>{
  const old=book.songs.find(s=>normalize(s.title)===normalize(alias??title))
  if(old)used.add(old.key)
  const [start,end=start]=page_range.split('-').map(Number)
  const page_number=start===end?start:old?.page_number>=start&&old.page_number<=end?old.page_number:null
  return {key:old?.key??`photo-${normalize(title)}`,title,page_number,page_range,chart_context:chart_context??null,sort_order:(index+1)*10,source_url:level2bPhotoSource,additional_sources:old&&normalize(old.title)===normalize(title)?[old.source_url,...(old.additional_sources??[])]:[]}
 })
 const removed=book.songs.filter(s=>!used.has(s.key))
 if(removed.length!==2||removed.some(s=>!['Camptown Races Duet','Boom Boom!'].includes(s.title)))throw Error('Unexpected unmatched Level 2B entries')
 return {...book,songs,retired_song_keys:removed.map(s=>s.key),sources:[...book.sources,level2bPhotoSource],catalogue_status:'verified_complete',catalogue_notes:'Complete learning rows from the family’s Level 2B Lesson & Theory Progress Chart. Includes standalone theory and warm-ups; paired theory remains chart context and the certificate is excluded. Uses only the Lesson & Theory column. Camptown Races Duet and Boom Boom! from the earlier audio list are absent from this chart and removed, not renamed as the different printed pieces I’ve Got Peace Like a River and Deep River. Printed ranges are retained without guessing exact start pages. Cover, ISBN and printing remain unconfirmed from this photo.'}
}
