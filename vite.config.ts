import path from "node:path";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import { VitePWA } from "vite-plugin-pwa";

import VueRouter from "vue-router/vite";

export default defineConfig({
  base: "/memopush-frontend/",
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
        // globPatterns: ["**/*.{js,css,html,ico,png,svg,json,vue,txt,woff2}"],
        injectionPoint: undefined,
      },
      devOptions: {
        enabled: true,
        type: "module",
      },
      manifest: {
        name: "MemoPush",
        short_name: "MemoPush",
        description: "Приложение для запоминания через уведомления",
        theme_color: "#ffffff",
        start_url: "/memopush-frontend/",
        scope: "/memopush-frontend/",
        display: "standalone",
        // icons: [
        //   {
        //     src: "icons/icon-192x192.png",
        //     sizes: "192x192",
        //     type: "image/png",
        //   },
        //   {
        //     src: "icons/icon-512x512.png",
        //     sizes: "512x512",
        //     type: "image/png",
        //   },
        // ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
