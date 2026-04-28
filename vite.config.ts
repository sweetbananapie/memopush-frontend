import path from "node:path";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import { VitePWA } from "vite-plugin-pwa";

import VueRouter from "vue-router/vite";

export default defineConfig({
  plugins: [
    VueRouter({
      routesFolder: "src/routes",
      exclude: [
        "**/_*/**", // исключает папки, начинающиеся с "_"
        "**/_*", // исключает файлы, начинающиеся с "_"
      ],
      dts: "src/auto-routes.d.ts",
    }),
    vue(),
    tailwindcss(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      registerType: "autoUpdate",
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,json,vue,txt,woff2}"],
      },
      devOptions: {
        enabled: true,
        type: "module",
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
