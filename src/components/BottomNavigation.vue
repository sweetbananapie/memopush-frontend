<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Layers, Play, Settings } from "lucide-vue-next";
import { Button } from "@/components/ui/button";

const route = useRoute();
const router = useRouter();

const isDecksActive = computed(() => route.name?.startsWith("/decks"));
const isSettingsActive = computed(() => route.name === "/settings");

const goToDecks = () => {
  router.push({ name: "/decks/" });
};

const goToSettings = () => {
  router.push({ name: "/settings" });
};

const handleStartSession = async () => {
  try {
    const sw = await navigator.serviceWorker.ready;
    await sw.active?.postMessage("message");
  } catch (error) {
    console.error("Failed to start session:", error);
  }
};
</script>

<template>
  <nav
    class="fixed bottom-0 inset-x-0 z-50 border-t bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80"
  >
    <div class="container mx-auto max-w-5xl px-4 py-3">
      <div class="grid grid-cols-3 gap-2">
        <Button
          :variant="isDecksActive ? 'link' : 'ghost'"
          class="flex h-20 flex-col items-center w-full"
          @click="goToDecks"
        >
          <Layers class="w-4 h-4" />
          Колоды
        </Button>

        <Button
          class="flex h-20 flex-col items-center w-full"
          @click="handleStartSession"
          :variant="'ghost'"
        >
          <Play class="w-4 h-4" />
          Начать практику
        </Button>

        <Button
          :variant="isSettingsActive ? 'link' : 'ghost'"
          class="flex h-20 flex-col items-center w-full"
          @click="goToSettings"
        >
          <Settings class="w-4 h-4" />
          Настройки
        </Button>
      </div>
    </div>
  </nav>
</template>
