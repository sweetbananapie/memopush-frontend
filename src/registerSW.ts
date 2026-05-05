import { registerSW } from "virtual:pwa-register";

async function forceCleanupOldServiceWorkers() {
  if (!("serviceWorker" in navigator)) return;
  const registrations = await navigator.serviceWorker.getRegistrations();
  for (const reg of registrations) {
    const script = reg.active?.scriptURL ?? "";
    if (script.includes("firebase-messaging-sw.js")) {
      console.warn("🧹 Unregister old Firebase SW:", script);
      await reg.unregister();
      window.location.reload();
      return;
    }
  }
  // if (registrations.length) {
  //   // важно: обновляем страницу, чтобы новый SW встал
  //   window.location.reload()

  // }
}

forceCleanupOldServiceWorkers();
export const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    updateSW(true);
  },
  onRegisteredSW(_swUrl, _registration) {},
  onRegisterError(error) {
    console.error("[PWA] Ошибка регистрации SW:", error);
  },
});
