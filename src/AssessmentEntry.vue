<script setup lang="ts">
import {onUnmounted,ref} from 'vue'
import RatingDisplay from './RatingDisplay.vue'
import {supabase,dimensions,meanings,validateDimensions,type Assessment,type AssessmentRevision} from './lib'
const props=defineProps<{assessment:Assessment;isLatest:boolean}>()
const emit=defineEmits<{changed:[assessment:Assessment]}>()
const editing=ref(false),confirmExclude=ref(false),busy=ref(false),error=ref(''),conflict=ref(false)
const scores=ref({fluency:1,dynamics:1,rhythm:1}),feedback=ref('')
const versions=ref<Array<{key:string;label:string;date:string;row:Assessment}>>([]),showVersions=ref(false)
type RevisionRequest={p_id:string;p_assessment_id:string;p_expected_revision:number;p_fluency:number;p_dynamics:number;p_rhythm:number;p_feedback:string|null;p_excluded:boolean}
const pending=ref<RevisionRequest|null>(null)
let alive=true
onUnmounted(()=>{alive=false})
function edit(){
 const a=props.assessment
 scores.value={fluency:a.fluency,dynamics:a.dynamics,rhythm:a.rhythm};feedback.value=a.feedback??''
 editing.value=true;confirmExclude.value=false;error.value='';conflict.value=false;pending.value=null
}
function cancel(){editing.value=false;confirmExclude.value=false;pending.value=null;error.value='';conflict.value=false}
async function effective(){
 const {data,error:err}=await supabase!.from('effective_assessments').select('*').eq('id',props.assessment.id).single()
 if(err)throw err
 return data as Assessment
}
async function reload(){
 busy.value=true;error.value=''
 try {const row=await effective();if(alive){emit('changed',row);cancel();showVersions.value=false}}
 catch(e){if(alive)error.value=(e as {message:string}).message}
 finally{if(alive)busy.value=false}
}
async function revise(excluded:boolean){
 if(busy.value||conflict.value)return
 busy.value=true;error.value=''
 try{
  if(!pending.value){
   const a=props.assessment,ratings=editing.value?scores.value:a,note=editing.value?feedback.value.trim():a.feedback
   validateDimensions(ratings,note??'')
   pending.value={p_id:crypto.randomUUID(),p_assessment_id:a.id,p_expected_revision:a.revision_number??0,
    p_fluency:ratings.fluency,p_dynamics:ratings.dynamics,p_rhythm:ratings.rhythm,p_feedback:note,p_excluded:excluded}
  }
  const {error:err}=await supabase!.rpc('revise_assessment',pending.value)
  if(err)throw err
  const row=await effective()
  if(alive){emit('changed',row);cancel();showVersions.value=false;versions.value=[]}
 }catch(e){if(alive){error.value=(e as {message:string}).message;conflict.value=(e as {code?:string}).code==='40001'}}
 finally{if(alive)busy.value=false}
}
async function history(){
 if(showVersions.value){showVersions.value=false;return}
 busy.value=true;error.value=''
 try{
  const {data:original,error:err}=await supabase!.from('assessments').select('*').eq('id',props.assessment.id).single()
  if(err)throw err
  const rows:AssessmentRevision[]=[]
  for(let offset=0;;offset+=500){
   const {data,error:revisionError}=await supabase!.from('assessment_revisions').select('*').eq('assessment_id',props.assessment.id).order('revision_number').range(offset,offset+499)
   if(revisionError)throw revisionError
   rows.push(...data);if(data.length<500)break
  }
  if(alive){
   versions.value=[{key:'original',label:'Original assessment',date:original.assessed_at,row:original},...rows.map(r=>({key:r.id,label:`Revision ${r.revision_number}${r.excluded?' · Excluded from progress':''}`,date:r.created_at,row:{...original,...r,id:original.id}}))]
   showVersions.value=true
  }
 }catch(e){if(alive)error.value=(e as {message:string}).message}
 finally{if(alive)busy.value=false}
}
</script>

<template>
 <div class="history-top"><RatingDisplay :assessment="assessment"/><span v-if="isLatest" class="pill">Latest</span></div>
 <time :datetime="assessment.assessed_at">{{new Date(assessment.assessed_at).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'})}}</time>
 <span v-if="assessment.excluded" class="pill">Excluded from progress</span>
 <span v-if="assessment.revision_number" class="pill">Corrected · revision {{assessment.revision_number}}</span>
 <p v-if="assessment.feedback" class="feedback">{{assessment.feedback}}</p>
 <p v-if="error" role="alert" class="message error">{{error}}</p>
 <button v-if="conflict" :disabled="busy" @click="reload">Reload assessment</button>
 <form v-if="editing" class="correction-form" @submit.prevent="revise(!!assessment.excluded)">
  <p>Fix this entry without changing its original practice date.</p>
  <fieldset :disabled="busy||!!pending">
   <label v-for="dimension in dimensions" :key="dimension">{{dimension[0].toUpperCase()+dimension.slice(1)}} correction
    <select v-model.number="scores[dimension]"><option v-for="n in 3" :key="n" :value="n">{{n}} · {{meanings[n]}}</option></select>
   </label>
   <label>Corrected note<textarea v-model="feedback" maxlength="2000" rows="3"/></label>
  </fieldset>
  <p v-if="pending&&!conflict" class="subtle">The submitted details stay fixed for a safe retry. Cancel to start again.</p>
  <div class="management-actions"><button :disabled="busy||conflict">{{pending?'Retry correction':'Save correction'}}</button><button type="button" class="text-button" :disabled="busy" @click="cancel">Cancel correction</button></div>
 </form>
 <div v-else-if="confirmExclude" class="management-box">
  <p>Exclude this accidental entry from progress? It stays in history and can be restored.</p>
  <div class="management-actions"><button :disabled="busy||conflict" @click="revise(true)">Confirm exclusion</button><button class="text-button" :disabled="busy" @click="cancel">Keep assessment</button></div>
 </div>
 <div v-else class="management-actions">
  <button class="text-button" :disabled="busy||!!pending" @click="edit">Correct assessment</button>
  <button v-if="assessment.excluded" class="text-button" :disabled="busy||conflict" @click="revise(false)">{{pending?'Retry restore':'Restore assessment'}}</button>
  <button v-else class="text-button" :disabled="busy" @click="confirmExclude=true;error=''">Exclude from progress</button>
  <button class="text-button" :disabled="busy" @click="history">{{showVersions?'Hide edit history':'View edit history'}}</button>
 </div>
 <div v-if="showVersions" class="edit-history">
  <div v-for="version in versions" :key="version.key" class="management-box">
   <strong>{{version.label}}</strong><time :datetime="version.date">{{new Date(version.date).toLocaleString()}}</time>
   <RatingDisplay :assessment="version.row"/><p v-if="version.row.feedback" class="feedback">{{version.row.feedback}}</p>
  </div>
 </div>
</template>
