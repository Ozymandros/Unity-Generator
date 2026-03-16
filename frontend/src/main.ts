import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import vuetify from "./plugins/vuetify";
import i18n from "./i18n";

const app = createApp(App);
app.use(createPinia());
app.use(vuetify);
app.use(i18n);
app.mount("#app");
