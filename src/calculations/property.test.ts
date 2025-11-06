import { describe, expect, it } from "vitest";

import { PropertyItem } from "../types";
import { calcProperty } from "./property";

function buildProperty(overrides: Partial<PropertyItem> = {}): PropertyItem {
  return {
    id: "prop-1",
    type: "property",
    name: "Test Property",
    purchasePrice: 200000,
    downPaymentAmount: 20000,
    interestRateAPR: 4.25,
    termYears: 30,
    propertyTaxRate: 1.1,
    insuranceAnnual: 1200,
    hoaMonthly: 50,
    maintenancePctAnnual: 1.2,
    pmiAnnualRate: 0.9,
    pmiLTVCancel: 0.78,
    closingCostsPct: 2.0,
    closingCostsFixed: 1500,
    pointsPct: 0.75,
    originationPct: 0.5,
    lenderCredits: 750,
    ...overrides,
  };
}

describe("calcProperty", () => {
  it("tracks PMI until the cancel month and aggregates totals correctly", () => {
    const item = buildProperty();
    const analysisYears = 5;
    const result = calcProperty(item, analysisYears);

    const loanAmount = item.purchasePrice - item.downPaymentAmount;
    expect(result.loanAmount).toBeCloseTo(loanAmount, 6);
    expect(result.pmiMonthly).toBeCloseTo(
      ((item.pmiAnnualRate / 100) * loanAmount) / 12,
      6,
    );

    const horizonMonths = Math.round(
      Math.min(item.termYears * 12, analysisYears * 12),
    );
    const taxMonthly = ((item.propertyTaxRate / 100) * item.purchasePrice) / 12;
    const insuranceMonthly = item.insuranceAnnual / 12;
    const maintenanceMonthly =
      ((item.maintenancePctAnnual / 100) * item.purchasePrice) / 12;
    const recurringMonthly =
      taxMonthly + insuranceMonthly + item.hoaMonthly + maintenanceMonthly;

    expect(result.sums.recurringNonMortgage).toBeCloseTo(
      recurringMonthly * horizonMonths,
      4,
    );

    const expectedUpfront =
      (item.closingCostsPct / 100) * item.purchasePrice +
      item.closingCostsFixed +
      (item.pointsPct / 100) * loanAmount +
      (item.originationPct / 100) * loanAmount -
      item.lenderCredits;
    expect(result.upfront).toBeCloseTo(expectedUpfront, 4);

    const expectedPmiMonths = Math.min(result.cancelMonth, horizonMonths);
    expect(result.sums.pmi).toBeCloseTo(
      result.pmiMonthly * expectedPmiMonths,
      4,
    );

    const monthlyTotal = Object.values(result.monthlyBreakdown).reduce(
      (sum, value) => sum + value,
      0,
    );
    expect(result.monthlyTotalNow).toBeCloseTo(monthlyTotal, 6);

    const cancelRow = result.schedule.find(
      (row) => row.month === result.cancelMonth,
    );
    expect(cancelRow).toBeDefined();
    if (cancelRow) {
      expect(cancelRow.balance / item.purchasePrice).toBeLessThanOrEqual(
        item.pmiLTVCancel + 1e-6,
      );
    }

    const previousRow = result.schedule.find(
      (row) => row.month === result.cancelMonth - 1,
    );
    if (previousRow) {
      expect(previousRow.balance / item.purchasePrice).toBeGreaterThan(
        item.pmiLTVCancel - 1e-6,
      );
    }

    expect(result.sums.totalOutlay).toBeCloseTo(
      result.sums.mortgagePayments +
        result.sums.recurringNonMortgage +
        result.sums.pmi +
        result.upfront,
      4,
    );
  });

  it("omits PMI when the initial loan-to-value is already below the cutoff", () => {
    const item = buildProperty({
      downPaymentAmount: 120000,
      pmiAnnualRate: 0.8,
      pmiLTVCancel: 0.8,
    });
    const result = calcProperty(item, 3);

    expect(result.pmiMonthly).toBe(0);
    expect(result.cancelMonth).toBe(0);
    expect(result.monthlyBreakdown.pmi).toBe(0);
    expect(result.sums.pmi).toBe(0);

    const monthlyTotal = Object.values(result.monthlyBreakdown).reduce(
      (sum, value) => sum + value,
      0,
    );
    expect(result.monthlyTotalNow).toBeCloseTo(monthlyTotal, 6);
  });
});
