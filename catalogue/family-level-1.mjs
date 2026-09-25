// Transcribed from the family's photo of the printed Progress Chart, 2026-09-25.
// The photo is research evidence only and is not copied into the application.
export const photoSource='urn:little-piano:family-photo:2026-09-25:level-1-lesson-theory:1'
// Chart page spans are retained verbatim. Paired theory is part of its chart row.
const rows=[
 ['Get Ready for Take-off! (Primer Review)','4-5'],
 ['Learn the Treble and Bass Clef Lines','6-7'],
 ['Firefly','8-9','Review Piece'],
 ['Little River','10-11','THEORY: River Notes'],
 ['Sailing in the Sun','12-13','THEORY: Sailing Melodies'],
 ['Ferris Wheel','14-15'],
 ['THEORY: Eye-Training/Ear-Training','16'],
 ['Jumping Beans','17',null,'Mexican Jumping Beans'],
 ['The Haunted Mouse','18-19','THEORY: Two-Handed Rhythms'],
 ['Classic Dance','20'],
 ['Young Hunter','21'],
 ['Skipping in Space','22-23','THEORY: Planets in Space'],
 ['Half-Time Show','24-25','THEORY: You Complete the Music!'],
 ['The Lonely Pine','26'],
 ["Li’l Liza Jane",'27'],
 ['Cs Rock!','28-29','THEORY: Break-Out Boogie',"C's Rock!"],
 ["Mozart’s Five Names",'30-31','THEORY: Drawing Stems and Mozart’s Story'],
 ['Paper Airplane','32-33','THEORY: Paper Airplane Flight'],
 ['The Juggler','34-35','THEORY: Juggling Tunes'],
 ['Traffic Jam 2nds','36-37','THEORY: Honk for 2nds!'],
 ['Double-Decker Bus','38','THEORY: Ear-Training'],
 ['This Is Not Jingle Bells','39'],
 ['Kites in the Sky','40-41'],
 ['A Mixed-Up Song','42-45','THEORY: Mixed-Up Intervals'],
 ['Flute of the Andes','46'],
 ['Runaway Rabbit','47'],
 ['Rain Forest','48'],
 ['Lightly Row','49'],
 ['THEORY: Sounds from the Rain Forest','50-51'],
 ['Forest Song','52-53',null,'Forest Drums'],
 ['No Moon Tonight','54-55','THEORY: Drawing Rests, and Climbing to the Moon'],
 ['Grumpy Old Troll','56-57','THEORY: Eye-Training/Ear-Training'],
 ['Merlin the Wizard','58-59','Half Steps (Semitones) and Sharps'],
 ['Russian Sailor Dance','60'],
 ['Super Secret Agent','61'],
 ['Party Song','62-63','THEORY: Party Game with Flats'],
 ['Two-Note March','64'],
 ['Girl on a Bicycle','65'],
 ['Boy on a Bicycle','65'],
 ['THEORY: Bicycle Tune','66-67'],
 ['Blocked Chord Study','68'],
 ['Broken Chord Study','68'],
 ['Row, Row, Row Your Boat','69'],
 ['THEORY: Build a C Chord','70'],
 ['Song for a Scarecrow','71'],
 ['My Pony','72-73','THEORY: Eye-Training/Ear-Training'],
 ['Theme from the “London” Symphony','74-75','THEORY: Fun Facts for Mr. Haydn'],
 ['Shepherd’s Song','76-77'],
 ['THEORY: Fun Facts for Mr. Beethoven','78'],
 ['THEORY: An Eye for Chords','79'],
 ['Warm-up in G','80-81','THEORY: Chord Guy Is the Leader!'],
 ['Chords in G','80-81','Shares chart row with Warm-up in G'],
 ['Dinosaur Stomp','82-83','THEORY: Dinosaur Dance Improv'],
 ['The Dreydl Song','84'],
 ['Jumbo’s Lullaby','85'],
 ['The Bubble','86-87'],
]
const normalize=s=>s.normalize('NFKD').replace(/[^a-z0-9]/gi,'').toLowerCase()
export function reconcileFamilyPhoto(book){
 if(book.key!=='all-in-two-1-lesson-theory-anglicised')return book
 const used=new Set()
 const songs=rows.map(([title,page_range,chart_context,alias],index)=>{
  const old=book.songs.find(s=>normalize(s.title)===normalize(alias??title))
  if(old)used.add(old.key)
  const [start,end=start]=page_range.split('-').map(Number)
  // A chart range does not establish which page an individual piece starts on.
  const page_number=start===end?start:old?.page_number>=start&&old.page_number<=end?old.page_number:null
  return {key:old?.key??`photo-${normalize(title)}`,title,page_number,page_range,chart_context:chart_context??null,sort_order:(index+1)*10,source_url:photoSource,additional_sources:old&&normalize(old.title)===normalize(title)?[old.source_url,...(old.additional_sources??[])]:[]}
 })
 const unmatched=book.songs.filter(s=>!used.has(s.key))
 if(unmatched.length)throw Error('Unreconciled Level 1 entries: '+unmatched.map(s=>s.title).join(', '))
 return {...book,songs,sources:[...book.sources,photoSource],catalogue_status:'verified_complete',catalogue_notes:'Complete learning entries from the family’s photographed Level 1 Lesson & Theory Progress Chart. Paired theory activities remain with their chart entry; standalone theory rows are included. Shared rows with two named pieces are split. Certificate excluded. Exact page numbers remain unknown where the chart gives only a range; ranges are preserved in the review. The photo confirms this contents list, but does not show the cover, ISBN or printing; existing edition metadata is provisional pending a cover/copyright photo.'}
}
