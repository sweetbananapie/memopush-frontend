import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";
import router from "./plugins/router";
import i18n from "./plugins/i18n";
import setupPinia from "./plugins/pinia";

const app = createApp(App);

setupPinia(app);
app.use(router);
app.use(i18n);

app.mount("#app");
