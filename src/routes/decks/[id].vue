<script setup lang="ts">
import { ref, computed, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ChevronLeft } from "lucide-vue-next";
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
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import CardRow from "@/components/CardRow.vue";
import dayjs from "@/plugins/dayjs";

const route = useRoute();
const router = useRouter();

// Mock deck title
const deckName = ref("English Vocabulary (B2)");

// Mock data for cards
const cards = ref<any[]>([
  {
    id: "101",
    side1Word: "Serendipity",
    side1Example: "Finding that old book was pure serendipity.",
    side2Word: "Случайность",
    side2Example: "Найти ту старую книгу было чистой случайностью.",
    lastShown: Date.now() - 86400000,
    dueDate: Date.now() + 86400000,
    active: true,
    frequency: '1_day'
  },
  {
    id: "102",
    side1Word: "Ephemeral",
    side1Example: "Fame in the modern world is often ephemeral.",
    side2Word: "Мимолетный",
    side2Example: "Слава в современном мире часто бывает мимолетной.",
    lastShown: Date.now() - 172800000,
    dueDate: Date.now() - 3600000,
    active: false,
    frequency: '7_days'
  },
  {
    id: "103",
    side1Word: "Eloquent",
    side1Example: "She gave an eloquent speech.",
    side2Word: "Красноречивый",
    side2Example: "Она произнесла красноречивую речь.",
    lastShown: Date.now() - 5000000,
    dueDate: Date.now() + 172800000,
    active: true,
    frequency: '3_days'
  },
]);

// Single Row Editing State
const editingCardId = ref<string | null>(null);

const rowRefs = ref<Record<string, any>>({});
const setRowRef = (el: any, id: string) => {
  if (el) rowRefs.value[id] = el;
};

const handleEditStart = async (id: string, fieldToFocus?: string) => {
  editingCardId.value = id;
  if (fieldToFocus) {
    await nextTick();
    const row = rowRefs.value[id];
    if (row && row.focusField) {
      row.focusField(fieldToFocus);
    }
  }
};

const handleEditCancel = (id: string) => {
  if (editingCardId.value === id) {
    editingCardId.value = null;
  }
};

const handleUpdateCard = (id: string, data: any) => {
  const index = cards.value.findIndex((c) => c.id === id);
  if (index !== -1) {
    cards.value[index] = { ...data };
    editingCardId.value = null; // Exit edit mode
  }
};

const handleToggleActive = (id: string) => {
  const card = cards.value.find((c) => c.id === id);
  if (card) {
    card.active = !card.active;
  }
};

const handleReverse = (id: string) => {
  const card = cards.value.find((c) => c.id === id);
  if (card) {
    const tempWord = card.side1Word;
    const tempExample = card.side1Example;
    card.side1Word = card.side2Word;
    card.side1Example = card.side2Example;
    card.side2Word = tempWord;
    card.side2Example = tempExample;
  }
};

// Delete Confirm State
const isDeleteConfirmOpen = ref(false);
const cardToDelete = ref<string | null>(null);

const handleDeleteClick = (id: string) => {
  cardToDelete.value = id;
  isDeleteConfirmOpen.value = true;
};

const confirmDelete = () => {
  if (cardToDelete.value) {
    cards.value = cards.value.filter((c) => c.id !== cardToDelete.value);
  }
  isDeleteConfirmOpen.value = false;
  cardToDelete.value = null;
};

const goBack = () => {
  router.push("/decks");
};

// Import Modal State
const isImportModalOpen = ref(false);
const importText = ref("");

const parseImportedCards = (text: string) => {
  const cardsToCreate = [];
  let parenLevel = 0;
  let currentSegment = "";
  const parsedCards: string[] = [];

  // Split by newline outside of parentheses
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === "(") parenLevel++;
    if (char === ")") parenLevel = Math.max(0, parenLevel - 1);

    if (char === "\n" && parenLevel === 0) {
      if (currentSegment.trim()) {
        parsedCards.push(currentSegment.trim());
      }
      currentSegment = "";
    } else {
      currentSegment += char;
    }
  }
  if (currentSegment.trim()) {
    parsedCards.push(currentSegment.trim());
  }

  // Parse each card segment
  parsedCards.forEach((cardStr) => {
    let splitIdx = -1;
    let pLevel = 0;
    for (let i = 0; i < cardStr.length; i++) {
      if (cardStr[i] === "(") pLevel++;
      if (cardStr[i] === ")") pLevel = Math.max(0, pLevel - 1);
      if (cardStr[i] === "-" && pLevel === 0) {
        splitIdx = i;
        break; // First dash outside parentheses
      }
    }

    if (splitIdx === -1) return; // Invalid format

    const side1Raw = cardStr.slice(0, splitIdx).trim();
    const side2Raw = cardStr.slice(splitIdx + 1).trim();

    const extractWordAndExample = (raw: string) => {
      let word = raw;
      let example = "";
      const openIdx = raw.indexOf("(");
      const closeIdx = raw.lastIndexOf(")");
      if (openIdx !== -1 && closeIdx > openIdx) {
        word = raw.slice(0, openIdx).trim();
        example = raw.slice(openIdx + 1, closeIdx).trim();
      }
      return { word, example };
    };

    const s1 = extractWordAndExample(side1Raw);
    const s2 = extractWordAndExample(side2Raw);

    if (s1.word && s2.word) {
      cardsToCreate.push({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        side1Word: s1.word,
        side1Example: s1.example,
        side2Word: s2.word,
        side2Example: s2.example,
        lastShown: 0,
        dueDate: Date.now() + 86400000,
        active: true,
        frequency: "1_day",
      });
    }
  });

  return cardsToCreate;
};

const handleImport = () => {
  const newCards = parseImportedCards(importText.value);
  if (newCards.length > 0) {
    cards.value.push(...newCards);
  }
  isImportModalOpen.value = false;
  importText.value = "";
};

// Add single card modal
const isAddModalOpen = ref(false);
const newCardForm = ref({
  side1Word: "",
  side1Example: "",
  side2Word: "",
  side2Example: "",
});
const newCardErrors = ref({ side1Word: false, side2Word: false });

const handleOpenAddModal = () => {
  newCardForm.value = {
    side1Word: "",
    side1Example: "",
    side2Word: "",
    side2Example: "",
  };
  newCardErrors.value = { side1Word: false, side2Word: false };
  isAddModalOpen.value = true;
};

const handleAddCard = () => {
  newCardErrors.value = { side1Word: false, side2Word: false };
  let valid = true;

  if (!newCardForm.value.side1Word.trim()) {
    newCardErrors.value.side1Word = true;
    valid = false;
  }
  if (!newCardForm.value.side2Word.trim()) {
    newCardErrors.value.side2Word = true;
    valid = false;
  }

  if (valid) {
    cards.value.push({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      ...newCardForm.value,
      lastShown: 0,
      dueDate: Date.now() + 86400000,
      active: true,
      frequency: "1_day",
    });
    isAddModalOpen.value = false;
  }
};
</script>

<template>
  <div class="container mx-auto py-8 px-4 max-w-7xl">
    <!-- Header -->
    <div class="flex items-center space-x-4 mb-8">
      <Button variant="ghost" size="icon" @click="goBack">
        <ChevronLeft class="w-6 h-6" />
      </Button>
      <h1 class="text-xl font-medium tracking-tight flex-1">{{ deckName }}</h1>
      <div class="flex space-x-2">
        <Button variant="outline" @click="isImportModalOpen = true">Import Cards</Button>
        <Button @click="handleOpenAddModal">Add Card</Button>
      </div>
    </div>

    <!-- Cards Table -->
    <div class="rounded-md border bg-white overflow-hidden shadow-sm">
      <Table>
        <TableHeader class="bg-gray-50/50">
          <TableRow>
            <TableHead class="w-[30%]">Side 1</TableHead>
            <TableHead class="w-[50px] text-center"></TableHead>
            <TableHead class="w-[30%]">Side 2</TableHead>
            <TableHead class="w-[120px]">Frequency</TableHead>
            <TableHead class="">Last Shown</TableHead>
            <TableHead class="">Due Date</TableHead>
            <TableHead class="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <CardRow
            v-for="card in cards"
            :key="card.id"
            :ref="(el) => setRowRef(el, card.id)"
            :card="card"
            :is-editing="editingCardId === card.id"
            @edit-start="handleEditStart"
            @edit-cancel="handleEditCancel"
            @update="handleUpdateCard"
            @delete="handleDeleteClick"
            @toggle-active="handleToggleActive"
            @reverse="handleReverse"
          />
        </TableBody>
      </Table>
    </div>

    <!-- Import Modal -->
    <Dialog v-model:open="isImportModalOpen">
      <DialogContent class="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Import Cards</DialogTitle>
          <DialogDescription>
            Paste your cards here. Format: <code>Word 1 (Example 1) - Word 2 (Example 2)</code>. 
            <br>Examples are optional. Each card on a new line. Multiline examples within parentheses are supported.
          </DialogDescription>
        </DialogHeader>
        
        <div class="py-4">
          <textarea
            v-model="importText"
            class="flex min-h-[300px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Apple (A fruit) - Яблоко (Фрукт)&#10;Banana - Банан"
          ></textarea>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="isImportModalOpen = false">Cancel</Button>
          <Button @click="handleImport">Import</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Add Card Modal -->
    <Dialog v-model:open="isAddModalOpen">
      <DialogContent class="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Card</DialogTitle>
          <DialogDescription>
            Update the card details below. Click save when you're done.
          </DialogDescription>
        </DialogHeader>

        <div class="grid grid-cols-2 gap-6 py-4">
          <!-- Side 1 Form -->
          <div class="space-y-4">
            <h4 class="font-medium border-b pb-2">Side 1</h4>
            <div class="space-y-2">
              <Label for="side1Word">Word / Term *</Label>
              <Input
                id="side1Word"
                v-model="newCardForm.side1Word"
                :class="newCardErrors.side1Word ? 'border-red-500 ring-1 ring-red-500' : ''"
              />
            </div>
            <div class="space-y-2">
              <Label for="side1Example">Usage Example</Label>
              <textarea
                id="side1Example"
                v-model="newCardForm.side1Example"
                class="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              ></textarea>
            </div>
          </div>

          <!-- Side 2 Form -->
          <div class="space-y-4">
            <h4 class="font-medium border-b pb-2">Side 2</h4>
            <div class="space-y-2">
              <Label for="side2Word">Word / Term *</Label>
              <Input
                id="side2Word"
                v-model="newCardForm.side2Word"
                :class="newCardErrors.side2Word ? 'border-red-500 ring-1 ring-red-500' : ''"
              />
            </div>
            <div class="space-y-2">
              <Label for="side2Example">Usage Example</Label>
              <textarea
                id="side2Example"
                v-model="newCardForm.side2Example"
                class="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              ></textarea>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="isAddModalOpen = false">Cancel</Button>
          <Button type="submit" @click="handleAddCard">Add Card</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Delete Confirmation Modal -->
    <AlertDialog v-model:open="isDeleteConfirmOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this card?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the card
            from your deck.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="isDeleteConfirmOpen = false">Cancel</AlertDialogCancel>
          <AlertDialogAction
            class="bg-red-600 hover:bg-red-700 text-white"
            @click="confirmDelete"
          >
            Delete Card
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
