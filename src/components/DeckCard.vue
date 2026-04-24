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
      <CardTitle class="text-2xl font-bold truncate pr-4">
        {{ deck.name }}
      </CardTitle>
      <div class="flex items-center space-x-1" @click.stop>
        <Button variant="ghost" size="icon" @click="$emit('toggleActive', deck.id)" :class="deck.active ? 'text-yellow-500' : 'text-gray-400'">
          <Lightbulb v-if="deck.active" class="w-5 h-5" />
          <LightbulbOff v-else class="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" @click="$emit('edit', deck.id)" class="text-gray-500 hover:text-blue-500">
          <Settings class="w-5 h-5" />
        </Button>
      </div>
    </CardHeader>
    <CardContent class="flex-1">
      <p class="text-sm text-muted-foreground">
        {{ deck.cardCount }} cards
      </p>
    </CardContent>
    <CardFooter class="flex justify-end pt-4" @click.stop>
      <Button variant="destructive" size="sm" @click="$emit('delete', deck.id)" class="opacity-0 group-hover:opacity-100 transition-opacity">
        <Trash class="w-4 h-4 mr-2" />
        Delete
      </Button>
    </CardFooter>
  </Card>
</template>
