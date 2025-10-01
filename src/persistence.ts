import { Scenario } from "./types";
import { newScenario } from "./defaults";

export const LS_KEY = "mitchells-purchase-planner.scenarios.v1";
const LEGACY_KEYS = ["future-purchase-planner.scenarios.v1"];

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
