import { VehicleItem } from "../types";
import { AmortizationRow, buildAmortization } from "../utils/amortization";

export interface VehicleMonthlyBreakdown {
  loan: number;
  insurance: number;
  registration: number;
  maintenance: number;
}

export interface VehicleCalculation {
  salesTax: number;
  amountFinanced: number;
  schedule: AmortizationRow[];
  upfront: number;
  monthlyBreakdown: VehicleMonthlyBreakdown;
  sums: {
    interest: number;
    principal: number;
    loanPayments: number;
    insurance: number;
    registration: number;
    maintenance: number;
    totalOutlay: number;
  };
  monthlyTotalNow: number;
}

export function calcVehicle(
  item: VehicleItem,
  analysisYears: number,
): VehicleCalculation {
  const taxableBase = Math.max(0, item.purchasePrice - item.tradeInValue);
  const salesTax = (item.salesTaxRate / 100) * taxableBase;

  const upfront =
    item.oneTimeFees +
    (item.rollTaxIntoLoan ? 0 : salesTax) +
    item.downPaymentAmount;

  const amountFinanced = Math.max(
    0,
    item.purchasePrice -
      item.downPaymentAmount -
      item.tradeInValue +
      (item.rollTaxIntoLoan ? salesTax : 0),
  );
  const nMonths = item.termMonths;
  const schedule = buildAmortization(
    amountFinanced,
    item.interestRateAPR / 100,
    nMonths,
  );

  const horizonMonths = Math.round(Math.min(nMonths, analysisYears * 12));
  let sumInterest = 0;
  let sumPrincipal = 0;
  let sumLoanPmts = 0;
  for (let i = 0; i < horizonMonths && i < schedule.length; i++) {
    const row = schedule[i];
    sumInterest += row.interest;
    sumPrincipal += row.principal;
    sumLoanPmts += row.pmt;
  }

  const insurance = item.insuranceMonthly * horizonMonths;
  const registration = (item.registrationAnnual / 12) * horizonMonths;
  const maintenance = item.maintenanceMonthly * horizonMonths;

  const monthlyBreakdown: VehicleMonthlyBreakdown = {
    loan: schedule[0]?.pmt || 0,
    insurance: item.insuranceMonthly,
    registration: item.registrationAnnual / 12,
    maintenance: item.maintenanceMonthly,
  };

  const monthlyTotalNow =
    (schedule[0]?.pmt || 0) +
    item.insuranceMonthly +
    item.registrationAnnual / 12 +
    item.maintenanceMonthly;

  return {
    salesTax,
    amountFinanced,
    schedule,
    upfront,
    monthlyBreakdown,
    sums: {
      interest: sumInterest,
      principal: sumPrincipal,
      loanPayments: sumLoanPmts,
      insurance,
      registration,
      maintenance,
      totalOutlay:
        sumLoanPmts + insurance + registration + maintenance + upfront,
    },
    monthlyTotalNow,
  };
}
