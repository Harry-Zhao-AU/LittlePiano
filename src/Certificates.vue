<script setup lang="ts">
import {computed,onMounted,onUnmounted,ref,watch} from 'vue'
import {useRoute,useRouter} from 'vue-router'
import {supabase,type Student,type Book,type Song,type StudentBook} from './lib'
import {templates,localDate,validateCertificate,certificatePDF,certificateFilename,type Certificate,type CertificateKind} from './certificates'
import CertificatePreview from './CertificatePreview.vue'
const props=defineProps<{student:Student;books:Book[];songs:Song[];selected:StudentBook[]}>()
const route=useRoute(),router=useRouter()
const rows=ref<Certificate[]>([]),loading=ref(true),busy=ref(false),error=ref(''),notice=ref(''),preview=ref(false),confirmDelete=ref(false)
let alive=true
onUnmounted(()=>{alive=false})
const availableBooks=computed(()=>props.books.filter(b=>props.selected.some(s=>s.student_id===props.student.id&&s.book_id===b.id&&!s.archived_at)))
const archivedRequest=computed(()=>props.selected.find(s=>s.book_id===route.query.awardBook&&s.archived_at))
const openedArchived=computed(()=>props.selected.find(s=>s.book_id===opened.value?.book_id&&s.archived_at))
function empty(kind:CertificateKind='special'):Certificate{return {id:crypto.randomUUID(),student_id:props.student.id,book_id:null,song_id:null,kind,template_id:kind==='book'?'piano-party':'little-star',template_version:1,child_name:props.student.display_name,title:'',message:'',awarded_by:'',awarded_on:localDate()}}
const draft=ref<Certificate>(empty())
const formOpen=computed(()=>route.query.award==='new')
const opened=computed(()=>rows.value.find(c=>c.id===route.query.certificate))
const formTemplates=computed(()=>templates.filter(t=>t.kind===draft.value.kind&&!t.retired))
const relatedSongs=computed(()=>props.songs.filter(s=>s.book_id===draft.value.book_id).sort((a,b)=>a.sort_order-b.sort_order))
const existing=computed(()=>rows.value.filter(c=>c.kind==='book'&&c.book_id===draft.value.book_id))
function reset(){
 preview.value=false;confirmDelete.value=false;error.value='';notice.value=''
 draft.value=empty(route.query.kind==='book'?'book':'special')
 const b=availableBooks.value.find(b=>b.id===route.query.awardBook)
 if(b){draft.value.book_id=b.id;if(draft.value.kind==='book')draft.value.title=b.title}
}
watch(()=>route.fullPath,reset,{immediate:true})
function changeKind(){const name=draft.value.child_name,issuer=draft.value.awarded_by;draft.value=empty(draft.value.kind);draft.value.child_name=name;draft.value.awarded_by=issuer}
function changeBook(){draft.value.song_id=null;if(draft.value.kind==='book')draft.value.title=availableBooks.value.find(b=>b.id===draft.value.book_id)?.title??''}
function message(e:unknown){return (e as {message?:string})?.message||'Something went wrong. Please try again.'}
async function load(){
 loading.value=true;error.value=''
 try{
  const result:Certificate[]=[]
  for(let offset=0;;offset+=500){
   const {data,error:err}=await supabase!.from('certificates').select('*').eq('student_id',props.student.id).order('created_at',{ascending:false}).order('id',{ascending:false}).range(offset,offset+499).abortSignal(AbortSignal.timeout(15000))
   if(err)throw err
   result.push(...data);if(data.length<500)break
  }
  if(alive)rows.value=result
 }catch(e){if(alive)error.value=message(e)}
 finally{if(alive)loading.value=false}
}
onMounted(load)
function review(){error.value='';try{validateCertificate(draft.value);preview.value=true}catch(e){error.value=message(e)}}
async function issue(){
 if(busy.value)return
 busy.value=true;error.value=''
 // Keep the entire submitted snapshot fixed across retries.
 const row=JSON.parse(JSON.stringify(draft.value)) as Certificate
 try{
  validateCertificate(row)
  let {data,error:err}=await supabase!.from('certificates').insert(row).select().single()
  if(err){
   const recovered=await supabase!.from('certificates').select('*').eq('id',row.id).maybeSingle()
   if(!recovered.data)throw err
   data=recovered.data
  }
  if(!alive)return
  if(!rows.value.some(c=>c.id===data.id))rows.value.unshift(data)
  await router.push({query:{view:'certificates',certificate:data.id}})
  notice.value='A lovely moment to celebrate! Your certificate is saved.'
 }catch(e){if(alive)error.value=message(e)}
 finally{if(alive)busy.value=false}
}
function edit(){preview.value=false;draft.value.id=crypto.randomUUID()}
async function remove(c:Certificate){
 if(busy.value)return;busy.value=true;error.value=''
 try{
  const {error:err}=await supabase!.from('certificates').delete().eq('id',c.id)
  if(err)throw err
  if(!alive)return
  rows.value=rows.value.filter(r=>r.id!==c.id);await router.push({query:{view:'certificates'}});notice.value='Certificate deleted.'
 }catch(e){if(alive)error.value=message(e)}finally{if(alive)busy.value=false}
}
async function exportPDF(c:Certificate,print=false){
 if(busy.value)return;busy.value=true;error.value=''
 // Open synchronously so browsers allow the print tab.
 const tab=print?window.open('about:blank','_blank'):null
 if(tab){tab.opener=null;tab.document.title='Preparing certificate';tab.document.body.textContent='Preparing your certificate…'}
 try{
  if(print&&!tab)throw new Error('Allow a new tab to print, or download the PDF and print it.')
  const pdf=await certificatePDF(c)
  if(print&&tab){pdf.autoPrint();const url=URL.createObjectURL(pdf.output('blob'));tab.location.href=url;setTimeout(()=>URL.revokeObjectURL(url),60000)}
  else pdf.save(certificateFilename(c))
 }catch(e){tab?.close();if(alive)error.value=message(e)}finally{if(alive)busy.value=false}
}
</script>
<template>
 <section>
  <p v-if="error" class="message error" role="alert">{{error}} <button v-if="!formOpen" class="text-button" @click="load">Try again</button></p>
  <p v-if="notice" class="message success" role="status">{{notice}}</p>
  <p v-if="loading" role="status">Opening your certificates…</p>
  <template v-else-if="formOpen">
   <RouterLink :to="{query:{view:'certificates'}}" class="back">← My Certificates</RouterLink>
   <h1>{{preview?'Your certificate preview':'Celebrate a little pianist'}}</h1>
   <p v-if="archivedRequest" class="message">This book is archived. <RouterLink :to="{query:{book:archivedRequest.id}}">Open the book and restore it</RouterLink> before issuing another award for it.</p>
   <template v-if="preview">
    <CertificatePreview :certificate="draft"/>
    <div class="certificate-actions"><button :disabled="busy" @click="issue">{{busy?'Issuing…':'Issue certificate'}}</button><button class="text-button" :disabled="busy" @click="edit">Edit details</button></div>
   </template>
   <form v-else-if="!archivedRequest" class="panel certificate-form" @submit.prevent="review">
    <fieldset :disabled="busy">
     <label for="award-kind">Certificate type</label><select id="award-kind" v-model="draft.kind" @change="changeKind"><option value="book">Book completion</option><option value="special">Special achievement</option></select>
     <p class="subtle">You decide when to celebrate. Awards do not change song ratings.</p>
     <label for="award-book">{{draft.kind==='book'?'Book':'Related book (optional)'}}</label><select id="award-book" v-model="draft.book_id" :required="draft.kind==='book'" @change="changeBook"><option :value="null">Choose a book</option><option v-for="b in availableBooks" :value="b.id" :key="b.id">{{b.title}}</option></select>
     <p v-if="draft.kind==='book'&&!availableBooks.length">Add or restore a book in My Books first.</p>
     <div v-if="draft.kind==='book'&&existing.length" class="message success">This book already has {{existing.length}} certificate(s). You can issue another.
      <RouterLink :to="{query:{view:'certificates',certificate:existing[0]!.id}}">View certificate</RouterLink>
     </div>
     <template v-if="draft.kind==='special'&&draft.book_id"><label for="award-song">Related song (optional)</label><select id="award-song" v-model="draft.song_id"><option :value="null">No particular song</option><option v-for="s in relatedSongs" :key="s.id" :value="s.id">{{s.title}}</option></select></template>
     <label>Choose a template</label><div class="template-options" role="group" aria-label="Certificate template"><button v-for="t in formTemplates" :key="t.id" type="button" :aria-pressed="draft.template_id===t.id" :class="{chosen:draft.template_id===t.id}" @click="draft.template_id=t.id"><img :src="'/certificates/v1/'+t.image" alt=""><span>{{t.name}}</span></button></div>
     <label for="award-name">Child’s name</label><input id="award-name" v-model.trim="draft.child_name" maxlength="80" required>
     <label for="award-title">{{draft.kind==='book'?'Book title on certificate':'Award title'}}</label><input id="award-title" v-model.trim="draft.title" maxlength="160" required :list="draft.kind==='special'?'award-suggestions':undefined">
     <datalist id="award-suggestions"><option>Beautiful Dynamics</option><option>Steady Rhythm</option><option>Confident Performance</option><option>Great Effort Today</option><option>My First Recital</option></datalist>
     <template v-if="draft.kind==='special'"><label for="award-message">A little message (optional)</label><textarea id="award-message" v-model.trim="draft.message" maxlength="300" rows="3"/></template>
     <div class="certificate-fields"><div><label for="award-date">Award date</label><input id="award-date" v-model="draft.awarded_on" type="date" required></div><div><label for="award-issuer">Awarded by</label><input id="award-issuer" v-model.trim="draft.awarded_by" maxlength="80" placeholder="Mum, Dad, or a name" required></div></div>
     <button class="full" :disabled="draft.kind==='book'&&!draft.book_id">Preview certificate</button>
    </fieldset>
   </form>
  </template>
  <template v-else-if="opened">
   <RouterLink :to="{query:{view:'certificates'}}" class="back">← My Certificates</RouterLink>
   <h1>{{opened.title}}</h1><p>For {{opened.child_name}} · {{opened.awarded_on}}</p>
   <CertificatePreview :certificate="opened"/>
   <p v-if="openedArchived" class="message">This certificate is still saved. To issue another award for this archived book, <RouterLink :to="{query:{book:openedArchived.id}}">open the book and restore it</RouterLink> first.</p>
   <div class="certificate-actions"><button :disabled="busy" @click="exportPDF(opened)">{{busy?'Preparing…':'Download PDF'}}</button><button :disabled="busy" @click="exportPDF(opened,true)">Print</button><RouterLink :to="{query:{view:'certificates',award:'new',kind:opened.kind,awardBook:opened.book_id??undefined}}">Issue another</RouterLink><button class="text-button" :disabled="busy" @click="confirmDelete=true">Delete certificate</button></div>
   <div v-if="confirmDelete" class="panel" role="alert"><h2>Delete this certificate?</h2><p>This removes it from the gallery. Downloaded copies are unaffected.</p><div class="certificate-actions"><button :disabled="busy" @click="remove(opened)">Yes, delete certificate</button><button class="text-button" :disabled="busy" @click="confirmDelete=false">Keep certificate</button></div></div>
  </template>
  <template v-else>
   <div class="page-heading"><div><span class="eyebrow">Little moments worth keeping</span><h1>My Certificates</h1><p>{{student.display_name}}’s musical celebrations.</p></div><RouterLink class="button-link" :to="{query:{view:'certificates',award:'new'}}">Give an award</RouterLink></div>
   <p v-if="route.query.certificate" role="status">That certificate is no longer available.</p>
   <div v-if="rows.length" class="certificate-grid"><RouterLink v-for="c in rows" :key="c.id" :to="{query:{view:'certificates',certificate:c.id}}" class="certificate-card"><img :src="'/certificates/v1/'+templates.find(t=>t.id===c.template_id)?.image" alt="" loading="lazy"><div><span class="pill">{{c.kind==='book'?'Book completion':'Special achievement'}}</span><h2>{{c.title}}</h2><p>{{c.child_name}} · {{c.awarded_on}}</p></div></RouterLink></div>
   <section v-else-if="!error" class="panel welcome"><span class="sun" aria-hidden="true">☆</span><h2>Your celebrations belong here</h2><p>A finished book, a brave performance, or a lovely effort—every award is yours to give.</p></section>
  </template>
 </section>
</template>
