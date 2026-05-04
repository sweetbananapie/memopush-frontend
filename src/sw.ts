/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";

declare let self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: any;
};

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

import deckService from "./services/deckService";

self.addEventListener("notificationclick", (event) => {
  event.waitUntil(deckService.handleClick(self, event));
});
self.addEventListener("push", (event) => {
  event.waitUntil(deckService.start(self, event));
});
self.addEventListener("message", async (event) => {
  event.waitUntil(deckService.start(self));
});
