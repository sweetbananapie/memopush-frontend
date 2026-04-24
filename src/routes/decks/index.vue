<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import DeckCard from "@/components/DeckCard.vue";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

const router = useRouter();

// Mock data
const decks = ref([
  { id: "1", name: "English Vocabulary (B2)", active: true, cardCount: 150 },
  { id: "2", name: "Spanish Verbs", active: false, cardCount: 45 },
  { id: "3", name: "Programming Concepts", active: true, cardCount: 82 },
]);

// Edit Modal State
const isEditModalOpen = ref(false);
const editingDeck = ref<{ id: string; name: string } | null>(null);

// Delete Confirm State
const isDeleteConfirmOpen = ref(false);
const deckToDelete = ref<string | null>(null);

const handleOpenDeck = (id: string) => {
  router.push(`/decks/${id}`);
};

const handleToggleActive = (id: string) => {
  const deck = decks.value.find((d) => d.id === id);
  if (deck) {
    deck.active = !deck.active;
  }
};

const handleEditClick = (id: string) => {
  const deck = decks.value.find((d) => d.id === id);
  if (deck) {
    editingDeck.value = { ...deck };
    isEditModalOpen.value = true;
  }
};

const saveDeck = () => {
  if (editingDeck.value) {
    const index = decks.value.findIndex((d) => d.id === editingDeck.value!.id);
    if (index !== -1) {
      decks.value[index].name = editingDeck.value.name;
    }
  }
  isEditModalOpen.value = false;
};

const handleDeleteClick = (id: string) => {
  deckToDelete.value = id;
  isDeleteConfirmOpen.value = true;
};

const confirmDelete = () => {
  if (deckToDelete.value) {
    decks.value = decks.value.filter((d) => d.id !== deckToDelete.value);
  }
  isDeleteConfirmOpen.value = false;
  deckToDelete.value = null;
};

const handleCreateDeck = () => {
  editingDeck.value = { id: Date.now().toString(), name: "New Deck" };
  isEditModalOpen.value = true;
};
</script>

<template>
  <div class="container mx-auto py-8 px-4 max-w-5xl">
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-3xl font-bold tracking-tight">My Decks</h1>
      <Button @click="handleCreateDeck">Create Deck</Button>
    </div>

    <!-- Grid Layout: Cards take half screen on md/lg displays -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <DeckCard
        v-for="deck in decks"
        :key="deck.id"
        :deck="deck"
        @open="handleOpenDeck"
        @toggle-active="handleToggleActive"
        @edit="handleEditClick"
        @delete="handleDeleteClick"
      />
    </div>

    <!-- Edit/Settings Modal -->
    <Dialog v-model:open="isEditModalOpen">
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{{
            editingDeck?.id ? "Edit Deck" : "Create Deck"
          }}</DialogTitle>
          <DialogDescription>
            Make changes to your deck here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-4">
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="name" class="text-right"> Name </Label>
            <Input id="name" v-model="editingDeck!.name" class="col-span-3" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="isEditModalOpen = false"
            >Cancel</Button
          >
          <Button type="submit" @click="saveDeck">Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Delete Confirmation Modal -->
    <AlertDialog v-model:open="isDeleteConfirmOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your deck
            and remove your data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="isDeleteConfirmOpen = false"
            >Cancel</AlertDialogCancel
          >
          <AlertDialogAction
            class="bg-red-600 hover:bg-red-700 text-white"
            @click="confirmDelete"
            >Continue</AlertDialogAction
          >
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
