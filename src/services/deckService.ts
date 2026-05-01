/// <reference lib="webworker" />

const LAST_SHOWN_CARDS_LIMIT = 5;
const DB_NAME = "memopush";
const DB_VERSION = 1;
const DECKS_STORE = "decks";
const CARDS_STORE = "cards";

const DEFAULT_DECKS: Deck[] = [];

export interface Deck {
  id: string;
  name: string;
  active: boolean;
  cards: Card[];
}

export interface Card {
  id: string;

  side1Word: string;
  side1Example: string;

  side2Word: string;
  side2Example: string;

  timeoutUntil: number;
  active: boolean;
  frequency: string;
}

class DeckService {
  private db: IDBDatabase | null = null;
  private lastShownCards: Card["id"][] = [];
  private initPromise: Promise<void> | null = null;

  private async openDatabase(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create decks store
        if (!db.objectStoreNames.contains(DECKS_STORE)) {
          db.createObjectStore(DECKS_STORE, { keyPath: "id" });
        }

        // Create cards store
        if (!db.objectStoreNames.contains(CARDS_STORE)) {
          const cardStore = db.createObjectStore(CARDS_STORE, {
            keyPath: "id",
          });
          cardStore.createIndex("deckId", "deckId", { unique: false });
        }
      };
    });
  }

  private async initialize(): Promise<void> {
    if (this.initPromise) return this.initPromise;

    this.initPromise = this.openDatabase() as unknown as Promise<void>;
    await this.initPromise;
  }

  private async getAllFromStore<T>(storeName: string): Promise<T[]> {
    await this.initialize();
    const db = this.db!;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async getFromStore<T>(
    storeName: string,
    key: string,
  ): Promise<T | null> {
    await this.initialize();
    const db = this.db!;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  private async putToStore<T>(storeName: string, value: T): Promise<void> {
    await this.initialize();
    const db = this.db!;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.put(value);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async deleteFromStore(storeName: string, key: string): Promise<void> {
    await this.initialize();
    const db = this.db!;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async createCard(deckId: string, card: Omit<Card, "id">): Promise<Card> {
    await this.initialize();

    const deck = await this.getFromStore<Deck>(DECKS_STORE, deckId);
    if (!deck) throw new Error(`Deck with id ${deckId} not found`);

    const newCard: Card = {
      ...card,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
    };

    deck.cards.push(newCard);
    await this.putToStore(DECKS_STORE, deck);

    return newCard;
  }

  async updateCard(
    deckId: string,
    cardId: Card["id"],
    updates: Omit<Card, "id">,
  ): Promise<void> {
    await this.initialize();

    const deck = await this.getFromStore<Deck>(DECKS_STORE, deckId);
    if (!deck) throw new Error(`Deck with id ${deckId} not found`);

    const cardIndex = deck.cards.findIndex((c) => c.id === cardId);
    if (cardIndex === -1)
      throw new Error(`Card with id ${cardId} not found in deck ${deckId}`);

    deck.cards[cardIndex] = { id: cardId, ...updates };
    await this.putToStore(DECKS_STORE, deck);
  }

  async deleteCard(deckId: string, cardId: Card["id"]): Promise<void> {
    await this.initialize();

    const deck = await this.getFromStore<Deck>(DECKS_STORE, deckId);
    if (!deck) throw new Error(`Deck with id ${deckId} not found`);

    const cardIndex = deck.cards.findIndex((c) => c.id === cardId);
    if (cardIndex === -1)
      throw new Error(`Card with id ${cardId} not found in deck ${deckId}`);

    deck.cards.splice(cardIndex, 1);
    await this.putToStore(DECKS_STORE, deck);
  }

  async getRandomCard(): Promise<Card | null> {
    await this.initialize();

    const decks = await this.getAllFromStore<Deck>(DECKS_STORE);
    const activeDecks = decks.filter((deck) => deck.active);
    const activeCards = activeDecks.flatMap((deck) =>
      deck.cards.filter((card) => card.active),
    );

    const dueCards = activeCards.filter(
      (card) => card.timeoutUntil <= Date.now(),
    );

    const filteredCards = dueCards.filter(
      (card) => !this.lastShownCards.includes(card.id),
    );

    if (filteredCards.length === 0) {
      this.lastShownCards = [];
      if (dueCards.length === 0) return null;
      return this.getRandomCard();
    }

    const randomCard =
      filteredCards[Math.floor(Math.random() * filteredCards.length)];

    this.lastShownCards.push(randomCard.id);
    if (this.lastShownCards.length > LAST_SHOWN_CARDS_LIMIT) {
      this.lastShownCards.shift();
    }

    return randomCard;
  }

  async getAllDecks(): Promise<Deck[]> {
    await this.initialize();
    return this.getAllFromStore<Deck>(DECKS_STORE);
  }

  async getDeckById(deckId: string): Promise<Deck | null> {
    await this.initialize();
    return this.getFromStore<Deck>(DECKS_STORE, deckId);
  }

  async createDeck(name: string): Promise<Deck> {
    await this.initialize();

    const newDeck: Deck = {
      id: `deck-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      name,
      active: true,
      cards: [],
    };

    await this.putToStore(DECKS_STORE, newDeck);

    return newDeck;
  }

  async updateDeck(
    deckId: string,
    updates: Partial<Omit<Deck, "id" | "cards">>,
  ): Promise<void> {
    await this.initialize();

    const deck = await this.getFromStore<Deck>(DECKS_STORE, deckId);
    if (!deck) throw new Error(`Deck with id ${deckId} not found`);

    Object.assign(deck, updates);
    await this.putToStore(DECKS_STORE, deck);
  }

  async deleteDeck(deckId: string): Promise<void> {
    await this.initialize();

    await this.deleteFromStore(DECKS_STORE, deckId);
  }

  private findDeckIdByCard(card: Card): string | null {
    // Synchronous version for use in notification handlers
    const decks = this.db
      ? this.getAllFromStore<Deck>(DECKS_STORE)
      : Promise.resolve([]);

    // This is a simplified version - in practice you'd want to cache this
    return null;
  }

  async showCardQuestion(sw: ServiceWorkerGlobalScope, card: Card) {
    const deckId = await this.findDeckIdByCardSync(card);
    if (deckId) {
      await this.updateCard(deckId, card.id, card);
    }

    await sw.registration.showNotification("", {
      badge: "7",
      tag: "card",
      body: `${card.side1Word}\n\n${card.side1Example}`,
      data: {
        type: "question",
        card,
        deckId,
      },
      silent: true,
      // @ts-ignore
      renotify: true,
      // @ts-ignore
      actions: [
        {
          action: "more",
          title: "Показывать чаще",
        },
        {
          action: "less",
          title: "Показывать реже",
        },
      ],
    });
  }

  async showCardAnswer(sw: ServiceWorkerGlobalScope, card: Card) {
    const deckId = await this.findDeckIdByCardSync(card);

    await sw.registration.showNotification(card.side2Word, {
      tag: "card",
      body: card.side2Example,
      data: {
        type: "answer",
        card,
        deckId,
      },
      silent: true,
      // @ts-ignore
      renotify: true,
      // @ts-ignore
      actions: [
        {
          action: "more",
          title: "Показывать чаще",
        },
        {
          action: "less",
          title: "Показывать реже",
        },
      ],
    });
  }

  private async findDeckIdByCardSync(card: Card): Promise<string | null> {
    const decks = await this.getAllDecks();
    for (const deck of decks) {
      if (deck.cards.some((c) => c.id === card.id)) {
        return deck.id;
      }
    }
    return null;
  }

  async handleClick(sw: ServiceWorkerGlobalScope, event: NotificationEvent) {
    const data: {
      type: "question" | "answer";
      card: Card;
      deckId: string;
    } = event.notification.data || null;
    const action = event.action;

    if (data?.type === "question") {
      await this.showCardAnswer(sw, data.card);
    } else if (data?.type === "answer") {
      if (data.deckId && action === "more") {
        // Increase frequency (show more often)
        data.card.frequency = this.increaseFrequency(data.card.frequency);
        data.card.timeoutUntil = this.calculateTimeoutUntil(
          data.card.frequency,
        );
      } else if (data.deckId && action === "less") {
        // Decrease frequency (show less often)
        data.card.frequency = this.decreaseFrequency(data.card.frequency);
        data.card.timeoutUntil = this.calculateTimeoutUntil(
          data.card.frequency,
        );
      }

      if (data.deckId) {
        await this.updateCard(data.deckId, data.card.id, data.card);
      }

      await this.start(sw);
    }
  }

  private increaseFrequency(frequency: string): string {
    const frequencies = ["1_day", "3_days", "7_days", "14_days", "30_days"];
    const currentIndex = frequencies.indexOf(frequency);
    return frequencies[Math.min(currentIndex + 1, frequencies.length - 1)];
  }

  private decreaseFrequency(frequency: string): string {
    const frequencies = ["1_day", "3_days", "7_days", "14_days", "30_days"];
    const currentIndex = frequencies.indexOf(frequency);
    return frequencies[Math.max(currentIndex - 1, 0)];
  }

  private calculateTimeoutUntil(frequency: string): number {
    const frequencyMap: { [key: string]: { unit: string; value: number } } = {
      "1_min": { unit: "minute", value: 1 },
      "1_hour": { unit: "hour", value: 1 },
      "1_day": { unit: "day", value: 1 },
      "3_days": { unit: "day", value: 3 },
      "7_days": { unit: "day", value: 7 },
      "14_days": { unit: "day", value: 14 },
      "30_days": { unit: "day", value: 30 },
    };
    const freq = frequencyMap[frequency];
    if (!freq) return Date.now() + 86400000; // Default to 1 day
    const ms =
      {
        minute: 60000,
        hour: 3600000,
        day: 86400000,
      }[freq.unit] || 86400000;
    return Date.now() + ms * freq.value;
  }

  async start(sw: ServiceWorkerGlobalScope) {
    const card = await this.getRandomCard();
    if (!card) return;
    await this.showCardQuestion(sw, card);
  }
}

export default new DeckService();
