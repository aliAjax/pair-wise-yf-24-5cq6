<script setup lang="ts">
withDefaults(defineProps<{ title?: string; hint?: string }>(), {
  title: "暂无数据",
  hint: ""
});
</script>

<template>
  <div class="empty-state">
    <div class="empty-icon">📄</div>
    <strong>{{ title }}</strong>
    <p v-if="hint">{{ hint }}</p>
    <slot />
  </div>
</template>
