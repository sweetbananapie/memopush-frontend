<script setup lang="ts">
import { Button } from "@/components/ui/button";
</script>
<template>
  <div>
    <Button :variant="'default'" @click="$router.push({ name: '/decks/' })"
      >Click me</Button
    >
  </div>
</template>
