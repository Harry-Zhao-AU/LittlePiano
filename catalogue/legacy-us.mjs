// Publisher metadata only. No sheet music, recordings or cover art.
// Stable keys must never be renamed once imported: they define permanent UUIDs.
const exam = 'https://exams.pianoadventures.com/wp-content/uploads/2024/07/Piano-Adventures-Exams-Repertoire-List-Primer-to-2B.pdf'
const guide = 'https://primerguide.pianoadventures.com/'
const product = (level,type) => `https://pianoadventures.com/product/piano-adventures-${level==='primer'?'primer-level':`level-${level}`}-${type}-book-2nd-edition/`
function book(key,level,type,isbn,entries,source=exam) {
 return {key,series:'Piano Adventures',title:`${level} ${type} Book`,level,book_type:type,edition:'2nd Edition (US)',language:'English',isbn,catalogue_status:'partial',verified_at:'2026-09-24',sources:[product(level==='Primer'?'primer':level.replace('Level ','').toLowerCase(),type.toLowerCase()),source],songs:entries.map(([title,page],i)=>({key:`entry-${String(i+1).padStart(3,'0')}`,title,page_number:page,sort_order:i+1,source_url:source}))}
}
export const catalogue = [
 book('primer-lesson-us-2','Primer','Lesson','9781616770754',[
  ['Two Black Ants',null],['Two Blackbirds',null],['Into the Cave',null],['Three Little Kittens',null],
  ['The Old Clock',null],['The Walking Song',null],['The I Like Song',null],['I Hear the Echo',null],['Old MacDonald Had a Song',null],
  ['Balloons',null],['Merrily We Roll Along',null],['The Escalator',null],['C-D-E-F-G March',null],['Men from Mars',null],['Ode to Joy',null],['Sea Story',null],['Hey, Mr. Half Note Dot!',null],['Alouette',null],
  ['Middle C March',null],['A Ten-Second Song',null],['Driving in the G Clef',null],['Best Friends',null],['Gorilla in the Tree',null],['My Invention',null],
  ['March on D-E-F',null],['Mister Bluebird',null],['The Dance Band',null],['Frogs on Logs',null],['Let’s Play Ball!',null],['Petite Minuet',null],['Rodeo',null],['Russian Folk Song',null],['Come See the Parade!',null],
  ['Hey, Hey, Look at Me!',null],['Allegro',null],['Elephant Ride',null],['Yankee Doodle',null],['Magic Rhyme for Bass D',null],['A Joke for You',null],['Football Game',null],['Octavius the Octopus',null],['Copy Cat',null],['Grandmother',null],
  ['Lemonade Stand',null],['All My Friends',null],['Bells of Great Britain',null],['Come On, Tigers!',null],['Princess or Monster?',null],['The Bugle Boys',null]
 ],guide),
 book('primer-performance-us-2','Primer','Performance','9781616770778',[
  ['Chimes',12],['Listen to the Drums',13],['Classical March',14],['Rex, the Tyrannosaurus',15],['The Inchworm',16],['Cowboy Joe',17]
 ]),
 book('1-lesson-us-2','Level 1','Lesson','9781616770785',[
  ['Firefly',8],['Little River',10],['Sailing in the Sun',11],['Ferris Wheel',12],['Jumping Beans',14],['The Haunted Mouse',15]
 ]),
 book('1-performance-us-2','Level 1','Performance','9781616770808',[
  ['Showboat',2],['The Spanish Guitar',3],['Jack and the Beanstalk',4],['Pop! Goes the Weasel',6],['The Clock Shop',8],['I’m a Fine Musician',10]
 ]),
 book('2a-lesson-us-2','Level 2A','Lesson','9781616770815',[
  ['Skip to My Lou',12],['Leftover Popcorn',13],['My Daydream',20],['Moonlight Melody',27],['Our Detective Agency',30],['Storms on Saturn',32]
 ]),
 book('2a-performance-us-2','Level 2A','Performance',null,[
  ['The Juggler',2],['Rhino in the Mud',3],['Green Frog Hop',4],['Home on the Range',8],['The Storm and the Rainbow',10],['The Loch Ness Monster',14]
 ]),
 book('2b-lesson-us-2','Level 2B','Lesson','9781616770846',[
  ['Almost Like a Dream',8],['The Great Clock',16],['The Ice Skaters',26],['Vive la France!',30],['Deep River',33],['Beach Party',38]
 ]),
 book('2b-performance-us-2','Level 2B','Performance',null,[
  ['Pagoda in the Purple Mist',6],['A Day at the Carnival',8],['The Milky Way',14],['Kum Ba Yah',18],['Für Elise',20],['Classic Sonatina, 2. Andante Moderato',36]
 ])
]
// A dedicated teaching page verifies the page number independently.
catalogue[0].songs[2].page_number=12
catalogue[0].songs[2].source_url='https://primerguide.pianoadventures.com/units/into-the-cave/'
// Prefer the confirmed distributor product URL for this edition.
catalogue[5].sources[0]='https://www.halleonard.com/product/420176/level-2a-performance-book-2nd-edition'
