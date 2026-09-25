<script setup lang="ts">
import { dimensions, meanings, type Assessment } from './lib'
defineProps<{ assessment: Assessment }>()
</script>
<template>
 <span class="skill-scores">
  <span v-for="skill in dimensions" :key="skill" class="skill-score" :aria-label="`${skill}: ${assessment[skill]} stars, ${meanings[assessment[skill]]}`">
   <span class="skill-name">{{ skill }}</span><span class="stars" aria-hidden="true">{{ '★'.repeat(assessment[skill]) }}<span class="empty-stars">{{ '☆'.repeat(3-assessment[skill]) }}</span></span>
   <span class="sr-only">{{ meanings[assessment[skill]] }}</span>
  </span>
 </span>
</template>
