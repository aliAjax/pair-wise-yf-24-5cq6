<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { routes } from "./router/routes";
import StatusBadge from "./components/common/StatusBadge.vue";

const route = useRoute();
const current = computed(() => routes.find((item) => route.path.startsWith(item.route)) ?? routes[0]);
</script>

<template>
  <div class="shell">
    <aside>
      <div class="brand">隐私政策<br />差异对比器</div>
      <nav>
        <RouterLink v-for="entry in routes" :key="entry.route" :to="entry.route" custom v-slot="{ navigate, isActive }">
          <button :class="{ active: isActive }" @click="navigate">{{ entry.name }}</button>
        </RouterLink>
      </nav>
      <div class="sidebar-foot">
        <StatusBadge value="LOCAL_DATA" />
        <p>数据仅保存在本浏览器 localStorage</p>
      </div>
    </aside>
    <main class="page">
      <section class="page-head">
        <div>
          <p class="eyebrow">policy-diff</p>
          <h1>{{ current.name }}</h1>
        </div>
        <slot name="actions" />
      </section>
      <RouterView />
    </main>
  </div>
</template>
