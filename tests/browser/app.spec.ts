import { test, expect, type Page } from '@playwright/test'
const userId='10000000-0000-4000-a000-000000000001'
async function fixtures(page:Page, options:{signedIn?:boolean;failLoad?:boolean;failSave?:boolean}={}){
 const state:Record<string,any[]>={books:[{id:'book',series:'Piano Adventures',title:'Primer Lesson Book',level:'Primer',book_type:'Lesson',edition:'2nd Edition (US)',language:'English',catalogue_status:'partial'}],songs:[{id:'song',book_id:'book',title:'Test melody',page_number:12,sort_order:1}],students:[],student_books:[],assessments:[],catalogue_sources:[]}
 let failSave=options.failSave
 await page.route('https://piano-test.supabase.co/**',async route=>{
  const req=route.request(),url=new URL(req.url()),table=url.pathname.split('/').at(-1)!
  if(url.pathname.includes('/auth/')){await route.fulfill({json:{}});return}
  if(options.failLoad){await route.fulfill({status:400,json:{message:'Test connection unavailable'}});return}
  if(req.method()==='POST'){
   if(table==='assessments'&&failSave){failSave=false;await route.fulfill({status:400,json:{message:'Test save failed'}});return}
   const row={id:crypto.randomUUID(),assessed_at:new Date(Date.now()+state.assessments.length*1000).toISOString(),...req.postDataJSON()}
   state[table].push(row)
   // A brief response delay exercises the saving guard against double clicks.
   await new Promise(resolve=>setTimeout(resolve,100))
   await route.fulfill({status:201,json:req.headers().accept?.includes('object')?row:[row]});return
  }
  const id=url.searchParams.get('id')?.replace('eq.','')
  const rows=id?state[table].filter(r=>r.id===id):state[table]
  await route.fulfill({json:req.headers().accept?.includes('object')?(rows[0]??null):rows})
 })
 await page.route('https://fonts.googleapis.com/**',r=>r.abort())
 if(options.signedIn!==false){
  await page.addInitScript(({userId})=>{
   const token=btoa(JSON.stringify({alg:'HS256',typ:'JWT'}))+'.'+btoa(JSON.stringify({sub:userId,exp:4070908800,role:'authenticated'}))+'.fixture'
   localStorage.setItem('sb-piano-test-auth-token',JSON.stringify({access_token:token,refresh_token:'fixture',token_type:'bearer',expires_at:4070908800,expires_in:3600,user:{id:userId,aud:'authenticated',role:'authenticated',email:'test@example.invalid',app_metadata:{provider:'google'},user_metadata:{},created_at:'2026-01-01T00:00:00Z'}}))
  },{userId})
 }
 return state
}
test('sign-in gate has no child progress',async({page})=>{
 await fixtures(page,{signedIn:false});await page.goto('/')
 await expect(page.getByRole('button',{name:'Continue with Google'})).toBeVisible()
 await expect(page.getByText('Test melody')).toHaveCount(0)
})
for(const width of [390,768,1280])test(`create profile, choose book, save and reload history at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:900});const state=await fixtures(page)
 await page.goto('/');await page.getByLabel('Your child’s name').fill('Mia');await page.getByRole('button',{name:'Let’s begin'}).click()
 await expect(page.getByRole('heading',{name:'Mia’s music shelf'})).toBeVisible()
 await page.getByLabel('Choose a book').selectOption('book');await page.getByRole('button',{name:'Add to my shelf'}).click()
 await expect(page.getByText('Not assessed')).toBeVisible();await page.getByRole('link',{name:/Test melody/}).click()
 await expect(page.getByRole('button',{name:'Save this moment'})).toBeDisabled()
 for(const skill of ['fluency','dynamics','rhythm']) await page.getByRole('button',{name:skill+': 3 stars: Well learned',exact:true}).click();await page.getByLabel('A little note').fill('Lovely rhythm')
 await page.getByRole('button',{name:'Save this moment'}).dblclick()
 await expect(page.getByRole('status')).toContainText('Saved!');expect(state.assessments).toHaveLength(1)
 for(const skill of ['fluency','dynamics','rhythm']) await page.getByRole('button',{name:skill+': 1 star: Getting started',exact:true}).click();await page.getByRole('button',{name:'Save this moment'}).click()
 await expect(page.locator('.history li')).toHaveCount(2);await page.reload()
 await expect(page.locator('.history li')).toHaveCount(2);await expect(page.locator('.history li').first()).toContainText('Getting started')
 await expect(page.getByText('Lovely rhythm')).toBeVisible()
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
 await page.screenshot({path:`test-results/song-${width}.png`,fullPage:true})
 await page.getByRole('link',{name:/Back to Primer/}).click();await expect(page.locator('.rating')).toContainText('Getting started')
 await page.getByRole('link',{name:'My music shelf',exact:false}).click();await page.screenshot({path:`test-results/shelf-${width}.png`,fullPage:true})
})
test('failed load is visible and does not masquerade as first use',async({page})=>{
 await fixtures(page,{failLoad:true});await page.goto('/')
 await expect(page.getByRole('alert')).toContainText('Test connection unavailable')
 await expect(page.getByRole('button',{name:'Try again'})).toBeVisible()
 await expect(page.getByLabel('Your child’s name')).toHaveCount(0)
})
test('failed save retains draft and can be retried',async({page})=>{
 const state=await fixtures(page,{failSave:true})
 state.students.push({id:'student',display_name:'Mia'});state.student_books.push({id:'sb',student_id:'student',book_id:'book'})
 await page.goto('/?book=sb&song=song');for(const skill of ['fluency','dynamics','rhythm']) await page.getByRole('button',{name:skill+': 2 stars: Almost there',exact:true}).click()
 await page.getByLabel('A little note').fill('Keep going');await page.getByRole('button',{name:'Save this moment'}).click()
 await expect(page.getByRole('alert')).toContainText('Test save failed');await expect(page.getByLabel('A little note')).toHaveValue('Keep going')
 await page.getByRole('button',{name:'Save this moment'}).click();await expect(page.locator('.history li')).toHaveCount(1);expect(state.assessments).toHaveLength(1)
})
