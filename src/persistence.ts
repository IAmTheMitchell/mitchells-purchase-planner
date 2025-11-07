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

  const type = value["type"];
  if (type === "property") {
    return sanitizeProperty(value);
  }
  if (type === "vehicle") {
    return sanitizeVehicle(value);
  }
  return null;
}

function sanitizeProperty(value: Record<string, unknown>): PropertyItem | null {
  const id = typeof value.id === "string" ? value.id : null;
  const name = typeof value.name === "string" ? value.name : null;

  if (!id || !name) return null;

  const purchasePrice = toFiniteNumber(value["purchasePrice"]);
  const downPaymentAmount = toFiniteNumber(value["downPaymentAmount"]);
  const interestRateAPR = toFiniteNumber(value["interestRateAPR"]);
  const termYears = toFiniteNumber(value["termYears"]);
  const propertyTaxRate = toFiniteNumber(value["propertyTaxRate"]);
  const insuranceAnnual = toFiniteNumber(value["insuranceAnnual"]);
  const hoaMonthly = toFiniteNumber(value["hoaMonthly"]);
  const maintenancePctAnnual = toFiniteNumber(value["maintenancePctAnnual"]);
  const pmiAnnualRate = toFiniteNumber(value["pmiAnnualRate"]);
  const pmiLTVCancel = toFiniteNumber(value["pmiLTVCancel"]);
  const closingCostsPct = toFiniteNumber(value["closingCostsPct"]);
  const closingCostsFixed = toFiniteNumber(value["closingCostsFixed"]);
  const pointsPct = toFiniteNumber(value["pointsPct"]);
  const originationPct = toFiniteNumber(value["originationPct"]);
  const lenderCredits = toFiniteNumber(value["lenderCredits"]);

  const numbers = [
    purchasePrice,
    downPaymentAmount,
    interestRateAPR,
    termYears,
    propertyTaxRate,
    insuranceAnnual,
    hoaMonthly,
    maintenancePctAnnual,
    pmiAnnualRate,
    pmiLTVCancel,
    closingCostsPct,
    closingCostsFixed,
    pointsPct,
    originationPct,
    lenderCredits,
  ];

  if (numbers.some((n) => n == null)) return null;

  return {
    id,
    name,
    type: "property",
    purchasePrice: purchasePrice!,
    downPaymentAmount: downPaymentAmount!,
    interestRateAPR: interestRateAPR!,
    termYears: Math.max(1, Math.round(termYears!)),
    propertyTaxRate: propertyTaxRate!,
    insuranceAnnual: insuranceAnnual!,
    hoaMonthly: hoaMonthly!,
    maintenancePctAnnual: maintenancePctAnnual!,
    pmiAnnualRate: pmiAnnualRate!,
    pmiLTVCancel: Math.min(1, Math.max(0, pmiLTVCancel!)),
    closingCostsPct: closingCostsPct!,
    closingCostsFixed: closingCostsFixed!,
    pointsPct: pointsPct!,
    originationPct: originationPct!,
    lenderCredits: lenderCredits!,
  };
}

function sanitizeVehicle(value: Record<string, unknown>): VehicleItem | null {
  const id = typeof value.id === "string" ? value.id : null;
  const name = typeof value.name === "string" ? value.name : null;

  if (!id || !name) return null;

  const purchasePrice = toFiniteNumber(value["purchasePrice"]);
  const downPaymentAmount = toFiniteNumber(value["downPaymentAmount"]);
  const tradeInValue = toFiniteNumber(value["tradeInValue"]);
  const salesTaxRate = toFiniteNumber(value["salesTaxRate"]);
  const interestRateAPR = toFiniteNumber(value["interestRateAPR"]);
  const termMonths = toFiniteNumber(value["termMonths"]);
  const insuranceMonthly = toFiniteNumber(value["insuranceMonthly"]);
  const registrationAnnual = toFiniteNumber(value["registrationAnnual"]);
  const maintenanceMonthly = toFiniteNumber(value["maintenanceMonthly"]);
  const oneTimeFees = toFiniteNumber(value["oneTimeFees"]);

  const rollTaxRaw = value["rollTaxIntoLoan"];
  const rollTaxIntoLoan =
    typeof rollTaxRaw === "boolean"
      ? rollTaxRaw
      : rollTaxRaw === "true"
        ? true
        : rollTaxRaw === "false"
          ? false
          : null;

  const numbers = [
    purchasePrice,
    downPaymentAmount,
    tradeInValue,
    salesTaxRate,
    interestRateAPR,
    termMonths,
    insuranceMonthly,
    registrationAnnual,
    maintenanceMonthly,
    oneTimeFees,
  ];

  if (numbers.some((n) => n == null) || rollTaxIntoLoan == null) return null;

  return {
    id,
    name,
    type: "vehicle",
    purchasePrice: purchasePrice!,
    downPaymentAmount: downPaymentAmount!,
    tradeInValue: tradeInValue!,
    salesTaxRate: salesTaxRate!,
    rollTaxIntoLoan,
    interestRateAPR: interestRateAPR!,
    termMonths: Math.max(1, Math.round(termMonths!)),
    insuranceMonthly: insuranceMonthly!,
    registrationAnnual: registrationAnnual!,
    maintenanceMonthly: maintenanceMonthly!,
    oneTimeFees: oneTimeFees!,
  };
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
