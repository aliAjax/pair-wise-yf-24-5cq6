import { createApp } from "vue";
import { createPinia } from "pinia";
import ElementPlus from "element-plus";
import zhCn from "element-plus/es/locale/lang/zh-cn";
import "element-plus/dist/index.css";
import App from "./App.vue";
import { router } from "./router/routes";
import { seedIfNeeded } from "./services/seedService";
import "./styles.css";

// 首次启动先播种示例（走真实导入/对比/审阅引擎），保证各路由页挂载时数据已就绪
async function bootstrap(): Promise<void> {
  let seeded = false;
  try {
    seeded = await seedIfNeeded();
  } catch (error) {
    console.error("[policy-diff] 初始化播种失败", error);
  }
  const app = createApp(App);
  app.use(createPinia()).use(router).use(ElementPlus, { locale: zhCn });
  // 仅本次首次播种时提示，刷新不再重复弹出
  app.provide("seededThisBoot", seeded);
  app.mount("#app");
}

void bootstrap();
