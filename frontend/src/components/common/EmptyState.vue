<script setup lang="ts">
defineProps<{
  title?: string;
  description?: string;
}>();
</script>

<template>
  <div class="empty-state">
    <el-icon :size="30"><svg viewBox="0 0 1024 1024" width="30" height="30"><path fill="currentColor" d="M512 128 64 384v512h320V640h256v256h320V384L512 128z"/></svg></el-icon>
    <strong>{{ title ?? "暂无数据" }}</strong>
    <p v-if="description">{{ description }}</p>
    <slot />
  </div>
</template>
