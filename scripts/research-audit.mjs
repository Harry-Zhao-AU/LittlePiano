// Record screenshot receipts without copying publisher artwork into the repository.
import {readFile,writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {join} from 'node:path'
import {tmpdir} from 'node:os'
import {catalogue} from '../catalogue/catalogue.mjs'
const dir=join(tmpdir(),'piano-contents-research')
const evidence=[]
for(const b of catalogue){
 let urls=b.key.startsWith('my-first')
  ? [b.sources[0],...new Set(b.songs.map(s=>s.source_url))]
  : [b.sources[0].replace('pianoadventures.com.au','pianoadventures.co.uk'),...b.sources.filter(u=>u.includes('cloud.pianoadventures.com')||u.includes('/online-support-'))]
 urls=[...new Set([...urls,...b.sources.filter(u=>u.startsWith('https://pianoadventures.co.uk/wp-content/')&&u.endsWith('.jpg'))])]
 const receipts=[]
 for(const url of urls){
  const name=new URL(url).pathname.replace(/[^a-z0-9.-]/gi,'_')||'index'
  const bytes=await readFile(join(dir,name+'.png'))
  let page={title:'Publisher preview image (visually inspected)'}
  try{page=JSON.parse(await readFile(join(dir,name+'.json'),'utf8'))}catch(error){if(error.code!=='ENOENT')throw error}
  receipts.push({source_url:url,page_title:page.title,screenshot_filename:name+'.png',screenshot_sha256:createHash('sha256').update(bytes).digest('hex')})
 }
 const familySource=b.sources.find(u=>u.startsWith('urn:little-piano:family-photo:'))
 if(familySource)receipts.push({source_url:familySource,description:`Family-supplied photo: two-page ${b.title} Progress Chart. Visually transcribed; image not shipped. Cover, ISBN and printing not visible.`})
 evidence.push({book_key:b.key,status:b.catalogue_status,checked_on:'2026-09-25',method:familySource?'Family Progress Chart photo visually transcribed and reconciled against earlier publisher research.':'Playwright Chromium screenshots and DOM metadata; My First chart screenshots visually transcribed.',limitation:b.catalogue_notes,receipts})
}
await writeFile('catalogue/research-audit.json',JSON.stringify({screenshot_storage:'OS temp / piano-contents-research; research only, not app assets',books:evidence},null,2)+'\n')
console.log(`Recorded screenshot receipts for ${evidence.length} books.`)
