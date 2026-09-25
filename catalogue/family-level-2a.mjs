// Family photograph of the printed Level 2A Lesson & Theory Progress Chart.
export const level2aPhotoSource='urn:little-piano:family-photo:2026-09-25:level-2a-lesson-theory:1'
const rows=[
 ['Get Ready for Take-off! (Level 1 Review)','4-5'],
 ['Note Reading Guide','6-7'],
 ['When the Saints Go Marching In','8-9'],
 ['Quavers','10'],
 ['Famous People','11'],
 ['Skip to My Lou','12-13','THEORY: Fiddle to My Quavers'],
 ['Leftover Popcorn','14-15','THEORY: The Popcorn Bowl'],
 ['A Minuet for Mr. Bach’s Children','16-17'],
 ['THEORY: A Jazzy Song for Mr. Bach','18-19'],
 ['Mr. Brahms’ Famous Lullaby','20-21'],
 ['THEORY: Mr. Brahms’ Time Signature Game, Eye-Training/Ear-Training','22-23'],
 ['Ice Cream','24'],['More Ice Cream','24'],
 ['Mr. Haydn’s Theme','25'],
 ['THEORY: Eye-Training with Haydn','26'],
 ['THEORY: Ear-Training with Bach, Beethoven, and Brahms','27'],
 ['My Daydream','28-29'],
 ['The Clock Strikes Thirteen!','30'],
 ['The Elf’s Silver Hammer','31'],
 ['THEORY: Crescendo and Diminuendo, Eye-Training/Ear-Training','32-33'],
 ['Ode to Joy','34-35'],
 ['I Am the King','36'],
 ['THEORY: I Am the Phrase Finder!','37'],
 ['Moonlight Melody','38'],
 ['THEORY: You Can Compose!','39'],
 ['The Puppet Show','40-41','THEORY: The Puppet Show, Playful Puppets'],
 ['Our Detective Agency','42-43'],
 ['Storms on Saturn','44-45'],
 ['THEORY: Moon Shadows Improv, Planets and Moons','46-47'],
 ['D 5-Finger Scale','48'],
 ['Hiking with Friends','49'],
 ['This R.H. Old Man','50','Shares chart row with This L.H. Old Man','This Old Man'],
 ['This L.H. Old Man','50'],
 ['THEORY: Writing for the D Scale','51'],
 ['Spring (from The Four Seasons)','52',null,'Spring'],
 ['THEORY: A Short Story about Antonio Vivaldi','53'],
 ['Pirate of the North Sea','54-55'],
 ['The Queen’s Royal Entrance','56-57'],
 ['A 5-Finger Scale','58'],['Hiking with Snacks','58'],
 ['Peter Pan’s Flight','59'],
 ['THEORY: Writing for the A Scale','60'],
 ['THEORY: Peter Pan’s Key Flight','61'],
 ['Boogie Woogie Band','62-63'],
 ['Whirling Leaves','64-65'],
 ['THEORY: Whirling Leaves Improv, Eye-Training/Ear-Training','66-67'],
 ['Changing Moods','68-69'],
 ['Sword Dance','70-71'],
 ['In an Old Castle','72-73'],
 ['THEORY: Major and Minor Sounds','74-75'],
 ['The Horseman’s Night Ride','76-77'],
 ['Jazz Blast','78-79'],['Jazz Blast Improvisation','78-79'],
 ['Minor Chords: Cm, Gm, Dm, and Am','80-81',null,'Minor Chords-Cm, Gm, Dm, Am'],
 ['What’s a Lead Sheet?','82'],
 ['Lead Sheet for Go Tell Aunt Rhody','83',null,'Go Tell Aunt Rhody'],
 ['Snake Charmer','84-85'],
 ['Adventure Scale and Chord Warm-Ups','86-87','C-G-F, D-A-E, D♭-A♭-E♭, F♯(G♭)-B♭-B'],
]
const normalize=s=>s.normalize('NFKD').replace(/[^a-z0-9]/gi,'').toLowerCase()
export function reconcileLevel2aPhoto(book){
 const used=new Set()
 const songs=rows.map(([title,page_range,chart_context,alias],index)=>{
  const old=book.songs.find(s=>normalize(s.title)===normalize(alias??title))
  if(old)used.add(old.key)
  const [start,end=start]=page_range.split('-').map(Number)
  const page_number=start===end?start:old?.page_number>=start&&old.page_number<=end?old.page_number:null
  return {key:old?.key??`photo-${normalize(title)}`,title,page_number,page_range,chart_context:chart_context??null,sort_order:(index+1)*10,source_url:level2aPhotoSource,additional_sources:old&&normalize(old.title)===normalize(title)?[old.source_url,...(old.additional_sources??[])]:[]}
 })
 const missing=book.songs.filter(s=>!used.has(s.key))
 if(missing.length)throw Error('Unreconciled Level 2A entries: '+missing.map(s=>s.title).join(', '))
 return {...book,songs,sources:[...book.sources,level2aPhotoSource],catalogue_status:'verified_complete',catalogue_notes:'Complete learning entries from the family’s photographed Level 2A Lesson & Theory Progress Chart. Includes standalone theory and Adventure Scale and Chord Warm-Ups; certificate excluded. Paired theory remains chart context. Named pieces sharing rows are split. The former This Old Man entry now identifies This R.H. Old Man; This L.H. Old Man is added separately. Uses the Lesson & Theory column only. Ranges are retained without guessing exact start pages. Cover, ISBN and printing are not visible; edition metadata remains provisional pending a cover/copyright photo.'}
}
