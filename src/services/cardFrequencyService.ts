const FREQUENCIES_KEY = "card_frequencies";

export interface Frequency {
  value: string;
  label: string;
  minutes: number;
}

const DEFAULT_FREQUENCIES: Frequency[] = [
  { value: "1_min", label: "1 мин", minutes: 1 },
  { value: "1_hour", label: "1 час", minutes: 60 },
  { value: "1_day", label: "1 день", minutes: 1440 },
  { value: "7_days", label: "1 нед", minutes: 10080 },
  { value: "30_days", label: "1 мес", minutes: 43200 },
];

export class CardFrequencyService {
  private frequencies: Frequency[] = [];
  private initialized = false;

  private initializeFromStorage() {
    if (this.initialized) return;

    try {
      const frequenciesJson = localStorage.getItem(FREQUENCIES_KEY);
      if (frequenciesJson) {
        this.frequencies = JSON.parse(frequenciesJson);
      } else {
        this.frequencies = DEFAULT_FREQUENCIES;
        this.save();
      }
    } catch (error) {
      console.error("Failed to initialize frequencies from storage:", error);
      this.frequencies = DEFAULT_FREQUENCIES;
    }

    this.initialized = true;
  }

  getFrequencies(): Frequency[] {
    this.initializeFromStorage();
    return this.frequencies;
  }

  getFrequencyLabel(value: string): string {
    this.initializeFromStorage();
    const freq = this.frequencies.find((f) => f.value === value);
    return freq ? freq.label : value;
  }

  addFrequency(label: string, minutes: number): void {
    this.initializeFromStorage();
    const value = `custom_${Date.now()}`;
    this.frequencies.push({
      value,
      label,
      minutes,
    });
    this.save();
  }

  updateFrequency(value: string, label: string, minutes: number): void {
    this.initializeFromStorage();
    const index = this.frequencies.findIndex((f) => f.value === value);
    if (index !== -1) {
      this.frequencies[index] = { value, label, minutes };
      this.save();
    }
  }

  deleteFrequency(value: string): void {
    this.initializeFromStorage();
    // Don't allow deleting default frequencies
    if (DEFAULT_FREQUENCIES.some((f) => f.value === value)) {
      return;
    }
    this.frequencies = this.frequencies.filter((f) => f.value !== value);
    this.save();
  }

  resetToDefaults(): void {
    this.frequencies = DEFAULT_FREQUENCIES;
    this.save();
  }

  private save(): void {
    localStorage.setItem(FREQUENCIES_KEY, JSON.stringify(this.frequencies));
  }
}

export default new CardFrequencyService();
