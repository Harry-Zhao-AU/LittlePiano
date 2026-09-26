<script setup lang="ts">
import {ref,watch} from 'vue'
import {renderCertificate,type Certificate} from './certificates'
const props=defineProps<{certificate:Certificate}>()
const src=ref(''),error=ref('');let generation=0
watch(()=>props.certificate,async(c)=>{
 const run=++generation;src.value='';error.value=''
 try{const canvas=await renderCertificate(c);if(run===generation)src.value=canvas.toDataURL('image/jpeg',0.85)}
 catch(e){if(run===generation)error.value=(e as Error).message}
},{immediate:true,deep:true})
</script>
<template><div class="certificate-preview"><p v-if="error" role="alert">{{error}}</p><img v-else-if="src" :src="src" :alt="`Certificate for ${certificate.child_name}: ${certificate.title}, awarded by ${certificate.awarded_by} on ${certificate.awarded_on}`"><p v-else role="status">Preparing your certificate…</p></div></template>
