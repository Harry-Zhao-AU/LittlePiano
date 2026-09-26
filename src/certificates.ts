export type CertificateKind = 'book' | 'special'
export interface Certificate {
 id:string; student_id:string; book_id:string|null; song_id:string|null;
 kind:CertificateKind; template_id:string; template_version:number;
 child_name:string; title:string; message:string; awarded_by:string; awarded_on:string; created_at?:string
}
type Box = [number,number,number,number]
export interface CertificateTemplate {
 id:string; name:string; kind:CertificateKind; image:string;
 nameBox:Box; titleBox:Box; messageBox?:Box; dateBox:Box; issuerBox:Box;
 labelBox?:Box; retired?:boolean
}
// Coordinates in a 1000 x 707 A4 landscape design space. Version 1 is immutable.
export const templates:CertificateTemplate[] = [
 {id:'piano-party',name:'Piano Party',kind:'book',image:'template1-a4.png',nameBox:[315,291,370,37],titleBox:[325,376,350,65],dateBox:[277,584,130,23],issuerBox:[690,584,118,23],labelBox:[590,586,99,22]},
 {id:'musical-parchment',name:'Musical Parchment',kind:'book',image:'template2-a4.png',nameBox:[247,236,501,53],titleBox:[270,365,455,73],dateBox:[290,591,129,20],issuerBox:[650,591,117,20],labelBox:[565,590,84,23]},
 {id:'little-star',name:'You Shine!',kind:'special',image:'special-achievement-little-star.png',nameBox:[178,236,644,59],titleBox:[186,359,622,50],messageBox:[197,446,607,82],dateBox:[309,575,165,23],issuerBox:[615,575,139,23]},
 {id:'brave-performer',retired:true,name:'Brave Performer',kind:'special',image:'special-achievement-brave-performer.png',nameBox:[193,266,613,45],titleBox:[184,368,631,45],messageBox:[205,454,625,80],dateBox:[285,569,197,24],issuerBox:[650,569,171,24]},
 {id:'awesome',name:'Awesome',kind:'special',image:'special-achievement-awesome.png',nameBox:[192,290,614,36],titleBox:[186,382,623,36],messageBox:[207,453,609,65],dateBox:[308,556,181,20],issuerBox:[670,556,152,20]}
]
export function localDate() {
 const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')
}
export function validateCertificate(c:Certificate) {
 const t=templates.find(t=>t.id===c.template_id)
 if(!t || t.kind!==c.kind || c.template_version!==1)throw new Error('Choose a matching certificate template.')
 for(const [value,max,label] of [[c.child_name,80,'Child’s name'],[c.title,160,'Title'],[c.awarded_by,80,'Awarded by']] as const)
  if(!value.trim() || value.length>max)throw new Error(label+' is missing or too long.')
 if(c.message.length>300)throw new Error('Keep the message within 300 characters.')
 if(!/^\d{4}-\d{2}-\d{2}$/.test(c.awarded_on)||!Number.isFinite(Date.parse(c.awarded_on))||new Date(c.awarded_on).toISOString().slice(0,10)!==c.awarded_on)throw new Error('Choose a valid award date.')
 if(c.kind==='book'&&(!c.book_id||c.song_id||c.message))throw new Error('Choose a book for this completion certificate.')
 if(c.song_id&&!c.book_id)throw new Error('Choose the song’s book.')
}
export function certificateFilename(c:Certificate) {
 return ('certificate-'+c.child_name+'-'+c.awarded_on).replace(/[^a-z0-9_-]/gi,'-')+'.pdf'
}
function drawText(ctx:CanvasRenderingContext2D,text:string,box:Box,maxSize:number) {
 if(!text)return
 const [x,y,w,h]=box
 let lines:string[]=[]
 let size=maxSize
 for(;size>=4;size-=0.5){
  ctx.font='600 '+size+'px Georgia, serif';lines=['']
  // Split overlong words too, so long names cannot escape their field.
  for(const word of text.split(/\s+/)){
   let line=lines[lines.length-1]!
   if(ctx.measureText(line+(line?' ':'')+word).width<=w){lines[lines.length-1]=line+(line?' ':'')+word;continue}
   if(line)lines.push('')
   for(const char of word){
    line=lines[lines.length-1]!
    if(ctx.measureText(line+char).width>w)lines.push(char)
    else lines[lines.length-1]=line+char
   }
  }
  if(lines.length*size*1.2<=h)break
 }
 ctx.fillStyle='#293d45';ctx.textAlign='center';ctx.textBaseline='middle'
 lines.forEach((line,i)=>ctx.fillText(line,x+w/2,y+h/2+(i-(lines.length-1)/2)*size*1.2))
}
export async function renderCertificate(c:Certificate):Promise<HTMLCanvasElement> {
 const t=templates.find(t=>t.id===c.template_id)
 if(!t||c.template_version!==1)throw new Error('This certificate template version is unavailable.')
 const img=new Image()
 img.src='/certificates/v1/'+t.image
 await new Promise<void>((resolve,reject)=>{img.onload=()=>resolve();img.onerror=()=>reject(new Error('Certificate artwork could not load. Please try again.'))})
 const canvas=document.createElement('canvas');canvas.width=3508;canvas.height=2480
 const ctx=canvas.getContext('2d')!
 ctx.drawImage(img,0,0,canvas.width,canvas.height);ctx.scale(canvas.width/1000,canvas.height/707)
 if(t.labelBox){
  const [x,y,w,h]=t.labelBox;ctx.fillStyle=t.id==='piano-party'?'#faf6e6':'#f5e4bc';ctx.fillRect(x,y,w,h)
  drawText(ctx,'Awarded by:',t.labelBox,13)
 }
 if(t.id==='piano-party'){ctx.fillStyle='#faf6e6';ctx.fillRect(320,385,360,62)}
 drawText(ctx,c.child_name,t.nameBox,30);drawText(ctx,c.title,t.titleBox,22)
 if(t.messageBox)drawText(ctx,c.message,t.messageBox,18)
 drawText(ctx,new Date(c.awarded_on+'T12:00:00').toLocaleDateString('en-AU',{day:'numeric',month:'short',year:'numeric'}),t.dateBox,13)
 drawText(ctx,c.awarded_by,t.issuerBox,13)
 return canvas
}
export async function certificatePDF(c:Certificate) {
 const [{jsPDF},canvas]=await Promise.all([import('jspdf'),renderCertificate(c)])
 const pdf=new jsPDF({orientation:'landscape',unit:'mm',format:'a4'})
 pdf.addImage(canvas.toDataURL('image/jpeg',0.95),'JPEG',0,0,297,210)
 return pdf
}
