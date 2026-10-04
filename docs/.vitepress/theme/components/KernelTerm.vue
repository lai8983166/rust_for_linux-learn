<script setup lang="ts">
defineProps<{
  /** 英文原文术语，如 "safety abstraction" */
  en: string
}>()
</script>

<template>
  <span class="kernel-term">
    <slot />
    <span class="kt-en" :title="`英文原文：${en}`">{{ en }}</span>
  </span>
</template>

<style scoped>
.kernel-term {
  display: inline;
}

.kt-en {
  margin-left: 0.25rem;
  padding: 0.05rem 0.4rem;
  border-radius: 4px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-3);
  font-size: 0.8em;
  cursor: help;
  user-select: none;
}
</style>
