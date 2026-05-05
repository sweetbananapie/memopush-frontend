<script setup lang="ts">
import { computed, ref } from "vue";
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  ArrowLeftRight,
  Lightbulb,
  LightbulbOff,
  Trash,
  Pencil,
  RotateCcw,
} from "lucide-vue-next";
import dayjs from "@/plugins/dayjs";
import { onClickOutside } from "@vueuse/core";
import cardFrequencyService from "@/services/cardFrequencyService";

const frequencies = computed(() => cardFrequencyService.getFrequencies());

const props = defineProps<{
  card: {
    id: string;
    side1Word: string;
    side1Example: string;
    side2Word: string;
    side2Example: string;
    timeoutUntil: number;
    active: boolean;
    frequency?: string;
  };
}>();

const emit = defineEmits<{
  (e: "delete", id: string): void;
  (e: "toggle-active", id: string): void;
  (e: "reverse", id: string): void;
  (e: "update", id: string, data: any): void;
  (e: "full-edit", id: string, field?: string): void;
}>();

const formatDate = (timestamp: number) => {
  if (!timestamp) return "-";
  return dayjs(timestamp).format("YYYY.DD.MM HH:mm");
};

const frequencyLabel = computed(() => {
  if (!props.card.frequency) return "-";
  return cardFrequencyService.getFrequencyLabelById(props.card.frequency);
});

const isFrequencyOpen = ref(false);
const frequencyPopoverRef = ref<HTMLElement | null>(null);

onClickOutside(frequencyPopoverRef, () => {
  isFrequencyOpen.value = false;
});

const toggleFrequency = () => {
  isFrequencyOpen.value = !isFrequencyOpen.value;
};

const selectFrequency = (value: string) => {
  isFrequencyOpen.value = false;
  emit("update", props.card.id, { frequency: value });
};

const resetTimeout = () => {
  emit("update", props.card.id, { timeoutUntil: Date.now() });
};
</script>

<template>
  <TableRow :class="['transition-colors hover:bg-gray-50 group']">
    <!-- Side 1 -->
    <TableCell
      :class="[!card.active ? 'opacity-50 grayscale-20' : '']"
      class="max-w-[35vw]"
    >
      <div>
        <div
          class="font-medium text-sm sm:text-base cursor-pointer hover:text-blue-600 transition-colors truncate"
          @click="emit('full-edit', card.id, 'side1Word')"
          :title="card.side1Word"
        >
          {{ card.side1Word || " " }}
        </div>
        <div
          v-if="card.side1Example"
          class="text-xs sm:text-sm text-muted-foreground mt-1 italic cursor-pointer hover:text-blue-600 transition-colors truncate"
          @click="emit('full-edit', card.id, 'side1Example')"
          :title="card.side1Example"
        >
          {{ card.side1Example || " " }}
        </div>
      </div>
    </TableCell>

    <!-- Side 2 -->
    <TableCell
      :class="[!card.active ? 'opacity-50 grayscale-20' : '']"
      class="max-w-[35vw]"
    >
      <div>
        <div
          class="font-medium text-sm sm:text-base cursor-pointer hover:text-blue-600 transition-colors truncate"
          @click="emit('full-edit', card.id, 'side2Word')"
          :title="card.side2Word"
        >
          {{ card.side2Word || " " }}
        </div>
        <div
          v-if="card.side2Example"
          class="text-xs sm:text-sm text-muted-foreground mt-1 italic cursor-pointer hover:text-blue-600 transition-colors truncate"
          @click="emit('full-edit', card.id, 'side2Example')"
          :title="card.side2Example"
        >
          {{ card.side2Example || " " }}
        </div>
      </div>
    </TableCell>

    <!-- Frequency Column -->
    <TableCell class="text-sm align-top pt-4">
      <div ref="frequencyPopoverRef" class="relative">
        <div
          :class="[!card.active ? 'opacity-50 grayscale-20' : '']"
          class="text-gray-600 cursor-pointer hover:text-blue-600 transition-colors inline-block truncate max-w-full"
          @click.stop="toggleFrequency"
          :title="frequencyLabel"
        >
          {{ frequencyLabel }}
        </div>
        <div
          v-if="isFrequencyOpen"
          class="absolute z-50 mt-1 w-40 bg-white border rounded-md shadow-lg"
        >
          <div
            v-for="freq in frequencies"
            :key="cardFrequencyService.getFrequencyId(freq)"
            class="px-3 py-2 cursor-pointer hover:bg-gray-100"
            :class="
              cardFrequencyService.getFrequencyId(freq) === card.frequency
                ? 'bg-blue-50'
                : ''
            "
            @click="selectFrequency(cardFrequencyService.getFrequencyId(freq))"
          >
            {{ cardFrequencyService.getFrequencyLabel(freq) }}
          </div>
        </div>
        <div
          class="mt-2 text-xs flex items-center relative"
          :class="[!card.active ? 'opacity-50 grayscale-20' : '']"
        >
          <Button
            variant="ghost"
            size="icon"
            class="h-4 w-4 text-gray-400 hover:text-blue-500"
            title="Reset timeout to now"
            @click.stop="resetTimeout"
          >
            <RotateCcw class="w-3 h-3" />
          </Button>
          <span
            :class="[
              'absolute left-6 top-0 w-0 overflow-visible',
              card.timeoutUntil > Date.now()
                ? 'text-gray-400'
                : 'text-gray-600 font-medium',
            ]"
          >
            {{ formatDate(card.timeoutUntil) }}
          </span>
        </div>
      </div>
    </TableCell>

    <!-- Actions -->
    <TableCell class="text-right align-top pt-3">
      <div class="flex items-center justify-end space-x-1">
        <Button
          variant="ghost"
          @click="emit('full-edit', card.id)"
          class="text-blue-500 hover:text-blue-600 w-0"
          title="Open full edit"
        >
          <Pencil class="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          @click="emit('toggle-active', card.id)"
          :class="
            card.active
              ? 'text-yellow-500 hover:text-yellow-600 w-0'
              : 'text-gray-400 w-0'
          "
        >
          <Lightbulb v-if="card.active" class="w-4 h-4" />
          <LightbulbOff v-else class="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          @click="emit('delete', card.id)"
          class="text-red-500 hover:text-red-600 w-0"
        >
          <Trash class="w-4 h-4" />
        </Button>
      </div>
    </TableCell>
  </TableRow>
</template>
