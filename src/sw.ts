/// <reference lib="webworker" />
declare let self: ServiceWorkerGlobalScope;
declare const __WB_MANIFEST: any;

import deckService from "./services/deckService";
import { clientsClaim } from "workbox-core";
import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { NetworkFirst } from "workbox-strategies";

// PWA lifecycle
self.skipWaiting();
clientsClaim();

// precache Vite
precacheAndRoute(self.__WB_MANIFEST);

// SPA fallback
registerRoute(
  ({ request }) => request.mode === "navigate",
  new NetworkFirst({ cacheName: "pages" }),
);

self.addEventListener("notificationclick", (event) => {
  event.waitUntil(deckService.handleClick(self, event));
});
self.addEventListener("push", (event) => {
  event.waitUntil(deckService.start(self));
});
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
