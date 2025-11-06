import { describe, expect, it } from "vitest";

import { VehicleItem } from "../types";
import { calcVehicle } from "./vehicle";

function buildVehicle(overrides: Partial<VehicleItem> = {}): VehicleItem {
  return {
    id: "veh-1",
    type: "vehicle",
    name: "Test Vehicle",
    purchasePrice: 40000,
    downPaymentAmount: 5000,
    tradeInValue: 2000,
    salesTaxRate: 8,
    rollTaxIntoLoan: false,
    interestRateAPR: 4.5,
    termMonths: 60,
    insuranceMonthly: 120,
    registrationAnnual: 240,
    maintenanceMonthly: 80,
    oneTimeFees: 600,
    ...overrides,
  };
}

describe("calcVehicle", () => {
  it("keeps sales tax upfront when it is not rolled into the loan", () => {
    const item = buildVehicle();
    const analysisYears = 4;
    const result = calcVehicle(item, analysisYears);

    const taxableBase = Math.max(0, item.purchasePrice - item.tradeInValue);
    const expectedSalesTax = (item.salesTaxRate / 100) * taxableBase;
    expect(result.salesTax).toBeCloseTo(expectedSalesTax, 6);

    expect(result.amountFinanced).toBeCloseTo(
      Math.max(
        0,
        item.purchasePrice - item.downPaymentAmount - item.tradeInValue,
      ),
      6,
    );

    const expectedUpfront =
      item.oneTimeFees + expectedSalesTax + item.downPaymentAmount;
    expect(result.upfront).toBeCloseTo(expectedUpfront, 6);

    const horizonMonths = Math.round(
      Math.min(item.termMonths, analysisYears * 12),
    );
    const expectedLoanPayments = result.schedule
      .slice(0, horizonMonths)
      .reduce((sum, row) => sum + row.pmt, 0);
    expect(result.sums.loanPayments).toBeCloseTo(expectedLoanPayments, 4);

    const insurance = item.insuranceMonthly * horizonMonths;
    const registration = (item.registrationAnnual / 12) * horizonMonths;
    const maintenance = item.maintenanceMonthly * horizonMonths;

    expect(result.sums.insurance).toBeCloseTo(insurance, 6);
    expect(result.sums.registration).toBeCloseTo(registration, 6);
    expect(result.sums.maintenance).toBeCloseTo(maintenance, 6);

    const monthlyTotal = Object.values(result.monthlyBreakdown).reduce(
      (sum, value) => sum + value,
      0,
    );
    expect(result.monthlyTotalNow).toBeCloseTo(monthlyTotal, 6);

    const firstPayment = result.schedule[0]?.pmt ?? 0;
    expect(result.monthlyBreakdown.loan).toBeCloseTo(firstPayment, 6);

    expect(result.sums.totalOutlay).toBeCloseTo(
      result.sums.loanPayments +
        result.sums.insurance +
        result.sums.registration +
        result.sums.maintenance +
        result.upfront,
      4,
    );
  });

  it("rolls sales tax into the financed amount when requested", () => {
    const item = buildVehicle({ rollTaxIntoLoan: true });
    const analysisYears = 3;
    const result = calcVehicle(item, analysisYears);

    const taxableBase = Math.max(0, item.purchasePrice - item.tradeInValue);
    const expectedSalesTax = (item.salesTaxRate / 100) * taxableBase;
    expect(result.salesTax).toBeCloseTo(expectedSalesTax, 6);

    expect(result.amountFinanced).toBeCloseTo(
      Math.max(
        0,
        item.purchasePrice -
          item.downPaymentAmount -
          item.tradeInValue +
          expectedSalesTax,
      ),
      6,
    );

    expect(result.upfront).toBeCloseTo(
      item.oneTimeFees + item.downPaymentAmount,
      6,
    );

    const horizonMonths = Math.round(
      Math.min(item.termMonths, analysisYears * 12),
    );
    const insurance = item.insuranceMonthly * horizonMonths;
    const registration = (item.registrationAnnual / 12) * horizonMonths;
    const maintenance = item.maintenanceMonthly * horizonMonths;
    expect(result.sums.insurance).toBeCloseTo(insurance, 6);
    expect(result.sums.registration).toBeCloseTo(registration, 6);
    expect(result.sums.maintenance).toBeCloseTo(maintenance, 6);

    const monthlyTotal = Object.values(result.monthlyBreakdown).reduce(
      (sum, value) => sum + value,
      0,
    );
    expect(result.monthlyTotalNow).toBeCloseTo(monthlyTotal, 6);

    const expectedLoanPayments = result.schedule
      .slice(0, horizonMonths)
      .reduce((sum, row) => sum + row.pmt, 0);
    expect(result.sums.loanPayments).toBeCloseTo(expectedLoanPayments, 4);

    expect(result.sums.totalOutlay).toBeCloseTo(
      result.sums.loanPayments +
        result.sums.insurance +
        result.sums.registration +
        result.sums.maintenance +
        result.upfront,
      4,
    );
  });
});
