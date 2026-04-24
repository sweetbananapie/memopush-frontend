<script setup lang="ts">
import { ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  ArrowLeftRight,
  Lightbulb,
  LightbulbOff,
  Pencil,
  Trash,
  ChevronLeft,
} from "lucide-vue-next";
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
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import dayjs from "@/plugins/dayjs";

const route = useRoute();
const router = useRouter();

// Mock deck title
const deckName = ref("English Vocabulary (B2)");

// Mock data for cards
const cards = ref([
  {
    id: "101",
    side1Word: "Serendipity",
    side1Example: "Finding that old book was pure serendipity.",
    side2Word: "Случайность",
    side2Example: "Найти ту старую книгу было чистой случайностью.",
    lastShown: Date.now() - 86400000, // 1 day ago
    dueDate: Date.now() + 86400000, // 1 day from now
    active: true,
  },
  {
    id: "102",
    side1Word: "Ephemeral",
    side1Example: "Fame in the modern world is often ephemeral.",
    side2Word: "Мимолетный",
    side2Example: "Слава в современном мире часто бывает мимолетной.",
    lastShown: Date.now() - 172800000,
    dueDate: Date.now() - 3600000, // Overdue
    active: false,
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
  },
]);

// Edit Modal State
const isEditModalOpen = ref(false);
const editingCard = ref<any>(null);

// Delete Confirm State
const isDeleteConfirmOpen = ref(false);
const cardToDelete = ref<string | null>(null);

const goBack = () => {
  router.push("/decks");
};

const formatDate = (timestamp: number) => {
  if (!timestamp) return "-";
  return dayjs(timestamp).format("DD MMM YYYY, HH:mm");
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

const handleEditClick = (id: string) => {
  const card = cards.value.find((c) => c.id === id);
  if (card) {
    editingCard.value = { ...card };
    isEditModalOpen.value = true;
  }
};

const saveCard = () => {
  if (editingCard.value) {
    const index = cards.value.findIndex((c) => c.id === editingCard.value.id);
    if (index !== -1) {
      cards.value[index] = { ...editingCard.value };
    } else {
      // Create new
      cards.value.push({ ...editingCard.value });
    }
  }
  isEditModalOpen.value = false;
};

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

const handleCreateCard = () => {
  editingCard.value = {
    id: Date.now().toString(),
    side1Word: "",
    side1Example: "",
    side2Word: "",
    side2Example: "",
    lastShown: 0,
    dueDate: Date.now() + 86400000,
    active: true,
  };
  isEditModalOpen.value = true;
};
</script>

<template>
  <div class="container mx-auto py-8 px-4 max-w-7xl">
    <!-- Header -->
    <div class="flex items-center space-x-4 mb-8">
      <Button variant="ghost" size="icon" @click="goBack">
        <ChevronLeft class="w-6 h-6" />
      </Button>
      <h1 class="text-3xl font-bold tracking-tight flex-1">{{ deckName }}</h1>
      <Button @click="handleCreateCard">Add Card</Button>
    </div>

    <!-- Cards Table -->
    <div class="rounded-md border bg-white overflow-hidden shadow-sm">
      <Table>
        <TableHeader class="bg-gray-50/50">
          <TableRow>
            <TableHead class="w-[30%]">Side 1</TableHead>
            <TableHead class="w-[50px] text-center"></TableHead>
            <TableHead class="w-[30%]">Side 2</TableHead>
            <TableHead class="hidden md:table-cell">Last Shown</TableHead>
            <TableHead class="hidden lg:table-cell">Due Date</TableHead>
            <TableHead class="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow
            v-for="card in cards"
            :key="card.id"
            :class="[
              'transition-colors hover:bg-gray-50',
              !card.active ? 'opacity-50 grayscale-[20%]' : '',
            ]"
          >
            <!-- Side 1 -->
            <TableCell>
              <div class="font-medium text-base">{{ card.side1Word }}</div>
              <div class="text-sm text-muted-foreground mt-1 italic">
                {{ card.side1Example }}
              </div>
            </TableCell>

            <!-- Reverse Action -->
            <TableCell class="text-center px-0">
              <Button
                variant="ghost"
                size="icon"
                @click="handleReverse(card.id)"
                class="text-gray-400 hover:text-blue-500 rounded-full"
                title="Reverse Sides"
              >
                <ArrowLeftRight class="w-4 h-4" />
              </Button>
            </TableCell>

            <!-- Side 2 -->
            <TableCell>
              <div class="font-medium text-base">{{ card.side2Word }}</div>
              <div class="text-sm text-muted-foreground mt-1 italic">
                {{ card.side2Example }}
              </div>
            </TableCell>

            <!-- Last Shown -->
            <TableCell class="hidden md:table-cell text-sm text-gray-500">
              {{ formatDate(card.lastShown) }}
            </TableCell>

            <!-- Due Date -->
            <TableCell class="hidden lg:table-cell text-sm">
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
            <TableCell class="text-right">
              <div class="flex items-center justify-end space-x-1">
                <Button
                  variant="ghost"
                  size="icon"
                  @click="handleToggleActive(card.id)"
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
                  @click="handleEditClick(card.id)"
                  class="text-blue-500 hover:text-blue-600"
                >
                  <Pencil class="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  @click="handleDeleteClick(card.id)"
                  class="text-red-500 hover:text-red-600"
                >
                  <Trash class="w-4 h-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <!-- Edit Modal -->
    <Dialog v-model:open="isEditModalOpen">
      <DialogContent class="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{{
            editingCard?.id && editingCard.side1Word
              ? "Edit Card"
              : "Add New Card"
          }}</DialogTitle>
          <DialogDescription>
            Update the card details below. Click save when you're done.
          </DialogDescription>
        </DialogHeader>

        <div class="grid grid-cols-2 gap-6 py-4" v-if="editingCard">
          <!-- Side 1 Form -->
          <div class="space-y-4">
            <h4 class="font-medium border-b pb-2">Side 1</h4>
            <div class="space-y-2">
              <Label for="side1Word">Word / Term</Label>
              <Input id="side1Word" v-model="editingCard.side1Word" />
            </div>
            <div class="space-y-2">
              <Label for="side1Example">Usage Example</Label>
              <Input id="side1Example" v-model="editingCard.side1Example" />
            </div>
          </div>

          <!-- Side 2 Form -->
          <div class="space-y-4">
            <h4 class="font-medium border-b pb-2">Side 2</h4>
            <div class="space-y-2">
              <Label for="side2Word">Word / Term</Label>
              <Input id="side2Word" v-model="editingCard.side2Word" />
            </div>
            <div class="space-y-2">
              <Label for="side2Example">Usage Example</Label>
              <Input id="side2Example" v-model="editingCard.side2Example" />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="isEditModalOpen = false"
            >Cancel</Button
          >
          <Button type="submit" @click="saveCard">Save changes</Button>
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
          <AlertDialogCancel @click="isDeleteConfirmOpen = false"
            >Cancel</AlertDialogCancel
          >
          <AlertDialogAction
            class="bg-red-600 hover:bg-red-700 text-white"
            @click="confirmDelete"
            >Delete Card</AlertDialogAction
          >
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
