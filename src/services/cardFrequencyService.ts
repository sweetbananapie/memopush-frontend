import dayjs from "@/plugins/dayjs";
import type { ManipulateType } from "dayjs";

const FREQUENCIES_KEY = "card_frequencies_v2";
const LEGACY_FREQUENCIES_KEY = "card_frequencies";

export type FrequencyUnit =
  | "minutes"
  | "hours"
  | "days"
  | "weeks"
  | "months"
  | "years";

export interface Frequency {
  value: number;
  unit: FrequencyUnit;
}

export const FREQUENCY_UNITS: FrequencyUnit[] = [
  "minutes",
  "hours",
  "days",
  "weeks",
  "months",
  "years",
];

const DEFAULT_FREQUENCIES: Frequency[] = [
  { value: 1, unit: "minutes" },
  { value: 1, unit: "hours" },
  { value: 1, unit: "days" },
  { value: 1, unit: "weeks" },
  { value: 1, unit: "months" },
];

type LegacyFrequency = {
  value: string;
  label?: string;
  minutes?: number;
};

const LEGACY_VALUE_MAP: Record<string, Frequency> = {
  "1_min": { value: 1, unit: "minutes" },
  "1_hour": { value: 1, unit: "hours" },
  "1_day": { value: 1, unit: "days" },
  "3_days": { value: 3, unit: "days" },
  "7_days": { value: 1, unit: "weeks" },
  "14_days": { value: 2, unit: "weeks" },
  "30_days": { value: 1, unit: "months" },
  custom_1_week: { value: 1, unit: "weeks" },
  custom_2_weeks: { value: 2, unit: "weeks" },
};

const UNIT_LABELS_RU: Record<FrequencyUnit, [string, string, string]> = {
  minutes: ["минута", "минуты", "минут"],
  hours: ["час", "часа", "часов"],
  days: ["день", "дня", "дней"],
  weeks: ["неделя", "недели", "недель"],
  months: ["месяц", "месяца", "месяцев"],
  years: ["год", "года", "лет"],
};

const normalizeFrequency = (frequency: Frequency): Frequency => ({
  value: Math.max(1, Math.floor(Number(frequency.value) || 1)),
  unit: frequency.unit,
});

const toFrequencyKey = (frequency: Frequency): string =>
  `${frequency.value}_${frequency.unit}`;

const getPluralForm = (
  value: number,
  [one, few, many]: [string, string, string],
): string => {
  const abs = Math.abs(value) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return many;
  if (last > 1 && last < 5) return few;
  if (last === 1) return one;
  return many;
};

const toDayjsUnit = (unit: FrequencyUnit): ManipulateType => {
  const map: Record<FrequencyUnit, ManipulateType> = {
    minutes: "minute",
    hours: "hour",
    days: "day",
    weeks: "week",
    months: "month",
    years: "year",
  };
  return map[unit];
};

export class CardFrequencyService {
  private frequencies: Frequency[] = [];
  private initialized = false;
  private hydratedFrequencies(rawFrequencies: Frequency[]): Frequency[] {
    const normalized = rawFrequencies.map(normalizeFrequency);
    const merged = [...DEFAULT_FREQUENCIES, ...normalized];
    const unique = new Map<string, Frequency>();

    for (const frequency of merged) {
      unique.set(toFrequencyKey(frequency), frequency);
    }

    return Array.from(unique.values());
  }

  private migrateLegacyFrequencies(): Frequency[] | null {
    try {
      const legacyJson = localStorage.getItem(LEGACY_FREQUENCIES_KEY);
      if (!legacyJson) return null;

      const legacyFrequencies = JSON.parse(legacyJson) as LegacyFrequency[];
      if (!Array.isArray(legacyFrequencies)) return null;

      const migrated: Frequency[] = [];

      for (const legacyFrequency of legacyFrequencies) {
        const byValue = LEGACY_VALUE_MAP[legacyFrequency.value];
        if (byValue) {
          migrated.push(byValue);
          continue;
        }

        if (legacyFrequency.minutes && legacyFrequency.minutes > 0) {
          migrated.push({ value: legacyFrequency.minutes, unit: "minutes" });
        }
      }

      localStorage.removeItem(LEGACY_FREQUENCIES_KEY);
      return this.hydratedFrequencies(migrated);
    } catch (error) {
      console.error("Failed to migrate frequencies:", error);
      return null;
    }
  }

  private initializeFromStorage() {
    if (this.initialized) return;

    try {
      const frequenciesJson = localStorage.getItem(FREQUENCIES_KEY);
      if (frequenciesJson) {
        const parsed = JSON.parse(frequenciesJson) as Frequency[];
        this.frequencies = this.hydratedFrequencies(parsed);
      } else {
        const migrated = this.migrateLegacyFrequencies();
        this.frequencies = migrated ?? [...DEFAULT_FREQUENCIES];
        this.save();
      }
    } catch (error) {
      console.error("Failed to initialize frequencies from storage:", error);
      this.frequencies = [...DEFAULT_FREQUENCIES];
      this.save();
    }

    if (this.frequencies.length === 0) {
      this.frequencies = [...DEFAULT_FREQUENCIES];
      this.save();
    }

    this.initialized = true;
  }

  getFrequencies(): Frequency[] {
    this.initializeFromStorage();
    return [...this.frequencies];
  }

  getFrequencyId(frequency: Frequency): string {
    return toFrequencyKey(normalizeFrequency(frequency));
  }

  resolveFrequency(frequencyId: string): Frequency | null {
    this.initializeFromStorage();

    const [rawValue, rawUnit] = frequencyId.split("_");
    const parsedValue = Number(rawValue);
    if (
      Number.isFinite(parsedValue) &&
      FREQUENCY_UNITS.includes(rawUnit as FrequencyUnit)
    ) {
      const normalized = normalizeFrequency({
        value: parsedValue,
        unit: rawUnit as FrequencyUnit,
      });
      const exists = this.frequencies.some(
        (frequency) => toFrequencyKey(frequency) === toFrequencyKey(normalized),
      );
      return exists ? normalized : null;
    }

    const legacy = LEGACY_VALUE_MAP[frequencyId];
    if (!legacy) return null;

    const legacyId = toFrequencyKey(legacy);
    const existsLegacy = this.frequencies.some(
      (frequency) => toFrequencyKey(frequency) === legacyId,
    );
    return existsLegacy ? legacy : null;
  }

  getFallbackFrequencyId(): string {
    this.initializeFromStorage();
    const fallback = this.frequencies[0] ?? DEFAULT_FREQUENCIES[0];
    return toFrequencyKey(fallback);
  }

  getFrequencyLabelById(frequencyId: string): string {
    const resolved = this.resolveFrequency(frequencyId);
    return resolved ? this.getFrequencyLabel(resolved) : frequencyId;
  }

  getFrequencyLabel(frequency: Frequency): string {
    const normalized = normalizeFrequency(frequency);
    const form = getPluralForm(normalized.value, UNIT_LABELS_RU[normalized.unit]);
    return `${normalized.value} ${form}`;
  }

  addFrequency(value: number, unit: FrequencyUnit): {
    ok: boolean;
    error?: string;
  } {
    this.initializeFromStorage();
    const normalized = normalizeFrequency({ value, unit });
    const key = toFrequencyKey(normalized);

    if (this.frequencies.some((frequency) => toFrequencyKey(frequency) === key)) {
      return { ok: false, error: "duplicate" };
    }

    this.frequencies.push(normalized);
    this.save();
    return { ok: true };
  }

  updateFrequency(
    originalId: string,
    value: number,
    unit: FrequencyUnit,
  ): { ok: boolean; error?: string; newId?: string } {
    this.initializeFromStorage();
    const normalized = normalizeFrequency({ value, unit });
    const newId = toFrequencyKey(normalized);
    const index = this.frequencies.findIndex(
      (frequency) => toFrequencyKey(frequency) === originalId,
    );

    if (index === -1) {
      return { ok: false, error: "not_found" };
    }

    const duplicateIndex = this.frequencies.findIndex(
      (frequency) => toFrequencyKey(frequency) === newId,
    );
    if (duplicateIndex !== -1 && duplicateIndex !== index) {
      return { ok: false, error: "duplicate" };
    }

    this.frequencies[index] = normalized;
    this.save();
    return { ok: true, newId };
  }

  deleteFrequency(frequencyId: string): void {
    this.initializeFromStorage();
    this.frequencies = this.frequencies.filter(
      (frequency) => toFrequencyKey(frequency) !== frequencyId,
    );
    this.save();
  }

  reorderFrequencies(ids: string[]): void {
    this.initializeFromStorage();

    const current = new Map(
      this.frequencies.map((frequency) => [toFrequencyKey(frequency), frequency]),
    );
    const ordered: Frequency[] = [];

    for (const id of ids) {
      const freq = current.get(id);
      if (freq) {
        ordered.push(freq);
        current.delete(id);
      }
    }

    ordered.push(...current.values());
    this.frequencies = ordered;
    this.save();
  }

  getNextFrequencyId(frequencyId: string): string {
    this.initializeFromStorage();
    const resolved = this.resolveFrequency(frequencyId);
    if (!resolved) return this.getFallbackFrequencyId();

    const key = toFrequencyKey(resolved);
    const index = this.frequencies.findIndex(
      (frequency) => toFrequencyKey(frequency) === key,
    );
    if (index === -1) return this.getFallbackFrequencyId();
    return toFrequencyKey(
      this.frequencies[Math.min(index + 1, this.frequencies.length - 1)],
    );
  }

  getPreviousFrequencyId(frequencyId: string): string {
    this.initializeFromStorage();
    const resolved = this.resolveFrequency(frequencyId);
    if (!resolved) return this.getFallbackFrequencyId();

    const key = toFrequencyKey(resolved);
    const index = this.frequencies.findIndex(
      (frequency) => toFrequencyKey(frequency) === key,
    );
    if (index === -1) return this.getFallbackFrequencyId();
    return toFrequencyKey(this.frequencies[Math.max(index - 1, 0)]);
  }

  calculateTimeoutUntil(
    frequencyId: string,
    fromTimestamp = Date.now(),
  ): number {
    const resolved = this.resolveFrequency(frequencyId);
    if (!resolved) {
      return dayjs(fromTimestamp).add(1, "day").valueOf();
    }

    return dayjs(fromTimestamp)
      .add(resolved.value, toDayjsUnit(resolved.unit))
      .valueOf();
  }

  resetToDefaults(): void {
    this.frequencies = [...DEFAULT_FREQUENCIES];
    this.save();
  }

  private save(): void {
    localStorage.setItem(FREQUENCIES_KEY, JSON.stringify(this.frequencies));
  }
}

export default new CardFrequencyService();
