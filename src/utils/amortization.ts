export function monthlyPayment(
  principal: number,
  annualRate: number,
  nMonths: number,
): number {
  const r = annualRate / 12;
  if (r === 0) return principal / nMonths;
  return (principal * r) / (1 - Math.pow(1 + r, -nMonths));
}

export interface AmortizationRow {
  interest: number;
  principal: number;
  balance: number;
  pmt: number;
  month: number;
}

export function buildAmortization(
  principal: number,
  annualRate: number,
  nMonths: number,
): AmortizationRow[] {
  const r = annualRate / 12;
  const pmt = monthlyPayment(principal, annualRate, nMonths);
  let balance = principal;
  const rows: AmortizationRow[] = [];

  for (let m = 1; m <= nMonths; m++) {
    const interest = r * balance;
    const principalPaid = Math.min(pmt - interest, balance);
    balance = Math.max(0, balance - principalPaid);
    rows.push({ interest, principal: principalPaid, balance, pmt, month: m });
    if (balance <= 0) break;
  }

  return rows;
}
