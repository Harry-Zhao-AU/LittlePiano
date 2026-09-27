<script setup lang="ts">
import Certificates from './Certificates.vue'
import RatingDisplay from './RatingDisplay.vue'
import AssessmentEntry from './AssessmentEntry.vue'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Session } from '@supabase/supabase-js'
import { supabase, configured, meanings, newest, latest, saveAssessment, compareBooks, selectableBooks, shelfBooks, dimensions, wellLearned } from './lib'
import type { Book, Song, Student, StudentBook, Assessment } from './lib'
const route = useRoute(), router = useRouter()
const session = ref<Session | null>(null), loading = ref(true), saving = ref(false), error = ref(''), notice = ref('')
const student = ref<Student | null>(null), books = ref<Book[]>([]), songs = ref<Song[]>([]), selected = ref<StudentBook[]>([]), assessments = ref<Assessment[]>([])
const name = ref(''), choice = ref(''), ratings = ref({fluency:0,dynamics:0,rhythm:0}), feedback = ref(''), submissionId = ref(crypto.randomUUID())
const loadFailed = ref(false)
const editingProfile=ref(false),profileName=ref(''),confirmArchive=ref(false)
const archivedView=computed(()=>route.query.shelf==='archived')
const sources = ref<{book_id:string; source_url:string; verified_at:string}[]>([])
const current = computed(() => selected.value.find(b => b.id === route.query.book))
const book = computed(() => books.value.find(b => b.id === current.value?.book_id))
const bookSongs = computed(() => songs.value.filter(s => s.book_id === book.value?.id).sort((a,b) => a.sort_order-b.sort_order))
const song = computed(() => bookSongs.value.find(s => s.id === route.query.song))
const history = computed(() => newest(assessments.value.filter(a => a.student_book_id === current.value?.id && a.song_id === song.value?.id)))
const available = computed(() => selectableBooks(books.value, selected.value))
const ownBooks = computed(() => shelfBooks(selected.value,archivedView.value).map(sb => ({...sb, book: books.value.find(b => b.id === sb.book_id)!})).filter(sb => sb.book))
function rating(sb: string, s: string) { return latest(assessments.value, sb, s) }
function progress(sb: StudentBook) {
 const list = songs.value.filter(s => s.book_id === sb.book_id)
 return {total:list.length, assessed:list.filter(s=>rating(sb.id,s.id)).length, learned:list.filter(s=>wellLearned(rating(sb.id,s.id))).length}
}
function describe(e: unknown) { return e instanceof Error ? e.message : (e as {message?:string})?.message || 'Something went wrong. Please try again.' }
let generation = 0
function clearPrivate() { student.value=null; selected.value=[]; assessments.value=[]; books.value=[]; songs.value=[]; sources.value=[];editingProfile.value=false;profileName.value='';confirmArchive.value=false }
// Page through tables instead of silently losing rows at PostgREST's default limit.
async function all<T>(table: string): Promise<T[]> {
 const rows:T[]=[]
 for(let offset=0;;offset+=500) {
  const {data,error:err}=await supabase!.from(table).select('*').order('id').range(offset,offset+499).abortSignal(AbortSignal.timeout(15000))
  if(err) throw err
  rows.push(...data as T[])
  if(data.length<500) return rows
 }
}
async function load() {
 const run=++generation
 loading.value=true; error.value='';loadFailed.value=false
 try {
  const [ss,bb,so,sb,aa,src]=await Promise.all([all<Student>('students'),all<Book>('books'),all<Song>('songs'),all<StudentBook>('student_books'),all<Assessment>('effective_assessments'),all<{book_id:string;source_url:string;verified_at:string}>('catalogue_sources')])
  if(run!==generation) return
  student.value=ss[0]??null; books.value=bb.sort(compareBooks); songs.value=so; selected.value=sb; assessments.value=aa; sources.value=src
 } catch(e) { if(run===generation) {error.value=describe(e);loadFailed.value=true} }
 finally { if(run===generation) loading.value=false }
}
async function act(fn:()=>Promise<void>) {
 if(saving.value) return
 saving.value=true; error.value=''; notice.value=''
 try { await fn() } catch(e) { error.value=describe(e) } finally { saving.value=false }
}
async function signIn() { await act(async()=>{const {error:err}=await supabase!.auth.signInWithOAuth({provider:'google',options:{redirectTo:window.location.origin+'/'}});if(err)throw err}) }
async function signOut() { await act(async()=>{ const {error:err}=await supabase!.auth.signOut();if(err)throw err;await router.replace('/') }) }
async function createProfile() {
 await act(async()=>{
  const {error:err}=await supabase!.from('students').insert({display_name:name.value.trim(),owner_user_id:session.value!.user.id})
  if(err)throw err
  await load()
 })
}
async function addBook() {
 if(!choice.value||!student.value)return
 await act(async()=>{
  const {data,error:err}=await supabase!.from('student_books').insert({student_id:student.value!.id,book_id:choice.value}).select().single()
  if(err)throw err
  selected.value.push(data);choice.value='';await router.push({query:{book:data.id}})
 })
}
async function updateProfile(){
 const target=student.value,expectedUser=session.value?.user.id
 if(!target)return
 await act(async()=>{
  const display_name=profileName.value.trim()
  if(!display_name||display_name.length>80)throw new Error('Enter a name between 1 and 80 characters.')
  const {data,error:err}=await supabase!.from('students').update({display_name}).eq('id',target.id).select().single()
  if(err)throw err
  if(session.value?.user.id!==expectedUser)return
  student.value=data;editingProfile.value=false;notice.value='Profile updated.'
 })
}
async function archiveBook(archived:boolean){
 const target=current.value,expectedUser=session.value?.user.id
 if(!target)return
 await act(async()=>{
  const {data,error:err}=await supabase!.rpc('set_book_archived',{p_student_book_id:target.id,p_archived:archived}).single<StudentBook>()
  if(err)throw err
  if(session.value?.user.id!==expectedUser)return
  selected.value=selected.value.map(b=>b.id===target.id?data:b);confirmArchive.value=false
  notice.value=archived?'Book archived. Your history and certificates are saved.':'Book restored.'
 })
}
function assessmentChanged(row:Assessment){assessments.value=assessments.value.map(a=>a.id===row.id?row:a)}
async function save() {
 if(!song.value||!current.value||current.value.archived_at)return
 const expectedUser=session.value?.user.id
 const row={id:submissionId.value,student_book_id:current.value.id,song_id:song.value.id,...ratings.value,feedback:feedback.value.trim()}
 await act(async()=>{
  let saved:Assessment
  try { saved=await saveAssessment(row) }
  catch(e) {
   // The UUID stays stable across a network retry. Recover an acknowledged or
   // unacknowledged committed insert without creating a duplicate assessment.
   const {data}=await supabase!.from('effective_assessments').select('*').eq('id',row.id).maybeSingle()
   if(!data)throw e
   saved=data
  }
  if(session.value?.user.id!==expectedUser)return
  if(!assessments.value.some(a=>a.id===saved.id))assessments.value.push(saved)
  submissionId.value=crypto.randomUUID();ratings.value={fluency:0,dynamics:0,rhythm:0};feedback.value='';notice.value='Saved! Every little step counts.'
 })
}
watch(()=>route.fullPath,()=>{ ratings.value={fluency:0,dynamics:0,rhythm:0};feedback.value='';submissionId.value=crypto.randomUUID();notice.value='';error.value='';confirmArchive.value=false;editingProfile.value=false })
let unsubscribe:undefined|(()=>void)
onMounted(async()=>{
 if(!supabase){loading.value=false;return}
 const oauthError=new URLSearchParams(location.hash.slice(1)).get('error_description') || new URLSearchParams(location.search).get('error_description')
 const {data}=supabase.auth.onAuthStateChange((event,next)=>{
  const changed=session.value?.user.id!==next?.user.id
  session.value=next
  if(changed||event==='INITIAL_SESSION') {
   ++generation;clearPrivate()
   if(next) { setTimeout(()=>{if(session.value?.user.id===next.user.id)void load()},0) }
   else {loading.value=false}
  }
 })
 unsubscribe=()=>data.subscription.unsubscribe()
 if(oauthError){await router.replace('/');error.value=oauthError}
})
onUnmounted(()=>unsubscribe?.())
</script>

<template>
 <div class="shell">
  <header><RouterLink to="/" class="brand"><span class="brand-icon" aria-hidden="true">♬</span> little piano<span class="brand-dot">.</span></RouterLink><span class="tagline">Small steps. Beautiful music.</span><button v-if="session" class="text-button" :disabled="saving" @click="signOut">Sign out</button></header>
  <nav v-if="session && student" class="main-nav" aria-label="Main navigation"><RouterLink to="/" :aria-current="route.query.view!=='certificates'?'page':undefined">My Books</RouterLink><RouterLink :to="{query:{view:'certificates'}}" :aria-current="route.query.view==='certificates'?'page':undefined">My Certificates</RouterLink></nav>
  <main>
   <section v-if="!configured" class="panel welcome"><span class="eyebrow">A little setup, then music</span><h1>Your piano adventure starts here.</h1><p>An adult needs to connect this app to your Supabase project.</p><p>Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> to <code>.env.local</code>, then restart the development server. See the README for database and Google sign-in setup.</p></section>
   <template v-else>
    <div v-if="error" role="alert" class="message error">{{ error }} <button v-if="session && !saving" class="text-button" @click="load">Reload data</button></div>
    <p v-if="notice" role="status" class="message success">{{ notice }}</p>
    <section v-if="loading" class="panel" aria-live="polite"><h1>Getting your music ready…</h1><p>Loading your books and progress.</p></section>
    <section v-else-if="!session" class="welcome panel"><span class="eyebrow">A place to grow, one song at a time</span><h1>Big smiles.<br>Little piano moments.</h1><p>Celebrate the songs you’re learning and see how far you’ve come.</p><div class="piano" aria-hidden="true"><i v-for="n in 10" :key="n" :class="{black:[1,2,4,5,6,8,9].includes(n)}"></i></div><button :disabled="saving" @click="signIn">{{ saving ? 'Opening sign-in…' : 'Continue with Google' }}</button><p class="subtle">For your grown-up to sign in. Your progress stays private.</p></section>
    <section v-else-if="loadFailed" class="panel"><h1>Your music is taking a little longer.</h1><p>We couldn’t load your saved progress. Please try again.</p><button @click="load">Try again</button></section>
    <section v-else-if="!student" class="panel welcome"><span class="eyebrow">Hello, music maker</span><h1>Who’s at the piano?</h1><p>A first name or nickname is perfect.</p><form @submit.prevent="createProfile"><label for="name">Your child’s name</label><input id="name" v-model="name" maxlength="80" autocomplete="off" required><button :disabled="saving||!name.trim()">{{ saving ? 'Getting ready…' : 'Let’s begin' }}</button></form></section>
    <Certificates v-else-if="route.query.view==='certificates'" :key="student.id" :student="student" :books="books" :songs="songs" :selected="selected"/>
    <template v-else-if="song && book && current">
     <RouterLink :to="{query:{book:current.id}}" class="back">← Back to {{ book.level }} · {{ book.book_type }}</RouterLink>
     <div v-if="current.archived_at" class="management-box"><p>This book is archived. Restore it to record new practice. You can still correct existing entries.</p><button :disabled="saving" @click="archiveBook(false)">Restore book</button></div>
     <section class="song-layout"><div class="panel rate"><span class="eyebrow">{{ song.page_number ? `Page ${song.page_number}` : 'Your next little adventure' }}</span><h1>{{ song.title }}</h1><p>How is this song feeling today?</p><form @submit.prevent="save"><fieldset :disabled="saving||!!current.archived_at"><legend>Give each skill its stars</legend><div v-for="dimension in dimensions" :key="dimension" class="dimension"><h2>{{ dimension[0].toUpperCase()+dimension.slice(1) }}</h2><div class="star-options"><button v-for="n in 3" :key="n" type="button" :class="{chosen:ratings[dimension]===n}" :aria-pressed="ratings[dimension]===n" :aria-label="`${dimension}: ${n} ${n===1?'star':'stars'}: ${meanings[n]}`" @click="ratings[dimension]=n"><span class="stars" aria-hidden="true">{{ '★'.repeat(n) }}</span><span>{{ meanings[n] }}</span></button></div></div><label for="feedback">A little note <span class="subtle">(optional)</span></label><textarea id="feedback" v-model="feedback" maxlength="2000" rows="4" placeholder="What went well? What shall we try next?"></textarea></fieldset><button class="full" :disabled="saving||!!current.archived_at||dimensions.some(d=>!ratings[d])">{{ saving ? 'Saving your stars…' : 'Save this moment' }}</button></form><p class="subtle">Each rating is a new moment in your story.</p></div>
     <section class="panel history"><span class="eyebrow">Look how you’re growing</span><h2>Your song story</h2><p v-if="!history.length">No assessments yet. Your first stars are waiting!</p><ol v-else><li v-for="a in history" :key="a.id"><AssessmentEntry :assessment="a" :is-latest="rating(current.id,song.id)?.id===a.id" @changed="assessmentChanged"/></li></ol></section></section>
    </template>
    <template v-else-if="book && current">
     <RouterLink to="/" class="back">← My music shelf</RouterLink><div class="page-heading"><div><span class="eyebrow">{{ book.series }} · {{ book.level }}</span><h1>{{ book.title }}</h1><p>{{ book.edition }} · {{ book.language }}</p></div><div class="score"><strong>{{ progress(current).learned }}</strong><span>songs with all three skills well learned</span></div></div>
     <p class="catalogue-note" v-if="book.catalogue_status==='partial'">Partial catalogue · {{ bookSongs.length }} verified entries. {{ book.catalogue_notes || "Some songs are still missing. Progress reflects listed songs only." }}</p><p class="catalogue-note" v-else>Publisher progress chart verified · {{ bookSongs.length }} entries. {{ book.catalogue_notes }}</p>
     <div class="management-actions">
      <template v-if="current.archived_at"><span class="pill">Archived book</span><button :disabled="saving" @click="archiveBook(false)">Restore book</button></template>
      <template v-else><RouterLink class="button-link" :to="{query:{view:'certificates',award:'new',kind:'book',awardBook:book.id}}">Give completion certificate</RouterLink><button class="text-button" :disabled="saving" @click="confirmArchive=true">Archive book</button></template>
     </div>
     <div v-if="confirmArchive" class="management-box"><p>Archive this book? Your progress, history, and certificates stay saved. You can restore it from Archived books.</p><div class="management-actions"><button :disabled="saving" @click="archiveBook(true)">Confirm archive</button><button class="text-button" :disabled="saving" @click="confirmArchive=false">Keep active</button></div></div>
     <div class="legend">★ Getting started <span>★★ Almost there</span><span>★★★ Well learned</span></div>
     <div class="song-list"><RouterLink v-for="s in bookSongs" :key="s.id" :to="{query:{book:current.id,song:s.id}}" class="song-row"><span class="page-num">{{ s.page_number ? `p. ${s.page_number}` : '♪' }}</span><strong>{{ s.title }}</strong><span v-if="rating(current.id,s.id)" class="rating rating-summary"><RatingDisplay :assessment="rating(current.id,s.id)!" /></span><span v-else class="unassessed">Not assessed</span><span aria-hidden="true">↗</span></RouterLink><p v-if="!bookSongs.length" class="panel">This book’s song list is still being verified.</p></div>
     <details><summary>About this catalogue</summary><p>Metadata only. Match the level, edition and language to your printed book. Exact pages are shown where verified; chart ranges are recorded in the catalogue review.</p><ul><li v-for="source in sources.filter(s=>s.book_id===book!.id).filter((s,i,a)=>a.findIndex(x=>x.source_url===s.source_url)===i)" :key="source.source_url"><a v-if="source.source_url.startsWith('https://')" :href="source.source_url" target="_blank" rel="noopener noreferrer">Publisher source</a><span v-else>Family photo of printed Progress Chart</span> · {{ source.verified_at }}</li></ul></details>
    </template>
    <template v-else>
     <div class="page-heading"><div><span class="eyebrow">A little practice. A little progress.</span><h1>{{ student.display_name }}’s music shelf</h1><p>Pick a book. Find a song. Celebrate a step forward.</p></div><span class="sun" aria-hidden="true">☀</span></div>
     <button v-if="!editingProfile" class="text-button" @click="profileName=student.display_name;editingProfile=true">Edit profile</button>
     <form v-else class="panel profile-form" @submit.prevent="updateProfile"><label for="profile-name">Child's name</label><input id="profile-name" v-model="profileName" maxlength="80" required :disabled="saving"><p class="subtle">New certificates use this name. Previously issued certificates keep their original details.</p><div class="management-actions"><button :disabled="saving||!profileName.trim()">Save changes</button><button type="button" class="text-button" :disabled="saving" @click="editingProfile=false">Cancel</button></div></form>
     <nav class="main-nav shelf-nav" aria-label="Book shelf"><RouterLink to="/" :aria-current="!archivedView?'page':undefined">Active books</RouterLink><RouterLink :to="{query:{shelf:'archived'}}" :aria-current="archivedView?'page':undefined">Archived books</RouterLink></nav>
     <p v-if="archivedView&&!ownBooks.length">No archived books yet.</p>
     <p v-if="route.query.book" role="status">That book isn’t on your shelf. Choose one below.</p>
     <div class="book-grid"><RouterLink v-for="sb in ownBooks" :key="sb.id" :to="{query:{book:sb.id}}" class="book-card"><div class="book-art"><span>{{ sb.book.series }}</span><strong>{{ sb.book.level }}</strong><span>{{ sb.book.title }}</span><span class="music-mark" aria-hidden="true">𝄞</span></div><div class="book-info"><h2>{{ sb.book.title }} <span aria-hidden="true">↗</span></h2><p>{{ sb.book.edition }} · {{ sb.book.language }}</p><progress :value="progress(sb).learned" :max="progress(sb).total||1" :aria-label="`${progress(sb).learned} of ${progress(sb).total} listed songs well learned`"></progress><p><strong>{{ progress(sb).learned }} well learned</strong> · {{ progress(sb).assessed }} of {{ progress(sb).total }} assessed</p><span class="pill">{{ sb.book.catalogue_status==='partial' ? 'Partial song list' : 'Verified complete' }}</span></div></RouterLink></div>
     <section v-if="!archivedView" class="panel add-book"><div><h2>{{ selected.length ? 'Make room for another adventure' : 'Your first book is waiting' }}</h2><p>Choose the edition you have at home. To bring back a saved book, open Archived books.</p></div><form v-if="available.length" @submit.prevent="addBook"><label class="sr-only" for="book">Choose a book</label><select id="book" v-model="choice" required><option disabled value="">Choose a Piano Adventures book</option><option v-for="b in available" :key="b.id" :value="b.id">{{ b.series }} · {{ b.title }} · {{ b.edition }} · {{ b.language }}{{ b.catalogue_status==='partial'?' (partial)':'' }}</option></select><button :disabled="saving||!choice">{{ saving ? 'Adding…' : 'Add to my shelf' }}</button></form><p v-else>{{ books.length ? 'All available books are already selected. Check Archived books to restore one.' : 'The catalogue has not been loaded yet. An adult can follow the README to import it.' }}</p></section>
    </template>
   </template>
  </main><footer>Every song is a chance to grow. <span aria-hidden="true">♪</span></footer>
 </div>
</template>
