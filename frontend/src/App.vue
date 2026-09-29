<script setup lang="ts">
import { inject, onMounted } from "vue";
import { RouterLink, RouterView, useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import { routes } from "./router/routes";
import { usePolicyDocumentStore } from "./stores/PolicyDocumentStore";
import { useDiffResultStore } from "./stores/DiffResultStore";
import { useReviewNoteStore } from "./stores/ReviewNoteStore";

const route = useRoute();
const documentStore = usePolicyDocumentStore();
const diffStore = useDiffResultStore();
const noteStore = useReviewNoteStore();
const seededThisBoot = inject<boolean>("seededThisBoot", false);

onMounted(async () => {
  if (seededThisBoot) {
    ElMessage.success("已载入三版示例政策：v2 中已确认的「信息共享」在 v3 改为出售位置信息后已退回待处理，旧备注保留");
  }
  try {
    await Promise.all([documentStore.load(), diffStore.load(), noteStore.load()]);
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "数据加载失败");
  }
});
</script>

<template>
  <div class="shell">
    <aside>
      <div class="brand">隐私政策差异对比器</div>
      <nav>
        <RouterLink
          v-for="item in routes"
          :key="item.route"
          :to="item.route"
          class="nav-item"
          :class="{ active: route.path === item.route }"
        >
          {{ item.name }}
        </RouterLink>
      </nav>
      <div class="aside-foot">数据保存在浏览器 localStorage<br />纯前端 · 无第三方 API</div>
    </aside>
    <main class="page">
      <RouterView />
    </main>
  </div>
</template>
