import { createApp } from "vue";
import { createPinia } from "pinia";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import App from "./App.vue";
import { router } from "./router/routes";
import { ensureSeedData } from "./mocks/bootstrap";
import "./styles.css";

ensureSeedData();

createApp(App).use(createPinia()).use(router).use(ElementPlus).mount("#app");
