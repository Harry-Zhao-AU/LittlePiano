// Visually checked publisher screenshots, 2026-09-25. Metadata only.
// References in warm-up boxes and Lesson footers are independent page evidence.
const root='https://pianoadventures.co.uk/wp-content/uploads/sites/10/'
const image=(level,page)=>root+({'1':'2013/06/IEFF8004EA-p','2a':'2013/06/IEFF8006EA-p','2b':'2014/10/IEFF8008EA-p','3':'2016/10/IEFF8010EA-p','4-5':'2018/12/IEFF8012EA-'}[level])+String(page).padStart(2,'0')+'.jpg'
const additions={
 '1':[['Hand Cups',4,6],['Wrist Float-off',4,root+'2013/07/IEFF8004EA-p04-secret2.jpg'],['Woodpecker Taps',5,root+'2013/07/IEFF8004EA-p05-secret3.jpg'],['Kayak Ride',6,6],['Legato/Staccato Etude',11,11]],
 '2a':[['Round Bird House',4,4],['Teamwork',4,4],['Making Rainbows',5,root+'2013/07/IEFF8006EA-p05-secret5.jpg'],['Busy Places! — The Market',6,6],['Busy Places! — The Train Station',6,6],['The Explorer — Soft Rain',34,34]],
 '2b':[['Arms with Weights',4,4],['Small Wrist Lift',4,4],['Travelling Thumb',5,20],['L.H. Brush Stroke',7,7],['Jazz Cat Jumps',20,20]],
 '3':[['Finger Fireworks',4,4],['Sighing',4,4],['Finger Springs',5,32],['Scale Round-Offs — Eight-Note Scoops',7,7],['Chord Waltz',32,32]],
 '4-5':[['Balance Beam',4,4],['Spark the Pattern',4,4],['Rocking',5,14],['Staccato Machine',5,38],['Lead with the Wrist',5,72]],
}
const correlations={
 '1':[['Little River',10,6],['Classic Dance',20,11],['The Lonely Pine',26,15],['Super Secret Agent',61,34],['Two-Note March',64,36],['My Pony',72,40]],
 '2a':[['When the Saints Go Marching In',8,4],['Famous People',11,4],['The Elf’s Silver Hammer',31,14],['I Am the King',36,19],['Moonlight Melody',38,20],['Sword Dance',70,34]],
 '2b':[['Moon Walker',6,4],['Almost Like a Dream',7,4],['Shave and a Haircut',20,18],["Jumpin' Jazz Cat",26,20],['Duke of York Strut',72,45],['Auld Lang Syne',86,54]],
 '3':[['Little March',5,7],['Scarborough Fair',49,32],['Funiculì, Funiculà',54,36],['Allegro in D Major',60,38],['Novela',73,48]],
}
export function supplementPreviews(book){
 const match=book.key.match(/^all-in-two-(1|2a|2b|3|4-5)-(lesson-theory|technique-performance)-/)
 if(!match)return book
 const [,level,type]=match
 let songs=book.songs.map(s=>({...s,additional_sources:[...(s.additional_sources??[])]}))
 if(type==='technique-performance'){
  if(level==='2a')songs.find(s=>s.title==='The Explorer').title='The Explorer — Spotting a Bear'
  for(const [title,page,source] of additions[level])songs.push({key:'preview-'+title.toLowerCase().replace(/[^a-z0-9]+/g,'-'),title,page_number:page,source_url:typeof source==='number'?image(level,source):source,additional_sources:[]})
  songs.sort((a,b)=>a.page_number-b.page_number)
 }else{
  for(const [title,page,source] of correlations[level]??[]){
   const song=songs.find(s=>s.title===title)
   if(!song)throw Error(`Missing correlation: ${book.key}: ${title}`)
   song.page_number=page
   song.additional_sources.push(image(level,source))
  }
  if(level==='4-5'){
   songs.unshift({key:'preview-funeral-march',title:'Funeral March',page_number:4,source_url:image(level,4),additional_sources:[]})
   const song=songs.find(s=>s.title==='Innocense (Burgmuller)')
   song.title='Innocence (Burgmuller)'
   song.additional_sources.push(image(level,69))
  }
 }
 return {...book,songs:songs.map((s,i)=>({...s,sort_order:(i+1)*10})),sources:[...new Set([...book.sources,...songs.flatMap(s=>[s.source_url,...s.additional_sources])])],catalogue_notes:book.catalogue_notes+' Additional titles and page references verified from publisher preview pages, including warm-up references and Lesson correlation footers. Full printed contents remain unavailable.'}
}
