<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import DeckCard from "@/components/DeckCard.vue";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import deckService, { type Deck } from "@/services/deckService";

const router = useRouter();

const decks = ref<Deck[]>([]);
const loading = ref(true);

// Create Modal State
const isCreateModalOpen = ref(false);
const createForm = ref({ name: "" });

// Update Modal State
const isUpdateModalOpen = ref(false);
const updateForm = ref<{ id: string; name: string } | null>(null);

// Delete Confirm State
const isDeleteConfirmOpen = ref(false);
const deckToDelete = ref<string | null>(null);

// Loading states
const isCreating = ref(false);
const isUpdating = ref(false);

onMounted(async () => {
  await loadDecks();
});

const loadDecks = async () => {
  try {
    const allDecks = await deckService.getAllDecks();
    decks.value = allDecks;
  } catch (error) {
    console.error("Failed to load decks:", error);
  } finally {
    loading.value = false;
  }
};

// useCreateDeck - логика создания палубы
const useCreateDeck = () => {
  const openCreateModal = () => {
    createForm.value = { name: "" };
    isCreateModalOpen.value = true;
  };

  const handleCreate = async () => {
    if (!createForm.value.name.trim()) {
      return;
    }

    isCreating.value = true;
    try {
      await deckService.createDeck(createForm.value.name);
      await loadDecks();
      isCreateModalOpen.value = false;
      createForm.value = { name: "" };
    } catch (error) {
      console.error("Failed to create deck:", error);
    } finally {
      isCreating.value = false;
    }
  };

  const handleCreateCancel = () => {
    isCreateModalOpen.value = false;
    createForm.value = { name: "" };
  };

  return { openCreateModal, handleCreate, handleCreateCancel };
};

// useUpdateDeck - логика обновления палубы
const useUpdateDeck = () => {
  const openUpdateModal = (id: string) => {
    const deck = decks.value.find((d) => d.id === id);
    if (deck) {
      updateForm.value = { id: deck.id, name: deck.name };
      isUpdateModalOpen.value = true;
    }
  };

  const handleUpdate = async () => {
    if (!updateForm.value || !updateForm.value.name.trim()) {
      return;
    }

    isUpdating.value = true;
    try {
      await deckService.updateDeck(updateForm.value.id, {
        name: updateForm.value.name,
      });
      await loadDecks();
      isUpdateModalOpen.value = false;
      updateForm.value = null;
    } catch (error) {
      console.error("Failed to update deck:", error);
    } finally {
      isUpdating.value = false;
    }
  };

  const handleUpdateCancel = () => {
    isUpdateModalOpen.value = false;
    updateForm.value = null;
  };

  return { openUpdateModal, handleUpdate, handleUpdateCancel };
};

const { openCreateModal, handleCreate, handleCreateCancel } = useCreateDeck();
const { openUpdateModal, handleUpdate, handleUpdateCancel } = useUpdateDeck();

const handleOpenDeck = (id: string) => {
  router.push(`/decks/${id}`);
};

const handleToggleActive = async (id: string) => {
  const deck = decks.value.find((d) => d.id === id);
  if (deck) {
    await deckService.updateDeck(id, { active: !deck.active });
    await loadDecks();
  }
};

const handleDeleteClick = (id: string) => {
  deckToDelete.value = id;
  isDeleteConfirmOpen.value = true;
};

const confirmDelete = async () => {
  if (deckToDelete.value) {
    try {
      await deckService.deleteDeck(deckToDelete.value);
      await loadDecks();
    } catch (error) {
      console.error("Failed to delete deck:", error);
    }
  }
  isDeleteConfirmOpen.value = false;
  deckToDelete.value = null;
};

const handleStart = async () => {
  try {
    const sw = await navigator.serviceWorker.ready;
    await sw.active?.postMessage("message");
  } catch (error) {
    console.error("Failed to start session:", error);
  }
};

const goToSettings = () => {
  router.push("/settings");
};
</script>

<template>
  <div class="container mx-auto py-8 px-4 max-w-5xl">
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-3xl font-bold tracking-tight">My Decks</h1>
      <div class="space-x-4">
        <Button variant="secondary" @click="goToSettings">Settings</Button>
        <Button variant="secondary" @click="handleStart()"
          >Start Session</Button
        >
        <Button @click="openCreateModal">Create Deck</Button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-8">
      <p>Loading decks...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="decks.length === 0" class="text-center py-12">
      <p class="text-gray-600 mb-4">No decks yet. Create one to get started!</p>
      <Button @click="openCreateModal">Create Your First Deck</Button>
    </div>

    <!-- Grid Layout -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <DeckCard
        v-for="deck in decks"
        :key="deck.id"
        :deck="{
          id: deck.id,
          name: deck.name,
          active: deck.active,
          cardCount: deck.cards.length,
        }"
        @open="handleOpenDeck"
        @toggle-active="handleToggleActive"
        @edit="openUpdateModal"
        @delete="handleDeleteClick"
      />
    </div>

    <!-- Create Deck Modal -->
    <Dialog v-model:open="isCreateModalOpen">
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Deck</DialogTitle>
          <DialogDescription>
            Give your deck a name to get started learning.
          </DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-4">
          <div class="space-y-2">
            <Label for="create-name">Deck Name</Label>
            <Input
              id="create-name"
              v-model="createForm.name"
              placeholder="e.g., English Vocabulary"
              @keyup.enter="handleCreate"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="handleCreateCancel">Cancel</Button>
          <Button
            @click="handleCreate"
            :disabled="isCreating || !createForm.name.trim()"
          >
            {{ isCreating ? "Creating..." : "Create" }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Update Deck Modal -->
    <Dialog v-model:open="isUpdateModalOpen">
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Deck</DialogTitle>
          <DialogDescription>Update your deck name.</DialogDescription>
        </DialogHeader>
        <div v-if="updateForm" class="grid gap-4 py-4">
          <div class="space-y-2">
            <Label for="update-name">Deck Name</Label>
            <Input
              id="update-name"
              v-model="updateForm.name"
              @keyup.enter="handleUpdate"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="handleUpdateCancel">Cancel</Button>
          <Button
            @click="handleUpdate"
            :disabled="isUpdating || !updateForm?.name.trim()"
          >
            {{ isUpdating ? "Saving..." : "Save changes" }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Delete Confirmation Modal -->
    <AlertDialog v-model:open="isDeleteConfirmOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete deck?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your deck
            and all its cards.
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
