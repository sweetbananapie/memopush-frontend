import { createRouter, createWebHashHistory } from "vue-router";
import { routes, handleHotUpdate } from "vue-router/auto-routes";
// import { useAuthStore } from "@/stores/auth";

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

// router.beforeEach((to, _from, next) => {
//   const authStore = useAuthStore();
//   const isDashboard = to.path.startsWith("/dashboard");
//   if (isDashboard && !authStore.accessToken) {
//     next({ name: "/auth/login" });
//   } else {
//     next();
//   }
// });

// if (import.meta.hot) {
//   handleHotUpdate(router);

//   import.meta.hot.on("vite:beforeUpdate", () => {
//     setTimeout(() => {
//       const currentRoute = router.currentRoute.value;
//       if (currentRoute.name && !router.hasRoute(currentRoute.name)) {
//         router.replace({ name: "/dashboard/directory" }).catch(() => {
//           window.location.reload();
//         });
//       }
//     }, 100);
//   });
// }

router.onError((error, to) => {
  const isChunkLoadError =
    error?.message?.includes("Failed to fetch dynamically imported module") ||
    error?.message?.includes("Importing a module script failed") ||
    error?.message?.includes("Unable to preload CSS");
  // если ошибка загрузки модуля, то перезагружаем страницу и переходим на роут который был запрошен
  if (isChunkLoadError) {
    window.location.href = to.fullPath;
    return;
  }
  // если ошибка навигации и роута на который пытаемся перейти не существует, то перезагружаем страницу
  if (
    error?.name === "NavigationFailure" ||
    error?.message?.includes("route")
  ) {
    setTimeout(() => window.location.reload(), 100);
  }
});

export default router;
