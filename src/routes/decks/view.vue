<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  ChevronLeft,
  MoreVertical,
  Plus,
  FilePlus,
  RotateCcw,
} from "lucide-vue-next";
import { onClickOutside } from "@vueuse/core";
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
import deckService, { type Card } from "@/services/deckService";
import cardFrequencyService from "@/services/cardFrequencyService";

const route = useRoute();
const router = useRouter();

const deckId = computed(() => (route.query as any).id as string);

// Deck State
const deckName = ref("");
const cards = ref<Card[]>([]);
const loading = ref(true);

const isFullEditModalOpen = ref(false);
const fullEditCardId = ref<string | null>(null);
const fullEditLastFocusField = ref<string | null>(null);
const fullEditForm = ref({
  side1Word: "",
  side1Example: "",
  side2Word: "",
  side2Example: "",
  timeoutUntil: Date.now(),
  frequency: cardFrequencyService.getFallbackFrequencyId(),
  active: true,
});
const fullEditErrors = ref({ side1Word: false, side2Word: false });

const fullEditSide1WordRef = ref<any>(null);
const fullEditSide1ExampleRef = ref<HTMLTextAreaElement | null>(null);
const fullEditSide2WordRef = ref<any>(null);
const fullEditSide2ExampleRef = ref<HTMLTextAreaElement | null>(null);
const fullEditFrequencyRef = ref<HTMLSelectElement | null>(null);
const fullEditTimeoutRef = ref<any>(null);
const fullEditActiveRef = ref<HTMLSelectElement | null>(null);

const focusFullEditField = async (field?: string) => {
  if (!field) return;
  await nextTick();

  const focusEl = (el: any) => {
    if (!el) return;
    const target = el?.$el ?? el;
    if (typeof target?.focus === "function") target.focus();
  };

  switch (field) {
    case "side1Word":
      focusEl(fullEditSide1WordRef.value);
      break;
    case "side1Example":
      focusEl(fullEditSide1ExampleRef.value);
      break;
    case "side2Word":
      focusEl(fullEditSide2WordRef.value);
      break;
    case "side2Example":
      focusEl(fullEditSide2ExampleRef.value);
      break;
    case "frequency":
      focusEl(fullEditFrequencyRef.value);
      break;
    case "timeoutUntil":
      focusEl(fullEditTimeoutRef.value);
      break;
    case "active":
      focusEl(fullEditActiveRef.value);
      break;
  }
};

const handleOpenFullEdit = async (id: string, field?: string) => {
  const card = cards.value.find((c) => c.id === id);
  if (!card) return;

  fullEditCardId.value = id;
  fullEditForm.value = {
    side1Word: card.side1Word || "",
    side1Example: card.side1Example || "",
    side2Word: card.side2Word || "",
    side2Example: card.side2Example || "",
    timeoutUntil: card.timeoutUntil || Date.now(),
    frequency: cardFrequencyService.resolveFrequency(card.frequency)
      ? card.frequency
      : cardFrequencyService.getFallbackFrequencyId(),
    active: card.active,
  };
  fullEditErrors.value = { side1Word: false, side2Word: false };
  fullEditLastFocusField.value = field || null;
  isFullEditModalOpen.value = true;

  await focusFullEditField(field);
};

const handleSaveFullEdit = async () => {
  fullEditErrors.value = { side1Word: false, side2Word: false };
  let valid = true;

  if (!fullEditForm.value.side1Word.trim()) {
    fullEditErrors.value.side1Word = true;
    valid = false;
  }
  if (!fullEditForm.value.side2Word.trim()) {
    fullEditErrors.value.side2Word = true;
    valid = false;
  }

  if (!valid || !fullEditCardId.value) return;

  const index = cards.value.findIndex((c) => c.id === fullEditCardId.value);
  if (index === -1) return;

  const updatedCard: Card = {
    id: fullEditCardId.value,
    side1Word: fullEditForm.value.side1Word,
    side1Example: fullEditForm.value.side1Example,
    side2Word: fullEditForm.value.side2Word,
    side2Example: fullEditForm.value.side2Example,
    timeoutUntil: fullEditForm.value.timeoutUntil,
    active: fullEditForm.value.active,
    frequency: fullEditForm.value.frequency,
  };

  try {
    await deckService.updateCard(
      deckId.value,
      fullEditCardId.value,
      updatedCard,
    );
    cards.value[index] = updatedCard;
    isFullEditModalOpen.value = false;
    fullEditCardId.value = null;
  } catch (error) {
    console.error("Failed to update card in full edit modal:", error);
  }
};

const handleToggleActive = async (id: string) => {
  const card = cards.value.find((c) => c.id === id);
  if (card) {
    try {
      await deckService.updateCard(deckId.value, id, {
        ...card,
        active: !card.active,
      });
      card.active = !card.active;
    } catch (error) {
      console.error("Failed to toggle card active status:", error);
    }
  }
};

const handlePatchCard = async (id: string, patch: Partial<Card>) => {
  const index = cards.value.findIndex((c) => c.id === id);
  if (index === -1) return;

  const current = cards.value[index];
  const updatedCard: Card = { ...current, ...patch };

  try {
    await deckService.updateCard(deckId.value, id, updatedCard);
    cards.value[index] = updatedCard;
  } catch (error) {
    console.error("Failed to patch card:", error);
  }
};

const handleReverse = async (id: string) => {
  const card = cards.value.find((c) => c.id === id);
  if (card) {
    try {
      const tempWord = card.side1Word;
      const tempExample = card.side1Example;
      card.side1Word = card.side2Word;
      card.side1Example = card.side2Example;
      card.side2Word = tempWord;
      card.side2Example = tempExample;
      await deckService.updateCard(deckId.value, id, card);
    } catch (error) {
      console.error("Failed to reverse card:", error);
    }
  }
};

// Delete Confirm State
const isDeleteConfirmOpen = ref(false);
const cardToDelete = ref<string | null>(null);

const handleDeleteClick = (id: string) => {
  cardToDelete.value = id;
  isDeleteConfirmOpen.value = true;
};

const confirmDelete = async () => {
  if (cardToDelete.value) {
    try {
      await deckService.deleteCard(deckId.value, cardToDelete.value);
      cards.value = cards.value.filter((c) => c.id !== cardToDelete.value);
    } catch (error) {
      console.error("Failed to delete card:", error);
    }
  }
  isDeleteConfirmOpen.value = false;
  cardToDelete.value = null;
};

const goBack = () => {
  router.back();
};

// Import Modal State
const isImportModalOpen = ref(false);
const importText = ref("");

const calculateTimeoutUntil = (frequency: string): number =>
  cardFrequencyService.calculateTimeoutUntil(frequency);

const parseImportedCards = (text: string): Card[] => {
  const cardsToCreate: Card[] = [];
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
        break;
      }
    }

    if (splitIdx === -1) return;

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
        timeoutUntil: Date.now(),
        active: true,
        frequency: cardFrequencyService.getFallbackFrequencyId(),
      });
    }
  });

  return cardsToCreate;
};

const handleImport = async () => {
  const newCards = parseImportedCards(importText.value);
  if (newCards.length > 0) {
    try {
      for (const card of newCards) {
        await deckService.createCard(deckId.value, {
          side1Word: card.side1Word,
          side1Example: card.side1Example,
          side2Word: card.side2Word,
          side2Example: card.side2Example,
          timeoutUntil: card.timeoutUntil,
          active: card.active,
          frequency: card.frequency,
        });
      }
      await loadCards();
    } catch (error) {
      console.error("Failed to import cards:", error);
    }
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
  frequency: cardFrequencyService.getFallbackFrequencyId(),
});
const newCardErrors = ref({ side1Word: false, side2Word: false });

const isActionsMenuOpen = ref(false);
const actionsMenuRef = ref<HTMLElement | null>(null);

onClickOutside(actionsMenuRef, () => {
  isActionsMenuOpen.value = false;
});

const toggleActionsMenu = () => {
  isActionsMenuOpen.value = !isActionsMenuOpen.value;
};

const handleOpenAddCardFromMenu = () => {
  handleOpenAddModal();
  isActionsMenuOpen.value = false;
};

const handleOpenImportFromMenu = () => {
  isImportModalOpen.value = true;
  isActionsMenuOpen.value = false;
};

const handleOpenAddModal = () => {
  newCardForm.value = {
    side1Word: "",
    side1Example: "",
    side2Word: "",
    side2Example: "",
    frequency: cardFrequencyService.getFallbackFrequencyId(),
  };
  newCardErrors.value = { side1Word: false, side2Word: false };
  isAddModalOpen.value = true;
};

const handleAddCard = async () => {
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
    try {
      const newCard = await deckService.createCard(deckId.value, {
        side1Word: newCardForm.value.side1Word,
        side1Example: newCardForm.value.side1Example,
        side2Word: newCardForm.value.side2Word,
        side2Example: newCardForm.value.side2Example,
        timeoutUntil: Date.now(),
        active: true,
        frequency: newCardForm.value.frequency,
      });
      cards.value.push(newCard);
      isAddModalOpen.value = false;
    } catch (error) {
      console.error("Failed to create card:", error);
    }
  }
};

// Load deck and cards
onMounted(async () => {
  await loadDeck();
});

const loadDeck = async () => {
  try {
    const deck = await deckService.getDeckById(deckId.value);
    if (deck) {
      deckName.value = deck.name;
      cards.value = deck.cards;
    } else {
      router.push({ name: "/decks" });
    }
  } catch (error) {
    console.error("Failed to load deck:", error);
    router.push({ name: "/decks" });
  } finally {
    loading.value = false;
  }
};

const loadCards = async () => {
  try {
    const deck = await deckService.getDeckById(deckId.value);
    if (deck) {
      cards.value = deck.cards;
    }
  } catch (error) {
    console.error("Failed to load cards:", error);
  }
};

const isResetAllConfirmOpen = ref(false);

const handleResetAllTimeouts = async () => {
  try {
    for (const card of cards.value) {
      await deckService.updateCard(deckId.value, card.id, {
        ...card,
        timeoutUntil: Date.now(),
      });
      card.timeoutUntil = Date.now();
    }
  } catch (error) {
    console.error("Failed to reset all timeouts:", error);
  } finally {
    isResetAllConfirmOpen.value = false;
  }
};
</script>

<template>
  <div class="container mx-auto px-4 max-w-7xl pb-24">
    <!-- Header -->
    <div
      class="sticky top-0 z-20 -mx-4 px-4 mb-6 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80"
    >
      <div class="flex items-center space-x-4 py-4">
        <Button variant="ghost" size="icon" @click="goBack">
          <ChevronLeft class="w-6 h-6" />
        </Button>
        <h1 class="text-xl font-medium tracking-tight flex-1">
          {{ deckName }}
        </h1>
        <div class="relative" ref="actionsMenuRef">
          <Button
            variant="ghost"
            size="icon"
            @click="toggleActionsMenu"
            aria-label="Deck actions"
          >
            <MoreVertical class="w-6 h-6" />
          </Button>
          <div
            v-if="isActionsMenuOpen"
            class="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border bg-white shadow-lg"
          >
            <button
              class="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 transition hover:bg-gray-100"
              @click="handleOpenAddCardFromMenu"
            >
              <Plus class="w-4 h-4" />
              Добавить карточку
            </button>
            <button
              class="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 transition hover:bg-gray-100"
              @click="handleOpenImportFromMenu"
            >
              <FilePlus class="w-4 h-4" />
              Добавить много
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-8">
      <p>Loading cards...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="cards.length === 0" class="text-center py-12">
      <p class="text-gray-600 mb-4">Карточки закончились или отсутствуют.</p>
    </div>

    <!-- Cards Table -->
    <div v-else class="rounded-md border bg-white shadow-sm overflow-x-auto">
      <Table class="w-auto">
        <TableHeader class="bg-gray-50/50">
          <TableRow>
            <TableHead class="">Сторона 1</TableHead>
            <TableHead class="">Сторона 2</TableHead>
            <TableHead class="">
              <div class="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="icon"
                  class="h-4 w-4 text-gray-400 hover:text-blue-500"
                  title="Reset all timeouts"
                  @click="isResetAllConfirmOpen = true"
                >
                  <RotateCcw class="w-3 h-3 mr-3" />
                </Button>
                <span>Частота показа</span>
              </div>
            </TableHead>
            <TableHead class="text-right">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <CardRow
            v-for="card in cards"
            :key="card.id"
            :card="card"
            @full-edit="handleOpenFullEdit"
            @update="handlePatchCard"
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
          <DialogTitle>Множественное добавление карточек</DialogTitle>
          <DialogDescription>
            Вставьте ваши карточки сюда. Формат:

            <code>Word 1 (Пример 1) - Word 2 (Пример 2)</code>. <br />Примеры
            необязательны. Каждая карточка на новой строке. Многострочные
            примеры внутри скобок поддерживаются.
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
          <Button variant="outline" @click="isImportModalOpen = false"
            >Отмена</Button
          >
          <Button @click="handleImport">Добавить</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Add Card Modal -->
    <Dialog v-model:open="isAddModalOpen">
      <DialogContent class="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Добавить новую карту</DialogTitle>
          <DialogDescription>
            Добавьте данные карты ниже. После завершения нажмите «Сохранить».
          </DialogDescription>
        </DialogHeader>

        <div class="grid grid-cols-2 gap-6 py-4">
          <!-- Side 1 Form -->
          <div class="space-y-4">
            <h4 class="font-medium border-b pb-2">Сторона 1</h4>
            <div class="space-y-2">
              <Label for="side1Word">Слово / Фраза *</Label>
              <Input
                id="side1Word"
                v-model="newCardForm.side1Word"
                :class="
                  newCardErrors.side1Word
                    ? 'border-red-500 ring-1 ring-red-500'
                    : ''
                "
              />
            </div>
            <div class="space-y-2">
              <Label for="side1Example">Пример использования</Label>
              <textarea
                id="side1Example"
                v-model="newCardForm.side1Example"
                class="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              ></textarea>
            </div>
          </div>

          <!-- Side 2 Form -->
          <div class="space-y-4">
            <h4 class="font-medium border-b pb-2">Сторона 2</h4>
            <div class="space-y-2">
              <Label for="side2Word">Слово / Фраза *</Label>
              <Input
                id="side2Word"
                v-model="newCardForm.side2Word"
                :class="
                  newCardErrors.side2Word
                    ? 'border-red-500 ring-1 ring-red-500'
                    : ''
                "
              />
            </div>
            <div class="space-y-2">
              <Label for="side2Example">Пример использования</Label>
              <textarea
                id="side2Example"
                v-model="newCardForm.side2Example"
                class="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              ></textarea>
            </div>
          </div>

          <!-- Frequency Selection -->
          <div class="col-span-2 space-y-2">
            <Label for="frequency">Частота показа раз в ...</Label>
            <select
              id="frequency"
              v-model="newCardForm.frequency"
              class="w-full px-3 py-2 border border-input rounded-md shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option
                v-for="freq in cardFrequencyService.getFrequencies()"
                :key="cardFrequencyService.getFrequencyId(freq)"
                :value="cardFrequencyService.getFrequencyId(freq)"
              >
                {{ cardFrequencyService.getFrequencyLabel(freq) }}
              </option>
            </select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="isAddModalOpen = false"
            >Отмена</Button
          >
          <Button type="submit" @click="handleAddCard">Добавить</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Full Edit Card Modal -->
    <Dialog v-model:open="isFullEditModalOpen">
      <DialogContent class="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Изменить карточку</DialogTitle>
        </DialogHeader>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 py-4">
          <div class="space-y-4">
            <h4 class="font-medium border-b pb-2">Сторона 1</h4>
            <div class="space-y-2">
              <Label for="fullEditSide1Word">Слово / Фраза *</Label>
              <Input
                id="fullEditSide1Word"
                ref="fullEditSide1WordRef"
                v-model="fullEditForm.side1Word"
                :class="
                  fullEditErrors.side1Word
                    ? 'border-red-500 ring-1 ring-red-500'
                    : ''
                "
              />
            </div>
            <div class="space-y-2">
              <Label for="fullEditSide1Example">Пример использования</Label>
              <textarea
                id="fullEditSide1Example"
                ref="fullEditSide1ExampleRef"
                v-model="fullEditForm.side1Example"
                class="flex min-h-[90px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              ></textarea>
            </div>
          </div>

          <div class="space-y-4">
            <h4 class="font-medium border-b pb-2">Сторона 2</h4>
            <div class="space-y-2">
              <Label for="fullEditSide2Word">Слово / Фраза *</Label>
              <Input
                id="fullEditSide2Word"
                ref="fullEditSide2WordRef"
                v-model="fullEditForm.side2Word"
                :class="
                  fullEditErrors.side2Word
                    ? 'border-red-500 ring-1 ring-red-500'
                    : ''
                "
              />
            </div>
            <div class="space-y-2">
              <Label for="fullEditSide2Example">Пример использования</Label>
              <textarea
                id="fullEditSide2Example"
                ref="fullEditSide2ExampleRef"
                v-model="fullEditForm.side2Example"
                class="flex min-h-[90px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              ></textarea>
            </div>
          </div>

          <div class="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="fullEditFrequency">Частота показа раз в ...</Label>
              <select
                id="fullEditFrequency"
                ref="fullEditFrequencyRef"
                v-model="fullEditForm.frequency"
                class="w-full px-3 py-2 border border-input rounded-md shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option
                  v-for="freq in cardFrequencyService.getFrequencies()"
                  :key="cardFrequencyService.getFrequencyId(freq)"
                  :value="cardFrequencyService.getFrequencyId(freq)"
                >
                  {{ cardFrequencyService.getFrequencyLabel(freq) }}
                </option>
              </select>
            </div>

            <div class="space-y-2">
              <Label for="fullEditTimeout">Timeout (Unix ms)</Label>
              <Input
                id="fullEditTimeout"
                ref="fullEditTimeoutRef"
                v-model.number="fullEditForm.timeoutUntil"
                type="number"
                min="0"
              />
            </div>
            <div class="space-y-2">
              <Label for="fullEditActive">Видимость</Label>
              <select
                id="fullEditActive"
                ref="fullEditActiveRef"
                v-model="fullEditForm.active"
                class="w-full px-3 py-2 border border-input rounded-md shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option :value="true">Видимая</option>
                <option :value="false">Скрытая</option>
              </select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="isFullEditModalOpen = false">
            Отмена
          </Button>
          <Button @click="handleSaveFullEdit">Сохранить изменения</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Delete Confirmation Modal -->
    <AlertDialog v-model:open="isDeleteConfirmOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Удалить эту карточку?</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="isDeleteConfirmOpen = false"
            >Отмена</AlertDialogCancel
          >
          <AlertDialogAction
            class="bg-red-600 hover:bg-red-700 text-white"
            @click="confirmDelete"
          >
            Удалить
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <!-- Reset All Timeouts Confirmation Modal -->
    <AlertDialog v-model:open="isResetAllConfirmOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Сбросить все таймауты?</AlertDialogTitle>
          <AlertDialogDescription>
            Это действие сбросит следующее время показа для всех карточек в
            колоде на текущее время. Продолжить?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="isResetAllConfirmOpen = false"
            >Отмена</AlertDialogCancel
          >
          <AlertDialogAction
            class="bg-blue-600 hover:bg-blue-700 text-white"
            @click="handleResetAllTimeouts"
          >
            Сбросить
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
