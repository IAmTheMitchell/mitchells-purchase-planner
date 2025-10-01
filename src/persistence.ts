import { Scenario } from "./types";
import { newScenario } from "./defaults";

export const LS_KEY = "future-purchase-planner.scenarios.v1";

export function loadScenarios(): Scenario[] {
  if (typeof window === "undefined" || !window.localStorage) return [newScenario()];

  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return [newScenario()];
    const parsed: Scenario[] = JSON.parse(raw);
    return parsed && parsed.length > 0 ? parsed : [newScenario()];
  } catch {
    return [newScenario()];
  }
}

export function saveScenarios(scenarios: Scenario[]): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  window.localStorage.setItem(LS_KEY, JSON.stringify(scenarios));
}
