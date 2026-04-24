<script setup lang="ts">
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Lightbulb, LightbulbOff, Settings, Trash } from 'lucide-vue-next'

const props = defineProps<{
  deck: {
    id: string
    name: string
    active: boolean
    cardCount: number
  }
}>()

const emit = defineEmits<{
  (e: 'toggleActive', id: string): void
  (e: 'edit', id: string): void
  (e: 'delete', id: string): void
  (e: 'open', id: string): void
}>()
</script>

<template>
  <Card class="flex flex-col h-full cursor-pointer hover:shadow-lg transition-shadow duration-300 group" @click="$emit('open', deck.id)">
    <CardHeader class="flex flex-row items-start justify-between space-y-0 pb-2">
      <CardTitle class="text-lg font-normal truncate pr-4">
        {{ deck.name }}
      </CardTitle>
      <div class="flex items-center space-x-1" @click.stop>
        <Button variant="ghost" size="icon" @click="$emit('toggleActive', deck.id)" :class="deck.active ? 'text-yellow-500 hover:text-yellow-600' : 'text-gray-400 hover:text-gray-500'">
          <Lightbulb v-if="deck.active" class="w-4 h-4" />
          <LightbulbOff v-else class="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" @click="$emit('edit', deck.id)" class="text-gray-400 hover:text-blue-500">
          <Settings class="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" @click="$emit('delete', deck.id)" class="text-gray-400 hover:text-red-500">
          <Trash class="w-4 h-4" />
        </Button>
      </div>
    </CardHeader>
    <CardContent class="flex-1">
      <p class="text-sm text-muted-foreground">
        {{ deck.cardCount }} cards
      </p>
    </CardContent>
  </Card>
</template>
