<script setup lang="ts">
withDefaults(
  defineProps<{
    /** 徽章标签文字，默认"已验证"，可传"本文锚定"等 */
    label?: string
    /** 内核版本，如 "6.12" */
    kernel?: string
    /** rustc 版本，如 "1.85" */
    rustc?: string
    /** 日期，如 "2026-10" */
    date?: string
  }>(),
  { label: '已验证' },
)
</script>

<template>
  <p class="version-badge">
    <span class="vb-check">✓</span>
    <span class="vb-label">{{ label }}</span>
    <span v-if="kernel" class="vb-item">kernel {{ kernel }}</span>
    <span v-if="rustc" class="vb-item">rustc {{ rustc }}</span>
    <span v-if="date" class="vb-item">{{ date }}</span>
  </p>
</template>

<style scoped>
.version-badge {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
  margin: 0 0 1rem;
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
}

.vb-check {
  color: var(--vp-button-brand-bg, #345c13);
  font-weight: 600;
}

.vb-label {
  font-weight: 600;
}

.vb-item {
  padding: 0.1rem 0.6rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  background: var(--vp-c-bg-soft);
  font-variant-numeric: tabular-nums;
}
</style>
