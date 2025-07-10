import { createApp } from "vue";
import "@/style.css";
import App from "@/App.vue";
// arco-design
import ArcoVue from "@arco-design/web-vue";
// vue-router
import router from "@/router/index";
// pinia
import pinia from "@/store/index";
// arco-css
import "@arco-design/web-vue/dist/arco.css";
// vchart-arco-theme 主题关联-黑暗模式
import { initVChartArcoTheme } from "@visactor/vchart-arco-theme";
// 额外引入图标库
import ArcoVueIcon from "@arco-design/web-vue/es/icon";
// 注册全局svg
import "virtual:svg-icons-register";
// 引入i18n
import i18n from "@/lang/index";
// 引入字体
import "@/assets/fonts/fonts.scss";
// 引入自定义指令
import directives from "@/directives/index";
// sentry
// import * as Sentry from "@sentry/vue";

// vchart黑暗模式
// https://arco.design/react/docs/vchart
initVChartArcoTheme();

const app = createApp(App);

// Sentry.init({
//   app,
//   dsn: "http://8b699bd44a7a201970e27fbcc1762e39@localhost:9000/4",
//   // Setting this option to true will send default PII data to Sentry.
//   // For example, automatic IP address collection on events
//   sendDefaultPii: true,
//   integrations: [
//     Sentry.browserTracingIntegration({ router }),
//     Sentry.replayIntegration({
//       maskAllText: false,
//       blockAllMedia: false
//     })
//   ],
//   // Tracing
//   tracesSampleRate: 1.0, // Capture 100% of the transactions
//   // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
//   tracePropagationTargets: ["localhost"],
//   // tracePropagationTargets: ["localhost", /^https:\/\/yourserver\.io\/api/],
//   // Session Replay
//   replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
//   replaysOnErrorSampleRate: 1.0 // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
// });

// app.use(plugin, options)
// 其中 plugin 表示要传递的插件对象， options 参数是可选的，表示选项配置
// https://cn.vuejs.org/api/application.html#app-use

app.use(ArcoVue, {
  componentPrefix: "arco"
});
app.use(pinia);
app.use(ArcoVueIcon);
app.use(router);
app.use(i18n);
app.use(directives);
app.mount("#app");
