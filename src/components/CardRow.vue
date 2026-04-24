<script setup lang="ts">
import { ref, watch, nextTick, computed } from "vue";
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeftRight,
  Lightbulb,
  LightbulbOff,
  Trash,
  Check,
  X,
  Pencil,
} from "lucide-vue-next";
import dayjs from "@/plugins/dayjs";
import { onClickOutside } from "@vueuse/core";
import { getFrequencies } from "@/frequencies";

const frequencies = getFrequencies();

const props = defineProps<{
  card: {
    id: string;
    side1Word: string;
    side1Example: string;
    side2Word: string;
    side2Example: string;
    lastShown: number;
    dueDate: number;
    active: boolean;
    frequency?: string; // New field
  };
  isEditing: boolean;
}>();

const emit = defineEmits<{
  (e: "update", id: string, data: any): void;
  (e: "delete", id: string): void;
  (e: "toggle-active", id: string): void;
  (e: "reverse", id: string): void;
  (e: "edit-start", id: string, field?: string): void;
  (e: "edit-cancel", id: string): void;
}>();

const editForm = ref({ ...props.card });
const rowRef = ref<HTMLElement | null>(null);

// Validation state
const errors = ref({
  side1Word: false,
  side2Word: false,
});

// Refs for inputs to manage focus
const inputRefs = ref<Record<string, any>>({});

const setInputRef = (el: any, name: string) => {
  if (el) {
    inputRefs.value[name] = el;
  }
};

const resizeTextarea = (e: Event) => {
  const el = e.target as HTMLTextAreaElement;
  el.style.height = "auto";
  el.style.height = el.scrollHeight + "px";
};

// Auto-resize on mount if editing
const autoResizeAll = () => {
  nextTick(() => {
    ["side1Example", "side2Example"].forEach((name) => {
      const el = inputRefs.value[name] as HTMLTextAreaElement;
      if (el) {
        el.style.height = "auto";
        el.style.height = el.scrollHeight + "px";
      }
    });
  });
};

watch(
  () => props.isEditing,
  async (newVal) => {
    if (newVal) {
      editForm.value = { ...props.card };
      if (!editForm.value.frequency) editForm.value.frequency = "1_day";
      errors.value = { side1Word: false, side2Word: false };
      autoResizeAll();
    }
  },
);

const startEdit = (fieldToFocus?: string) => {
  if (props.isEditing) {
    // If already editing, just focus the field if needed
    if (fieldToFocus) {
      focusField(fieldToFocus);
    }
    return;
  }
  emit("edit-start", props.card.id, fieldToFocus);
};

// Exposed focus method for parent
const focusField = async (fieldToFocus: string) => {
  await nextTick();
  const inputEl = inputRefs.value[fieldToFocus];
  if (inputEl && inputEl.$el) {
    inputEl.$el.focus();
  } else if (inputEl) {
    inputEl.focus();
  }
};
defineExpose({ focusField });

const validate = () => {
  let isValid = true;
  errors.value = { side1Word: false, side2Word: false };

  if (!editForm.value.side1Word.trim()) {
    errors.value.side1Word = true;
    isValid = false;
  }
  if (!editForm.value.side2Word.trim()) {
    errors.value.side2Word = true;
    isValid = false;
  }
  return isValid;
};

const saveEdit = () => {
  if (!props.isEditing) return;

  if (validate()) {
    emit("update", props.card.id, { ...editForm.value });
  } else {
    // Scroll to the first error
    const firstErrorField = errors.value.side1Word ? "side1Word" : "side2Word";
    const errorEl = inputRefs.value[firstErrorField];
    if (errorEl) {
      const el = errorEl.$el || errorEl;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.focus();
    }
  }
};

const cancelEdit = () => {
  errors.value = { side1Word: false, side2Word: false };
  emit("edit-cancel", props.card.id);
};

// Click outside handling
onClickOutside(
  rowRef,
  () => {
    if (props.isEditing) {
      saveEdit();
    }
  },
  { ignore: [".modal-content", ".alert-dialog-content"] },
); // don't trigger if clicking on modals

const formatDate = (timestamp: number) => {
  if (!timestamp) return "-";
  return dayjs(timestamp).format("DD MMM YYYY, HH:mm");
};

const frequencyLabel = computed(() => {
  const freq = frequencies.find((f) => f.value === props.card.frequency);
  return freq ? freq.label : "-";
});

// Common input styles for textareas
const textareaStyles =
  "flex min-h-[32px] w-[140px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 overflow-hidden resize-none";
</script>

<template>
  <TableRow
    ref="rowRef"
    :class="[
      'transition-colors hover:bg-gray-50 group',
      !card.active ? 'opacity-50 grayscale-[20%]' : '',
      isEditing ? 'bg-blue-50/50' : '',
    ]"
  >
    <!-- Side 1 -->
    <TableCell>
      <div v-if="!isEditing">
        <div
          class="font-medium text-base cursor-pointer hover:text-blue-600 transition-colors"
          @click="startEdit('side1Word')"
        >
          {{ card.side1Word || " " }}
        </div>
        <div
          class="text-sm text-muted-foreground mt-1 italic cursor-pointer hover:text-blue-600 transition-colors w-[140px] whitespace-pre-wrap break-words"
          @click="startEdit('side1Example')"
          title="Click to edit"
        >
          {{ card.side1Example || " " }}
        </div>
      </div>
      <div v-else class="flex flex-col gap-2 mt-1">
        <Input
          :ref="(el) => setInputRef(el, 'side1Word')"
          v-model="editForm.side1Word"
          placeholder="Word"
          :class="[
            'h-8',
            errors.side1Word ? 'border-red-500 ring-1 ring-red-500' : '',
          ]"
        />
        <textarea
          :ref="(el) => setInputRef(el, 'side1Example')"
          v-model="editForm.side1Example"
          placeholder="Example"
          :class="textareaStyles"
          @input="resizeTextarea"
          rows="1"
        ></textarea>
      </div>
    </TableCell>

    <!-- Reverse Action -->
    <TableCell class="text-center px-0 align-top pt-4">
      <Button
        variant="ghost"
        size="icon"
        @click="emit('reverse', card.id)"
        class="text-gray-400 hover:text-blue-500 rounded-full"
        title="Reverse Sides"
        :disabled="isEditing"
      >
        <ArrowLeftRight class="w-4 h-4" />
      </Button>
    </TableCell>

    <!-- Side 2 -->
    <TableCell>
      <div v-if="!isEditing">
        <div
          class="font-medium text-base cursor-pointer hover:text-blue-600 transition-colors"
          @click="startEdit('side2Word')"
        >
          {{ card.side2Word || " " }}
        </div>
        <div
          class="text-sm text-muted-foreground mt-1 italic cursor-pointer hover:text-blue-600 transition-colors w-[140px] whitespace-pre-wrap break-words"
          @click="startEdit('side2Example')"
          title="Click to edit"
        >
          {{ card.side2Example || " " }}
        </div>
      </div>
      <div v-else class="flex flex-col gap-2 mt-1">
        <Input
          :ref="(el) => setInputRef(el, 'side2Word')"
          v-model="editForm.side2Word"
          placeholder="Word"
          :class="[
            'h-8',
            errors.side2Word ? 'border-red-500 ring-1 ring-red-500' : '',
          ]"
        />
        <textarea
          :ref="(el) => setInputRef(el, 'side2Example')"
          v-model="editForm.side2Example"
          placeholder="Example"
          :class="textareaStyles"
          @input="resizeTextarea"
          rows="1"
        ></textarea>
      </div>
    </TableCell>

    <!-- Frequency Column -->
    <TableCell class="text-sm align-top pt-4 w-[120px]">
      <div
        v-if="!isEditing"
        class="text-gray-600 cursor-pointer"
        @click="startEdit('frequency')"
      >
        {{ frequencyLabel }}
      </div>
      <select
        v-else
        :ref="(el) => setInputRef(el, 'frequency')"
        v-model="editForm.frequency"
        class="flex h-8 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option
          v-for="freq in frequencies"
          :key="freq.value"
          :value="freq.value"
        >
          {{ freq.label }}
        </option>
      </select>
    </TableCell>

    <!-- Last Shown -->
    <TableCell class="text-sm text-gray-500 align-top pt-4">
      {{ formatDate(card.lastShown) }}
    </TableCell>

    <!-- Due Date -->
    <TableCell class="text-sm align-top pt-4">
      <span
        :class="
          card.dueDate < Date.now()
            ? 'text-red-500 font-medium'
            : 'text-gray-500'
        "
      >
        {{ formatDate(card.dueDate) }}
      </span>
    </TableCell>

    <!-- Actions -->
    <TableCell class="text-right align-top pt-3">
      <div class="flex items-center justify-end space-x-1" v-if="!isEditing">
        <Button
          variant="ghost"
          size="icon"
          @click="emit('toggle-active', card.id)"
          :class="
            card.active
              ? 'text-yellow-500 hover:text-yellow-600'
              : 'text-gray-400'
          "
        >
          <Lightbulb v-if="card.active" class="w-4 h-4" />
          <LightbulbOff v-else class="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          @click="emit('delete', card.id)"
          class="text-red-500 hover:text-red-600"
        >
          <Trash class="w-4 h-4" />
        </Button>
      </div>
      <div class="flex items-center justify-end space-x-1" v-else>
        <Button
          variant="ghost"
          size="icon"
          @click="saveEdit"
          class="text-green-600 hover:text-green-700 hover:bg-green-50"
          title="Save"
        >
          <Check class="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          @click="cancelEdit"
          class="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          title="Cancel"
        >
          <X class="w-4 h-4" />
        </Button>
      </div>
    </TableCell>
  </TableRow>
</template>
