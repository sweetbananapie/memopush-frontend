<script setup lang="ts">
import { ref, onMounted } from "vue";
import { ArrowDown, ArrowUp, ChevronLeft, GripVertical } from "lucide-vue-next";
import { useRouter } from "vue-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import cardFrequencyService, {
  FREQUENCY_UNITS,
  type Frequency,
  type FrequencyUnit,
} from "@/services/cardFrequencyService";

const router = useRouter();

const frequencies = ref<Frequency[]>([]);
const isAddModalOpen = ref(false);
const isEditModalOpen = ref(false);
const isDeleteConfirmOpen = ref(false);
const addError = ref("");
const editError = ref("");

const newFrequency = ref<Frequency>({
  value: 1,
  unit: "minutes",
});

const editingFrequency = ref<Frequency | null>(null);
const editingOriginalId = ref<string | null>(null);
const frequencyToDelete = ref<string | null>(null);
const draggedFrequencyId = ref<string | null>(null);

const loadFrequencies = () => {
  frequencies.value = cardFrequencyService.getFrequencies();
};

onMounted(loadFrequencies);

const getFrequencyId = (frequency: Frequency) =>
  cardFrequencyService.getFrequencyId(frequency);

const getFrequencyLabel = (frequency: Frequency) =>
  cardFrequencyService.getFrequencyLabel(frequency);

const moveFrequency = (draggedId: string, targetId: string) => {
  if (draggedId === targetId) return;

  const draggedIndex = frequencies.value.findIndex(
    (freq) => getFrequencyId(freq) === draggedId
  );
  const targetIndex = frequencies.value.findIndex(
    (freq) => getFrequencyId(freq) === targetId
  );

  if (draggedIndex === -1 || targetIndex === -1) return;

  const updated = [...frequencies.value];
  const [moved] = updated.splice(draggedIndex, 1);
  updated.splice(targetIndex, 0, moved);
  frequencies.value = updated;

  cardFrequencyService.reorderFrequencies(
    updated.map((freq) => getFrequencyId(freq))
  );
};

const handleDragStart = (frequency: Frequency) => {
  draggedFrequencyId.value = getFrequencyId(frequency);
};

const handleDrop = (targetFrequency: Frequency) => {
  if (!draggedFrequencyId.value) return;
  moveFrequency(draggedFrequencyId.value, getFrequencyId(targetFrequency));
  draggedFrequencyId.value = null;
};

const moveFrequencyByStep = (
  frequency: Frequency,
  direction: "up" | "down"
) => {
  const currentId = getFrequencyId(frequency);
  const currentIndex = frequencies.value.findIndex(
    (item) => getFrequencyId(item) === currentId
  );

  if (currentIndex === -1) return;

  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

  if (targetIndex < 0 || targetIndex >= frequencies.value.length) return;

  moveFrequency(currentId, getFrequencyId(frequencies.value[targetIndex]));
};

const handleAddFrequency = () => {
  addError.value = "";
  const result = cardFrequencyService.addFrequency(
    newFrequency.value.value,
    newFrequency.value.unit
  );

  if (!result.ok) {
    addError.value = "Такая частота уже есть";
    return;
  }

  loadFrequencies();
  isAddModalOpen.value = false;
  newFrequency.value = { value: 1, unit: "minutes" };
};

const handleEditFrequency = (freq: Frequency) => {
  editingFrequency.value = { ...freq };
  editingOriginalId.value = getFrequencyId(freq);
  editError.value = "";
  isEditModalOpen.value = true;
};

const handleSaveFrequency = () => {
  if (!editingFrequency.value || !editingOriginalId.value) return;
  editError.value = "";

  const result = cardFrequencyService.updateFrequency(
    editingOriginalId.value,
    editingFrequency.value.value,
    editingFrequency.value.unit
  );

  if (!result.ok) {
    editError.value =
      result.error === "duplicate"
        ? "Такая частота уже есть"
        : "Не удалось сохранить";
    return;
  }

  loadFrequencies();
  isEditModalOpen.value = false;
  editingFrequency.value = null;
  editingOriginalId.value = null;
};

const handleDeleteClick = (id: string) => {
  frequencyToDelete.value = id;
  isDeleteConfirmOpen.value = true;
};

const confirmDelete = () => {
  if (frequencyToDelete.value) {
    cardFrequencyService.deleteFrequency(frequencyToDelete.value);
    loadFrequencies();
  }
  isDeleteConfirmOpen.value = false;
  frequencyToDelete.value = null;
};

const handleResetDefaults = () => {
  cardFrequencyService.resetToDefaults();
  loadFrequencies();
};

const goBack = () => {
  router.back();
};

const getUnitLabel = (unit: FrequencyUnit): string => {
  const labels: Record<FrequencyUnit, string> = {
    minutes: "minutes",
    hours: "hours",
    days: "days",
    weeks: "weeks",
    months: "months",
    years: "years",
  };
  return labels[unit];
};
</script>

<template>
  <div class="container mx-auto px-4 max-w-4xl pb-24">
    <!-- Header -->
    <div
      class="sticky top-0 z-20 -mx-4 px-4 mb-6 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80"
    >
      <div class="flex items-center space-x-4 py-4">
        <Button variant="ghost" size="icon" @click="goBack">
          <ChevronLeft class="w-6 h-6" />
        </Button>
        <h1 class="text-3xl font-bold tracking-tight">Settings</h1>
      </div>
    </div>

    <!-- Frequencies Section -->
    <div class="bg-white rounded-lg border shadow-sm p-6">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-semibold">Card Review Frequencies</h2>
        <div class="space-x-2">
          <Button variant="outline" @click="handleResetDefaults">
            Reset to Defaults
          </Button>
          <Button @click="isAddModalOpen = true">Add Frequency</Button>
        </div>
      </div>

      <!-- Frequencies List -->
      <div class="space-y-3">
        <div
          v-for="freq in frequencies"
          :key="getFrequencyId(freq)"
          draggable="true"
          @dragstart="handleDragStart(freq)"
          @dragover.prevent
          @drop="handleDrop(freq)"
          class="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
        >
          <div class="flex items-center gap-3">
            <GripVertical
              class="hidden md:block w-4 h-4 text-gray-400 cursor-grab"
            />
            <div>
              <p class="font-medium">{{ getFrequencyLabel(freq) }}</p>
              <p class="text-sm text-gray-600">
                {{ freq.value }} {{ getUnitLabel(freq.unit) }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <div class="flex md:hidden items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                class="h-8 w-8"
                :disabled="
                  frequencies[0] &&
                  getFrequencyId(freq) === getFrequencyId(frequencies[0])
                "
                @click="moveFrequencyByStep(freq, 'up')"
              >
                <ArrowUp class="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                class="h-8 w-8"
                :disabled="
                  frequencies[frequencies.length - 1] &&
                  getFrequencyId(freq) ===
                    getFrequencyId(frequencies[frequencies.length - 1])
                "
                @click="moveFrequencyByStep(freq, 'down')"
              >
                <ArrowDown class="w-4 h-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              @click="handleEditFrequency(freq)"
            >
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              @click="handleDeleteClick(getFrequencyId(freq))"
            >
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Frequency Modal -->
    <Dialog v-model:open="isAddModalOpen">
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Frequency</DialogTitle>
          <DialogDescription>
            Create a custom review frequency for your cards.
          </DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-4">
          <div class="space-y-2">
            <Label>Frequency</Label>
            <div class="flex gap-2 items-center">
              <Input
                id="value"
                v-model.number="newFrequency.value"
                type="number"
                min="1"
              />
              <select
                v-model="newFrequency.unit"
                class="w-full px-3 py-2 border border-input rounded-md shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option
                  v-for="unit in FREQUENCY_UNITS"
                  :key="unit"
                  :value="unit"
                >
                  {{ getUnitLabel(unit) }}
                </option>
              </select>
            </div>
            <p v-if="addError" class="text-sm text-red-600">{{ addError }}</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="isAddModalOpen = false">
            Cancel
          </Button>
          <Button @click="handleAddFrequency">Add</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Edit Frequency Modal -->
    <Dialog v-model:open="isEditModalOpen">
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Frequency</DialogTitle>
          <DialogDescription>
            Update the frequency settings.
          </DialogDescription>
        </DialogHeader>
        <div v-if="editingFrequency" class="grid gap-4 py-4">
          <div class="space-y-2">
            <Label>Frequency</Label>
            <div class="flex gap-2 items-center">
              <Input
                id="edit-value"
                v-model.number="editingFrequency.value"
                type="number"
                min="1"
              />
              <select
                v-model="editingFrequency.unit"
                class="w-full px-3 py-2 border border-input rounded-md shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option
                  v-for="unit in FREQUENCY_UNITS"
                  :key="unit"
                  :value="unit"
                >
                  {{ getUnitLabel(unit) }}
                </option>
              </select>
            </div>
            <p v-if="editError" class="text-sm text-red-600">{{ editError }}</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="isEditModalOpen = false">
            Cancel
          </Button>
          <Button @click="handleSaveFrequency">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Delete Confirmation Modal -->
    <AlertDialog v-model:open="isDeleteConfirmOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this frequency?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the
            frequency.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="isDeleteConfirmOpen = false">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            class="bg-red-600 hover:bg-red-700 text-white"
            @click="confirmDelete"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
