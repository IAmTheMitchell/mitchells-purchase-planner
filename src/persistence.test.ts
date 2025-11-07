import { describe, expect, it } from "vitest";

import { parseScenarios, serializeScenarios } from "./persistence";
import type { Scenario } from "./types";

const sampleScenario: Scenario = {
  id: "scenario-1",
  name: "Primary Scenario",
  analysisYears: 5,
  items: [
    {
      id: "property-1",
      name: "Starter Home",
      type: "property",
      purchasePrice: 350000,
      downPaymentAmount: 70000,
      interestRateAPR: 5.25,
      termYears: 30,
      propertyTaxRate: 1.1,
      insuranceAnnual: 1400,
      hoaMonthly: 150,
      maintenancePctAnnual: 1.2,
      pmiAnnualRate: 0.4,
      pmiLTVCancel: 0.78,
      closingCostsPct: 2.0,
      closingCostsFixed: 2000,
      pointsPct: 0,
      originationPct: 1,
      lenderCredits: 0,
    },
    {
      id: "vehicle-1",
      name: "Family SUV",
      type: "vehicle",
      purchasePrice: 42000,
      downPaymentAmount: 5000,
      tradeInValue: 2000,
      salesTaxRate: 7.5,
      rollTaxIntoLoan: true,
      interestRateAPR: 4.75,
      termMonths: 72,
      insuranceMonthly: 160,
      registrationAnnual: 180,
      maintenanceMonthly: 90,
      oneTimeFees: 600,
    },
  ],
};

describe("persistence", () => {
  it("serializes scenarios with version metadata", () => {
    const serialized = serializeScenarios([sampleScenario]);
    const parsed = JSON.parse(serialized);

    expect(parsed).toEqual({
      version: 1,
      scenarios: [sampleScenario],
    });
  });

  it("parses exports containing a payload wrapper", () => {
    const payload = JSON.stringify(
      {
        version: 1,
        scenarios: [sampleScenario],
      },
      null,
      2,
    );

    expect(parseScenarios(payload)).toEqual([sampleScenario]);
  });

  it("parses exports that are bare arrays", () => {
    const payload = JSON.stringify([sampleScenario], null, 2);
    expect(parseScenarios(payload)).toEqual([sampleScenario]);
  });

  it("rejects exports without scenario data", () => {
    expect(() => parseScenarios("{}")).toThrowError(/scenarios/i);
  });

  it("rejects exports with invalid scenarios", () => {
    const payload = JSON.stringify([
      { id: "bad", name: "Bad", analysisYears: "five", items: [] },
    ]);

    expect(() => parseScenarios(payload)).toThrowError(/valid scenarios/i);
  });

  it("normalizes numeric fields from strings and booleans during parsing", () => {
    const payload = JSON.stringify([
      {
        id: "scenario-stringy",
        name: "Stringy",
        analysisYears: "3",
        items: [
          {
            id: "property-string",
            name: "String Property",
            type: "property",
            purchasePrice: "450000",
            downPaymentAmount: "90000",
            interestRateAPR: "5.5",
            termYears: "30",
            propertyTaxRate: "1.2",
            insuranceAnnual: "1200",
            hoaMonthly: "100",
            maintenancePctAnnual: "1",
            pmiAnnualRate: "0.5",
            pmiLTVCancel: "0.78",
            closingCostsPct: "2",
            closingCostsFixed: "2500",
            pointsPct: "0.5",
            originationPct: "1",
            lenderCredits: "500",
          },
          {
            id: "vehicle-string",
            name: "String Vehicle",
            type: "vehicle",
            purchasePrice: "30000",
            downPaymentAmount: "3000",
            tradeInValue: "1000",
            salesTaxRate: "8.5",
            rollTaxIntoLoan: "true",
            interestRateAPR: "4.2",
            termMonths: "48",
            insuranceMonthly: "140",
            registrationAnnual: "200",
            maintenanceMonthly: "60",
            oneTimeFees: "400",
          },
        ],
      },
    ]);

    const parsed = parseScenarios(payload);
    expect(parsed[0].analysisYears).toBe(3);
    const property = parsed[0].items[0];
    if (property.type !== "property") throw new Error("Expected property");
    expect(property.purchasePrice).toBe(450000);
    expect(property.termYears).toBe(30);
    const vehicle = parsed[0].items[1];
    if (vehicle.type !== "vehicle") throw new Error("Expected vehicle");
    expect(vehicle.rollTaxIntoLoan).toBe(true);
    expect(vehicle.termMonths).toBe(48);
  });

  it("rejects scenarios where items fail validation", () => {
    const payload = JSON.stringify([
      {
        id: "scenario-invalid-items",
        name: "Bad Items",
        analysisYears: 5,
        items: [
          {
            id: "property-bad",
            name: "Incomplete",
            type: "property",
          },
        ],
      },
    ]);

    expect(() => parseScenarios(payload)).toThrowError(/valid scenarios/i);
  });
});
