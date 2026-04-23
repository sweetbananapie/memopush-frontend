import path from "node:path";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";

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
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
