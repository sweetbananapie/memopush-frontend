<script setup lang="ts">
import { ref, onMounted } from "vue";
import { ChevronLeft } from "lucide-vue-next";
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
  type Frequency,
} from "@/services/cardFrequencyService";

const router = useRouter();

const frequencies = ref<Frequency[]>([]);
const isAddModalOpen = ref(false);
const isEditModalOpen = ref(false);
const isDeleteConfirmOpen = ref(false);

const newFrequency = ref({
  label: "",
  minutes: 1,
});

const editingFrequency = ref<Frequency | null>(null);
const frequencyToDelete = ref<string | null>(null);

onMounted(() => {
  frequencies.value = cardFrequencyService.getFrequencies();
});

const handleAddFrequency = () => {
  if (newFrequency.value.label.trim() && newFrequency.value.minutes > 0) {
    cardFrequencyService.addFrequency(
      newFrequency.value.label,
      newFrequency.value.minutes,
    );
    frequencies.value = cardFrequencyService.getFrequencies();
    isAddModalOpen.value = false;
    newFrequency.value = { label: "", minutes: 1 };
  }
};

const handleEditFrequency = (freq: Frequency) => {
  editingFrequency.value = { ...freq };
  isEditModalOpen.value = true;
};

const handleSaveFrequency = () => {
  if (
    editingFrequency.value &&
    editingFrequency.value.label.trim() &&
    editingFrequency.value.minutes > 0
  ) {
    cardFrequencyService.updateFrequency(
      editingFrequency.value.value,
      editingFrequency.value.label,
      editingFrequency.value.minutes,
    );
    frequencies.value = cardFrequencyService.getFrequencies();
    isEditModalOpen.value = false;
    editingFrequency.value = null;
  }
};

const handleDeleteClick = (value: string) => {
  frequencyToDelete.value = value;
  isDeleteConfirmOpen.value = true;
};

const confirmDelete = () => {
  if (frequencyToDelete.value) {
    cardFrequencyService.deleteFrequency(frequencyToDelete.value);
    frequencies.value = cardFrequencyService.getFrequencies();
  }
  isDeleteConfirmOpen.value = false;
  frequencyToDelete.value = null;
};

const handleResetDefaults = () => {
  cardFrequencyService.resetToDefaults();
  frequencies.value = cardFrequencyService.getFrequencies();
};

const goBack = () => {
  router.push("/decks");
};

const isDefaultFrequency = (value: string): boolean => {
  return ["1_min", "1_day", "7_days", "30_days"].includes(value);
};
</script>

<template>
  <div class="container mx-auto py-8 px-4 max-w-4xl">
    <!-- Header -->
    <div class="flex items-center space-x-4 mb-8">
      <Button variant="ghost" size="icon" @click="goBack">
        <ChevronLeft class="w-6 h-6" />
      </Button>
      <h1 class="text-3xl font-bold tracking-tight">Settings</h1>
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
          :key="freq.value"
          class="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
        >
          <div>
            <p class="font-medium">{{ freq.label }}</p>
            <p class="text-sm text-gray-600">{{ freq.minutes }} minutes</p>
          </div>
          <div class="space-x-2">
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
              :disabled="isDefaultFrequency(freq.value)"
              @click="handleDeleteClick(freq.value)"
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
            <Label for="label">Label</Label>
            <Input
              id="label"
              v-model="newFrequency.label"
              placeholder="e.g., 2 weeks"
            />
          </div>
          <div class="space-y-2">
            <Label for="minutes">Minutes</Label>
            <Input
              id="minutes"
              v-model.number="newFrequency.minutes"
              type="number"
              min="1"
            />
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
            <Label for="edit-label">Label</Label>
            <Input
              id="edit-label"
              v-model="editingFrequency.label"
              :disabled="isDefaultFrequency(editingFrequency.value)"
            />
          </div>
          <div class="space-y-2">
            <Label for="edit-minutes">Minutes</Label>
            <Input
              id="edit-minutes"
              v-model.number="editingFrequency.minutes"
              type="number"
              min="1"
              :disabled="isDefaultFrequency(editingFrequency.value)"
            />
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
