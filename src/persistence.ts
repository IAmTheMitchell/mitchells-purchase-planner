import type { PropertyItem, Scenario, VehicleItem } from "./types";
import { newScenario } from "./defaults";

export const LS_KEY = "mitchells-purchase-planner.scenarios.v1";
const LEGACY_KEYS = ["future-purchase-planner.scenarios.v1"];
const EXPORT_VERSION = 1;

type ScenarioExport = {
  version: number;
  scenarios: Scenario[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function sanitizeItem(value: unknown): PropertyItem | VehicleItem | null {
  if (!isRecord(value)) return null;

  const { id, name, type } = value as Partial<PropertyItem | VehicleItem>;
  if (typeof id !== "string" || typeof name !== "string") return null;
  if (type !== "property" && type !== "vehicle") return null;

  return value as PropertyItem | VehicleItem;
}

function sanitizeScenario(value: unknown): Scenario | null {
  if (!isRecord(value)) return null;

  const { id, name, analysisYears, items } = value as Partial<Scenario> & {
    items?: unknown;
  };

  if (typeof id !== "string" || typeof name !== "string") return null;
  const years = toFiniteNumber(analysisYears);
  if (!years) return null;
  if (!Array.isArray(items)) return null;

  const sanitizedItems = items
    .map((item) => sanitizeItem(item))
    .filter((item): item is PropertyItem | VehicleItem => item != null);

  if (sanitizedItems.length !== items.length) return null;

  return {
    id,
    name,
    analysisYears: Math.max(1, Math.round(years)),
    items: sanitizedItems,
  };
}

export function loadScenarios(): Scenario[] {
  if (typeof window === "undefined" || !window.localStorage)
    return [newScenario()];

  try {
    const storage = window.localStorage;
    const raw = [LS_KEY, ...LEGACY_KEYS]
      .map((key) => storage.getItem(key))
      .find((value): value is string => Boolean(value));
    if (!raw) return [newScenario()];
    const parsed: Scenario[] = JSON.parse(raw);
    if (storage.getItem(LS_KEY) == null) {
      storage.setItem(LS_KEY, JSON.stringify(parsed));
    }
    return parsed && parsed.length > 0 ? parsed : [newScenario()];
  } catch {
    return [newScenario()];
  }
}

export function saveScenarios(scenarios: Scenario[]): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  window.localStorage.setItem(LS_KEY, JSON.stringify(scenarios));
}

export function serializeScenarios(scenarios: Scenario[]): string {
  const payload: ScenarioExport = {
    version: EXPORT_VERSION,
    scenarios,
  };
  return JSON.stringify(payload, null, 2);
}

export function parseScenarios(raw: string): Scenario[] {
  const parsed = JSON.parse(raw) as unknown;

  const scenarios = Array.isArray(parsed)
    ? parsed
    : isRecord(parsed) && Array.isArray((parsed as ScenarioExport).scenarios)
      ? (parsed as ScenarioExport).scenarios
      : null;

  if (!scenarios) {
    throw new Error("File does not contain scenarios data");
  }

  const sanitized = scenarios
    .map((scenario) => sanitizeScenario(scenario))
    .filter((scenario): scenario is Scenario => scenario != null);

  if (!sanitized.length) {
    throw new Error("No valid scenarios found in file");
  }

  return sanitized;
}
