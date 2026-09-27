import { test, expect, type Page } from '@playwright/test'
const userId='10000000-0000-4000-a000-000000000001'
async function fixtures(page:Page, options:{signedIn?:boolean;failLoad?:boolean;failSave?:boolean}={}){
 const state:Record<string,any[]>={books:[{id:'book',series:'Piano Adventures',title:'Primer Lesson Book',level:'Primer',book_type:'Lesson',edition:'2nd Edition (US)',language:'English',catalogue_status:'partial'}],songs:[{id:'song',book_id:'book',title:'Test melody',page_number:12,sort_order:1}],students:[],student_books:[],assessments:[],assessment_revisions:[],catalogue_sources:[],certificates:[]}
 let failSave=options.failSave
 await page.route('https://piano-test.supabase.co/**',async route=>{
  const req=route.request(),url=new URL(req.url()),table=url.pathname.split('/').at(-1)!
  if(url.pathname.includes('/auth/')){await route.fulfill({json:{}});return}
  if(options.failLoad){await route.fulfill({status:400,json:{message:'Test connection unavailable'}});return}
  if(url.pathname.includes('/rpc/')){
   const p=req.postDataJSON()
   if(table==='set_book_archived'){
    const row=state.student_books.find(b=>b.id===p.p_student_book_id)!
    row.archived_at=p.p_archived?(row.archived_at??new Date().toISOString()):null
    await route.fulfill({json:req.headers().accept?.includes('object')?row:[row]});return
   }
   if(table==='revise_assessment'){
    const existing=state.assessment_revisions.find(r=>r.id===p.p_id)
    if(existing){await route.fulfill({json:[existing]});return}
    const revisions=state.assessment_revisions.filter(r=>r.assessment_id===p.p_assessment_id)
    if(revisions.length!==p.p_expected_revision){await route.fulfill({status:409,json:{code:'40001',message:'This assessment changed in another session. Reload the assessment before trying again.'}});return}
    const row={id:p.p_id,assessment_id:p.p_assessment_id,revision_number:revisions.length+1,fluency:p.p_fluency,dynamics:p.p_dynamics,rhythm:p.p_rhythm,feedback:p.p_feedback,excluded:p.p_excluded,created_at:new Date().toISOString()}
    state.assessment_revisions.push(row);await new Promise(resolve=>setTimeout(resolve,100));await route.fulfill({json:[row]});return
   }
  }
  if(req.method()==='PATCH'){
   const row=state[table].find(r=>r.id===url.searchParams.get('id')?.replace('eq.',''))!
   Object.assign(row,req.postDataJSON());await route.fulfill({json:row});return
  }
  if(req.method()==='DELETE'){const id=url.searchParams.get('id')?.replace('eq.','');state[table]=state[table].filter(r=>r.id!==id);await route.fulfill({status:204});return}
  if(req.method()==='POST'){
   if(table==='assessments'&&failSave){failSave=false;await route.fulfill({status:400,json:{message:'Test save failed'}});return}
   const row={id:crypto.randomUUID(),assessed_at:new Date(Date.now()+state.assessments.length*1000).toISOString(),...req.postDataJSON()}
   state[table].push(row)
   // A brief response delay exercises the saving guard against double clicks.
   await new Promise(resolve=>setTimeout(resolve,100))
   await route.fulfill({status:201,json:req.headers().accept?.includes('object')?row:[row]});return
  }
  const id=url.searchParams.get('id')?.replace('eq.','')
  let data=table==='effective_assessments'?state.assessments.map(a=>{
   const revision=state.assessment_revisions.filter(r=>r.assessment_id===a.id).at(-1)
   return {...a,revision_number:0,excluded:false,...revision,id:a.id}
  }):state[table]
  const assessmentId=url.searchParams.get('assessment_id')?.replace('eq.','')
  if(assessmentId)data=data.filter(r=>r.assessment_id===assessmentId)
  const rows=id?data.filter(r=>r.id===id):data
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

for(const width of [390,768,1280])test(`issue a certificate without ratings, reload, download and delete at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:1000});const state=await fixtures(page)
 state.students.push({id:'student',display_name:'Mia'});state.student_books.push({id:'sb',student_id:'student',book_id:'book'})
 await page.goto('/?book=sb');await page.getByRole('link',{name:'Give completion certificate'}).click()
 await page.getByLabel('Awarded by',{exact:true}).fill('Dad')
 await page.getByRole('button',{name:'Preview certificate',exact:true}).click()
 await expect(page.getByRole('img',{name:/Certificate for Mia/})).toBeVisible()
 await page.getByRole('button',{name:'Issue certificate',exact:true}).dblclick()
 await expect(page.getByRole('button',{name:'Download PDF'})).toBeVisible()
 expect(state.certificates).toHaveLength(1);expect(state.assessments).toHaveLength(0)
 await page.reload();await expect(page.getByRole('img',{name:/Certificate for Mia/})).toBeVisible()
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
 await page.screenshot({path:`test-results/certificate-${width}.png`,fullPage:true})
 const downloaded=page.waitForEvent('download');await page.getByRole('button',{name:'Download PDF'}).click()
 const download=await downloaded;expect(download.suggestedFilename()).toContain('certificate-Mia')
 await download.saveAs(`test-results/certificate-${width}.pdf`)
 await page.getByRole('link',{name:'Issue another',exact:true}).click()
 await expect(page.getByText(/already has 1 certificate/)).toBeVisible()
 await page.getByRole('link',{name:'View certificate',exact:true}).click()
 await page.getByRole('button',{name:'Delete certificate',exact:true}).click()
 await page.getByRole('button',{name:'Keep certificate'}).click();expect(state.certificates).toHaveLength(1)
 await page.getByRole('button',{name:'Delete certificate',exact:true}).click();await page.getByRole('button',{name:'Yes, delete certificate'}).click()
 await expect(page.getByRole('heading',{name:'Your celebrations belong here'})).toBeVisible();expect(state.certificates).toHaveLength(0)
})
test('special awards and every template render with long text',async({page})=>{
 const state=await fixtures(page)
 state.students.push({id:'student',display_name:'Alexandra Charlotte'});state.student_books.push({id:'sb',student_id:'student',book_id:'book'})
 await page.goto('/?view=certificates&award=new')
 await page.getByLabel('Award title',{exact:true}).fill('Beautiful Dynamics and a Confident Performance')
 await page.getByLabel('A little message').fill('You brought the music to life with your thoughtful playing. We are so proud of your hard work and the joy you share!')
 await page.getByLabel('Awarded by',{exact:true}).fill('Mum and Dad')
 await page.getByRole('button',{name:'Preview certificate',exact:true}).click()
 await expect(page.getByRole('img',{name:/Certificate for Alexandra/})).toBeVisible()
 await page.locator('.certificate-preview').screenshot({path:'test-results/little-star-preview.png'})
 await page.getByRole('button',{name:'Edit details'}).click();await page.getByRole('button',{name:'Awesome',exact:true}).click()
 await page.getByRole('button',{name:'Preview certificate',exact:true}).click()
 await expect(page.getByRole('img',{name:/Certificate for Alexandra/})).toBeVisible()
 await page.locator('.certificate-preview').screenshot({path:'test-results/awesome-preview.png'})
 await page.getByRole('button',{name:'Issue certificate',exact:true}).click()
 await expect(page.getByRole('button',{name:'Download PDF'})).toBeVisible()
 expect(state.certificates[0].book_id).toBeNull()
 await page.goto('/?view=certificates&award=new&kind=book&awardBook=book')
 await page.getByRole('button',{name:'Musical Parchment',exact:true}).click()
 await page.getByLabel('Book title on certificate').fill('Piano Adventures Level 2B All-in-Two Edition: Technique & Performance')
 await page.getByLabel('Awarded by',{exact:true}).fill('Mum and Dad')
 await page.getByRole('button',{name:'Preview certificate',exact:true}).click()
 await expect(page.getByRole('img',{name:/Certificate for Alexandra/})).toBeVisible()
 await page.locator('.certificate-preview').screenshot({path:'test-results/parchment-preview.png'})
})
test('certificate save failure retains preview and a retry recovers a committed insert',async({page})=>{
 const state=await fixtures(page);state.students.push({id:'student',display_name:'Mia'})
 let attempt=0
 await page.route('**/rest/v1/certificates*',async route=>{
  if(route.request().method()!=='POST'){await route.fallback();return}
  attempt++
  if(attempt===1){await route.fulfill({status:400,json:{message:'Certificate save failed'}});return}
  state.certificates.push(route.request().postDataJSON())
  await route.fulfill({status:400,json:{message:'Response lost after saving'}})
 })
 await page.goto('/?view=certificates&award=new')
 await page.getByLabel('Award title',{exact:true}).fill('Great Effort Today');await page.getByLabel('Awarded by',{exact:true}).fill('Dad')
 await page.getByRole('button',{name:'Preview certificate',exact:true}).click();await page.getByRole('button',{name:'Issue certificate',exact:true}).click()
 await expect(page.getByRole('alert')).toContainText('Certificate save failed')
 await expect(page.getByRole('img',{name:/Great Effort Today/})).toBeVisible()
 await page.getByRole('button',{name:'Issue certificate',exact:true}).click()
 await expect(page.getByRole('button',{name:'Download PDF'})).toBeVisible();expect(state.certificates).toHaveLength(1)
})

function managementState(state:Record<string,any[]>){
 state.students.push({id:'student',display_name:'Mia'})
 state.student_books.push({id:'sb',student_id:'student',book_id:'book',archived_at:null})
 state.assessments.push(
  {id:'old',student_book_id:'sb',song_id:'song',fluency:3,dynamics:3,rhythm:3,feedback:'Original practice',assessed_at:'2026-09-01T10:00:00Z'},
  {id:'new',student_book_id:'sb',song_id:'song',fluency:1,dynamics:1,rhythm:1,feedback:'Recent practice',assessed_at:'2026-09-02T10:00:00Z'})
}

for(const width of [390,1280])test(`rename profile, archive and restore books at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:950});const state=await fixtures(page);managementState(state)
 await page.goto('/')
 await page.getByRole('button',{name:'Edit profile',exact:true}).click()
 await page.getByLabel("Child's name",{exact:true}).fill('Cancelled')
 await page.getByRole('button',{name:'Cancel',exact:true}).click()
 await expect(page.getByRole('heading',{name:'Mia’s music shelf'})).toBeVisible()
 await page.getByRole('button',{name:'Edit profile',exact:true}).click()
 await page.getByLabel("Child's name",{exact:true}).fill('  Amelia  ')
 await page.getByRole('button',{name:'Save changes',exact:true}).click()
 await page.reload();await expect(page.getByRole('heading',{name:'Amelia’s music shelf'})).toBeVisible()
 await page.getByRole('link',{name:/Primer Lesson Book/}).click()
 await page.getByRole('link',{name:'Give completion certificate',exact:true}).click()
 await expect(page.getByLabel('Child’s name',{exact:true})).toHaveValue('Amelia')
 await page.getByLabel('Awarded by',{exact:true}).fill('Dad')
 await page.getByRole('button',{name:'Preview certificate',exact:true}).click()
 await page.getByRole('button',{name:'Issue certificate',exact:true}).click()
 await expect(page.getByRole('button',{name:'Download PDF'})).toBeVisible()
 const certificateURL=page.url()
 await page.goto('/?book=sb');await page.getByRole('button',{name:'Archive book',exact:true}).click()
 await page.getByRole('button',{name:'Keep active',exact:true}).click();expect(state.student_books[0].archived_at).toBeNull()
 await page.getByRole('button',{name:'Archive book',exact:true}).click();await page.getByRole('button',{name:'Confirm archive',exact:true}).click()
 await expect(page.getByRole('button',{name:'Restore book',exact:true})).toBeVisible()
 expect(state.assessments).toHaveLength(2);expect(state.certificates).toHaveLength(1)
 await page.goto('/');await expect(page.locator('.book-card')).toHaveCount(0)
 await page.getByRole('link',{name:'Archived books',exact:true}).click();await page.reload()
 await expect(page.locator('.book-card')).toHaveCount(1)
 await page.screenshot({path:`test-results/archived-${width}.png`,fullPage:true})
 await page.getByRole('link',{name:/Primer Lesson Book/}).click()
 await page.getByRole('link',{name:/Test melody/}).click()
 await expect(page.getByRole('button',{name:'Save this moment',exact:true})).toBeDisabled()
 await expect(page.locator('.history li')).toHaveCount(2)
 await page.goto(certificateURL);await expect(page.getByRole('button',{name:'Download PDF'})).toBeVisible()
 await expect(page.getByText('This certificate is still saved.',{exact:false})).toBeVisible()
 await page.getByRole('link',{name:'Issue another',exact:true}).click()
 await expect(page.getByText('This book is archived.',{exact:false})).toBeVisible()
 await expect(page.getByRole('button',{name:'Preview certificate',exact:true})).toHaveCount(0)
 await page.getByRole('link',{name:'Open the book and restore it',exact:true}).click()
 await page.getByRole('button',{name:'Restore book',exact:true}).click()
 await expect(page.getByRole('link',{name:'Give completion certificate',exact:true})).toBeVisible()
 await page.reload();await expect(page.getByRole('button',{name:'Archive book',exact:true})).toBeVisible()
 expect(state.student_books).toHaveLength(1);expect(state.student_books[0].archived_at).toBeNull()
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
})

for(const width of [390,1280])test(`correct, exclude, restore and inspect assessment history at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:1000});const state=await fixtures(page);managementState(state)
 await page.goto('/?book=sb&song=song')
 const newest=page.locator('.history li').first(),older=page.locator('.history li').last()
 await older.getByRole('button',{name:'Correct assessment',exact:true}).click()
 await older.getByLabel('Fluency correction').selectOption('2')
 await older.getByLabel('Corrected note').fill('Corrected older practice')
 await older.getByRole('button',{name:'Save correction',exact:true}).dblclick()
 await expect(older.getByText('Corrected · revision 1',{exact:true})).toBeVisible()
 await expect(newest.getByText('Latest',{exact:true})).toBeVisible();expect(state.assessment_revisions).toHaveLength(1)
 expect(state.assessments[0].feedback).toBe('Original practice')
 await older.getByRole('button',{name:'View edit history',exact:true}).click()
 await expect(older.getByText('Original assessment',{exact:true})).toBeVisible()
 await expect(older.getByText('Original practice',{exact:true})).toBeVisible()
 await expect(older.getByText('Revision 1',{exact:true})).toBeVisible()
 await page.screenshot({path:`test-results/corrections-${width}.png`,fullPage:true})
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
 await page.reload();await expect(older.getByText('Corrected older practice',{exact:true})).toBeVisible()
 await newest.getByRole('button',{name:'Exclude from progress',exact:true}).click()
 await newest.getByRole('button',{name:'Keep assessment',exact:true}).click();expect(state.assessment_revisions).toHaveLength(1)
 await newest.getByRole('button',{name:'Exclude from progress',exact:true}).click()
 await newest.getByRole('button',{name:'Confirm exclusion',exact:true}).click()
 await expect(older.getByText('Latest',{exact:true})).toBeVisible()
 await older.getByRole('button',{name:'Exclude from progress',exact:true}).click()
 await older.getByRole('button',{name:'Confirm exclusion',exact:true}).click()
 await expect(page.locator('.history').getByText('Latest',{exact:true})).toHaveCount(0)
 await page.getByRole('link',{name:/Back to Primer/}).click();await expect(page.getByText('Not assessed',{exact:true})).toBeVisible()
 await page.getByRole('link',{name:/Test melody/}).click()
 await newest.getByRole('button',{name:'Restore assessment',exact:true}).click()
 await expect(newest.getByText('Latest',{exact:true})).toBeVisible()
 await page.reload();await expect(newest.getByText('Latest',{exact:true})).toBeVisible()
 expect(state.assessments).toHaveLength(2);expect(state.assessment_revisions).toHaveLength(4)
})

test('profile and archive errors preserve the current state and allow retry',async({page})=>{
 const state=await fixtures(page);managementState(state)
 let profileFailure=true,archiveFailure=true
 await page.route('**/rest/v1/students*',async route=>{
  if(route.request().method()==='PATCH'&&profileFailure){profileFailure=false;await route.fulfill({status:400,json:{message:'Rename failed'}});return}
  await route.fallback()
 })
 await page.route('**/rest/v1/rpc/set_book_archived',async route=>{
  if(archiveFailure){archiveFailure=false;await route.fulfill({status:400,json:{message:'Archive failed'}});return}
  await route.fallback()
 })
 await page.goto('/');await page.getByRole('button',{name:'Edit profile',exact:true}).click()
 await page.getByLabel("Child's name",{exact:true}).fill('Amelia');await page.getByRole('button',{name:'Save changes',exact:true}).click()
 await expect(page.getByRole('alert')).toContainText('Rename failed');expect(state.students[0].display_name).toBe('Mia')
 await expect(page.getByLabel("Child's name",{exact:true})).toHaveValue('Amelia')
 await page.getByRole('button',{name:'Save changes',exact:true}).click();await expect(page.getByRole('heading',{name:'Amelia’s music shelf'})).toBeVisible()
 await page.goto('/?book=sb');await page.getByRole('button',{name:'Archive book',exact:true}).click()
 await page.getByRole('button',{name:'Confirm archive',exact:true}).click();await expect(page.getByRole('alert')).toContainText('Archive failed')
 expect(state.student_books[0].archived_at).toBeNull()
 await page.getByRole('button',{name:'Confirm archive',exact:true}).click();await expect(page.getByRole('button',{name:'Restore book',exact:true})).toBeVisible()
})

test('revision retries recover an ambiguous save and stale edits require a reload',async({page})=>{
 const state=await fixtures(page);managementState(state)
 let attempt=0
 await page.route('**/rest/v1/rpc/revise_assessment',async route=>{
  attempt++
  if(attempt===1){await route.fulfill({status:400,json:{message:'Correction failed'}});return}
  await route.fallback()
 })
 await page.goto('/?book=sb&song=song');const entry=page.locator('.history li').first()
 await entry.getByRole('button',{name:'Correct assessment',exact:true}).click()
 await entry.getByLabel('Corrected note').fill('Retry this correction')
 await entry.getByRole('button',{name:'Save correction',exact:true}).click()
 await expect(entry.getByRole('alert')).toContainText('Correction failed')
 await expect(entry.getByLabel('Corrected note')).toHaveValue('Retry this correction')
 await page.unroute('**/rest/v1/rpc/revise_assessment')
 let lost=true
 await page.route('**/rest/v1/effective_assessments*',async route=>{
  if(lost&&route.request().url().includes('id=eq.new')){lost=false;await route.fulfill({status:400,json:{message:'Response unavailable after saving'}});return}
  await route.fallback()
 })
 await entry.getByRole('button',{name:'Retry correction',exact:true}).click()
 await expect(entry.getByRole('alert')).toContainText('Response unavailable after saving');expect(state.assessment_revisions).toHaveLength(1)
 await entry.getByRole('button',{name:'Retry correction',exact:true}).click()
 await expect(entry.getByText('Corrected · revision 1',{exact:true})).toBeVisible();expect(state.assessment_revisions).toHaveLength(1)
 await entry.getByRole('button',{name:'Correct assessment',exact:true}).click()
 state.assessment_revisions.push({...state.assessment_revisions[0],id:'other-tab',revision_number:2,feedback:'Changed in another tab'})
 await entry.getByLabel('Corrected note').fill('Stale draft');await entry.getByRole('button',{name:'Save correction',exact:true}).click()
 await expect(entry.getByRole('alert')).toContainText('changed in another session')
 await entry.getByRole('button',{name:'Reload assessment',exact:true}).click()
 await expect(entry.getByText('Changed in another tab',{exact:true})).toBeVisible()
 expect(state.assessment_revisions).toHaveLength(2)
})
