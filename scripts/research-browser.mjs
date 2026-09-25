// Read-only publisher research. Screenshots stay in OS temp, outside app assets.
import { chromium } from '@playwright/test'
import {mkdir,writeFile,readFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
const dir=join(tmpdir(),'piano-contents-research');await mkdir(dir,{recursive:true})
const browser=await chromium.launch({channel:'chrome',headless:true})
try {
 if(process.argv[2]==='--technique-samples') {
  const index=JSON.parse(await readFile(join(dir,'media-index.json'),'utf8'))
  const urls=[...new Set(index.filter(r=>r.host==='pianoadventures.co.uk'&&[8004,8006,8008,8010,8012].some(n=>r.sku===`IEFF${n}`)).flatMap(r=>r.assets.map(a=>a.source_url)).filter(u=>/-p?\d+\.jpg$/.test(u)))]
  for(const url of urls){
   const name=new URL(url).pathname.replace(/[^a-z0-9.-]/gi,'_')
   try{await readFile(join(dir,name+'.png'));continue}catch{}
   const page=await browser.newPage({viewport:{width:1400,height:1400}})
   const r=await page.goto(url,{waitUntil:'load',timeout:30000});if(!r.ok())throw Error(`${r.status()} ${url}`)
   await page.screenshot({path:join(dir,name+'.png'),fullPage:true});await page.close();console.log(name+'.png')
  }
 } else if(process.argv[2]==='--media-index') {
  const context=await browser.newContext(),results=[]
  for(let number=8003;number<=8012;number++){
   const batch=await Promise.allSettled(['pianoadventures.com','pianoadventures.co.uk'].map(async host=>{
    const url=`https://${host}/wp-json/wp/v2/media?search=IEFF${number}&per_page=100&_fields=id,title,source_url`
    const r=await context.request.get(url,{timeout:20000});if(!r.ok())throw Error(`${r.status()} ${url}`)
    const assets=await r.json();return {sku:`IEFF${number}`,host,url,assets}
   }))
   for(const r of batch){if(r.status==='fulfilled'){results.push(r.value);console.log(JSON.stringify(r.value))}else console.log(String(r.reason))}
  }
  await writeFile(join(dir,'media-index.json'),JSON.stringify(results,null,2))
 } else if(process.argv[2]==='--probe-contents') {
  const context=await browser.newContext()
  // Test only likely public contents-page URLs beside observed product previews.
  // A successful response is merely a research lead; never treat it as verified metadata.
  const results=[]
  for(const level of ['1','2a','2b','3','4-5'])for(const type of ['lesson-theory','technique-performance']){
   const filename=`_publications_piano-adventures-level-${level}-${type}-book_.json`
   const product=JSON.parse(await readFile(join(dir,filename),'utf8'))
   const preview=product.links.find(l=>/IEFF\d+EA-(?:p)?\d+\.jpg$/.test(l.href))?.href
   if(!preview)continue
   const attempts=await Promise.allSettled([2,3].map(async number=>{
    const url=preview.replace(/-(p?)\d+\.jpg$/,(_,p)=>`-${p}0${number}.jpg`)
    const r=await context.request.get(url,{timeout:15000})
    const result={level,type,url,status:r.status(),content_type:r.headers()['content-type']}
    if(r.ok()&&result.content_type?.startsWith('image/')){
     const page=await browser.newPage({viewport:{width:1400,height:1200}})
     await page.goto(url,{waitUntil:'load'});const name=`contents-${level}-${type}-${number}.png`
     await page.screenshot({path:join(dir,name),fullPage:true});await page.close();result.screenshot=name
    }
    return result
   }))
   results.push(...attempts.map(r=>r.status==='fulfilled'?r.value:{error:String(r.reason)}))
  }
  await writeFile(join(dir,'contents-probes.json'),JSON.stringify(results,null,2))
  console.log(JSON.stringify(results));
 } else {
 const page=await browser.newPage({viewport:{width:1400,height:1000}})
 for(const url of process.argv.slice(2)) {
  const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000})
  if(!response?.ok())throw new Error(`Publisher returned ${response?.status()} for ${url}`)
  const name=new URL(url).pathname.replace(/[^a-z0-9.-]/gi,'_')||'index'
  await page.screenshot({path:join(dir,name+'.png'),fullPage:true})
  const metadata=await page.evaluate(()=>({title:document.title,text:document.body.innerText,images:[...document.images].map(i=>({src:i.currentSrc||i.src,alt:i.alt})),links:[...document.querySelectorAll('a[href]')].map(a=>({href:a.href,text:a.textContent.trim()}))}))
  await writeFile(join(dir,name+'.json'),JSON.stringify({source_url:url,final_url:page.url(),checked_at:new Date().toISOString(),...metadata},null,2))
  console.log(JSON.stringify({url,final_url:page.url(),screenshot:join(dir,name+'.png'),title:metadata.title,image_count:metadata.images.length}))
 }
 }
}finally{await browser.close()}
