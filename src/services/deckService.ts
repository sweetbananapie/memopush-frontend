/// <reference lib="webworker" />

export interface Card {
  id: string;

  side1Word: string;
  side1Example: string;

  side2Word: string;
  side2Example: string;

  lastShown: number;
  dueDate: number;
  active: boolean;
  frequency: string;
}

export class DeckService {
  cards = [
    {
      id: "101",
      side1Word: "Serendipity",
      side1Example: "Finding that old book was pure serendipity.",
      side2Word: "Случайность",
      side2Example: "Найти ту старую книгу было чистой случайностью.",
      lastShown: Date.now() - 86400000,
      dueDate: Date.now() + 86400000,
      active: true,
      frequency: "1_day",
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
      frequency: "7_days",
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
      frequency: "3_days",
    },
  ];
  async getRandomCard() {
    const activeCards = this.cards.filter((card) => card.active);

    if (activeCards.length === 0) {
      return null; // или throw new Error(), или undefined — как тебе удобнее
    }

    const randomIndex = Math.floor(Math.random() * activeCards.length);
    return activeCards[randomIndex];
  }

  async showCardQuestion(sw: ServiceWorkerGlobalScope, card: Card) {
    await sw.registration.showNotification("", {
      badge: "7",
      tag: "card",
      body: `${card.side1Word}\n\n${card.side1Example}`,
      data: {
        type: "question",
        card,
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
    await sw.registration.showNotification(card.side2Word, {
      tag: "card",
      body: card.side2Example,
      data: {
        type: "answer",
        card,
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

  async handleClick(sw: ServiceWorkerGlobalScope, event: NotificationEvent) {
    // event.notification.close();

    const data: { type: "question" | "answer"; card: Card } =
      event.notification.data || null;
    const action = event.action;

    if (data.type === "question") {
      await this.showCardAnswer(sw, data.card);
    } else if (data.type === "answer") {
      await this.start(sw);
    }
  }

  async start(sw: ServiceWorkerGlobalScope, event?: PushEvent) {
    const card = await this.getRandomCard();
    if (!card) return;
    await this.showCardQuestion(sw, card);
  }
}

export default new DeckService();
