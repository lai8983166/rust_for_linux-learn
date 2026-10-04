<script setup lang="ts">
defineProps<{
  /** 验证过的内核版本，如 "6.12" */
  kernel?: string
  /** 验证过的 rustc 版本，如 "1.85" */
  rustc?: string
  /** 验证日期，如 "2026-10" */
  date?: string
}>()
</script>

<template>
  <p class="version-badge">
    <span class="vb-check">✓</span>
    <span class="vb-label">已验证</span>
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
