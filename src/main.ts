import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";
import router from "./plugins/router";
import i18n from "./plugins/i18n";
import setupPinia from "./plugins/pinia";
import { vMaska } from "maska/vue";

const app = createApp(App);

app.use(router);
app.use(i18n);
setupPinia(app);
app.directive("maska", vMaska);
app.mount("#app");
