import { createRouter, createWebHashHistory, type RouteRecordRaw } from "vue-router";

export const routes = [
  { name: "文档导入", route: "/documents" },
  { name: "版本对比", route: "/compare" },
  { name: "风险标注", route: "/risks" },
  { name: "审阅清单", route: "/review" }
] as const;

const records: RouteRecordRaw[] = [
  { path: "/", redirect: "/documents" },
  { path: "/documents", name: "documents", component: () => import("../pages/DocumentsPage.vue") },
  { path: "/compare", name: "compare", component: () => import("../pages/ComparePage.vue") },
  { path: "/risks", name: "risks", component: () => import("../pages/RisksPage.vue") },
  { path: "/review", name: "review", component: () => import("../pages/ReviewPage.vue") },
  { path: "/:pathMatch(.*)*", redirect: "/documents" }
];

export const router = createRouter({
  // hash 路由，nginx try_files 兜底之外再保一层，保证任意目录名部署可刷新
  history: createWebHashHistory(),
  routes: records
});
