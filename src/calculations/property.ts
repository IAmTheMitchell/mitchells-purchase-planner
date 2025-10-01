import { PropertyItem } from "../types";
import { AmortizationRow, buildAmortization } from "../utils/amortization";

export interface PropertyMonthlyBreakdown {
  mortgage: number;
  pmi: number;
  taxes: number;
  insurance: number;
  hoa: number;
  maintenance: number;
}

export interface PropertyCalculation {
  loanAmount: number;
  nMonths: number;
  schedule: AmortizationRow[];
  cancelMonth: number;
  pmiMonthly: number;
  monthlyBreakdown: PropertyMonthlyBreakdown;
  upfront: number;
  sums: {
    interest: number;
    principal: number;
    mortgagePayments: number;
    recurringNonMortgage: number;
    pmi: number;
    totalOutlay: number;
  };
  monthlyTotalNow: number;
}

export function calcProperty(item: PropertyItem, analysisYears: number): PropertyCalculation {
  const loanAmount = Math.max(0, item.purchasePrice - item.downPaymentAmount);
  const nMonths = Math.round(item.termYears * 12);
  const schedule = buildAmortization(loanAmount, item.interestRateAPR / 100, nMonths);

  const pmiMonthlyRaw = (item.pmiAnnualRate / 100) * loanAmount / 12;
  const initialLtv = item.purchasePrice > 0 ? loanAmount / item.purchasePrice : 0;
  const hasPMI = pmiMonthlyRaw > 0 && initialLtv > item.pmiLTVCancel;
  const cancelMonth = hasPMI
    ? schedule.find((row) => row.balance / item.purchasePrice <= item.pmiLTVCancel)?.month ?? nMonths
    : 0;

  const taxMonthly = (item.propertyTaxRate / 100) * item.purchasePrice / 12;
  const insuranceMonthly = item.insuranceAnnual / 12;
  const hoaMonthly = item.hoaMonthly;
  const maintenanceMonthly = (item.maintenancePctAnnual / 100) * item.purchasePrice / 12;

  const closingPctAmount = (item.closingCostsPct / 100) * item.purchasePrice;
  const pointsAmount = (item.pointsPct / 100) * loanAmount;
  const originationAmount = (item.originationPct / 100) * loanAmount;
  const upfront = closingPctAmount + item.closingCostsFixed + pointsAmount + originationAmount - item.lenderCredits;

  const horizonMonths = Math.min(nMonths, Math.round(analysisYears * 12));
  let sumInterest = 0;
  let sumPrincipal = 0;
  let sumMortgagePmt = 0;
  let sumPMI = 0;

  for (let i = 0; i < horizonMonths && i < schedule.length; i++) {
    const row = schedule[i];
    sumInterest += row.interest;
    sumPrincipal += row.principal;
    sumMortgagePmt += row.pmt;
    if (hasPMI && row.month <= cancelMonth) sumPMI += pmiMonthlyRaw;
  }

  const recurringMonthlyNow =
    (schedule[0]?.pmt || 0) +
    taxMonthly +
    insuranceMonthly +
    hoaMonthly +
    maintenanceMonthly +
    (hasPMI && cancelMonth >= 1 ? pmiMonthlyRaw : 0);

  const monthlyBreakdown: PropertyMonthlyBreakdown = {
    mortgage: schedule[0]?.pmt || 0,
    pmi: hasPMI ? pmiMonthlyRaw : 0,
    taxes: taxMonthly,
    insurance: insuranceMonthly,
    hoa: hoaMonthly,
    maintenance: maintenanceMonthly,
  };

  const horizonRecurring = (taxMonthly + insuranceMonthly + hoaMonthly + maintenanceMonthly) * horizonMonths + sumPMI;

  return {
    loanAmount,
    nMonths,
    schedule,
    cancelMonth,
    pmiMonthly: hasPMI ? pmiMonthlyRaw : 0,
    monthlyBreakdown,
    upfront,
    sums: {
      interest: sumInterest,
      principal: sumPrincipal,
      mortgagePayments: sumMortgagePmt,
      recurringNonMortgage: (taxMonthly + insuranceMonthly + hoaMonthly + maintenanceMonthly) * horizonMonths,
      pmi: sumPMI,
      totalOutlay: sumMortgagePmt + horizonRecurring + upfront,
    },
    monthlyTotalNow: recurringMonthlyNow,
  };
}
