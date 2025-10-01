import React, { useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Plus, Save, Trash2, Copy, Pencil, BarChart3, Calculator, FolderOpen, FilePlus2, Layers, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ---------- Types ----------

type ItemType = "property" | "vehicle";

type BaseItem = {
  id: string;
  name: string;
  type: ItemType;
};

// Property-specific inputs
interface PropertyItem extends BaseItem {
  type: "property";
  purchasePrice: number; // total price
  downPaymentAmount: number; // absolute amount
  interestRateAPR: number; // % APR
  termYears: number; // years
  propertyTaxRate: number; // % of value annually
  insuranceAnnual: number; // $/yr homeowners
  hoaMonthly: number; // $/mo
  maintenancePctAnnual: number; // % of value annually
  pmiAnnualRate: number; // % of ORIGINAL loan per year while PMI applies
  pmiLTVCancel: number; // e.g. 0.80 (80%)
  closingCostsPct: number; // % of purchase price, one-time
  closingCostsFixed: number; // $ fixed add-on (inspection, appraisal, etc.)
  pointsPct: number; // % of loan amount, upfront
  originationPct: number; // % of loan amount, upfront
  lenderCredits: number; // negative upfront cost (enter positive $ to subtract)
}

// Vehicle-specific inputs
interface VehicleItem extends BaseItem {
  type: "vehicle";
  purchasePrice: number;
  downPaymentAmount: number; // absolute amount
  tradeInValue: number; // reduces taxable amount
  salesTaxRate: number; // % of taxable amount
  rollTaxIntoLoan: boolean;
  interestRateAPR: number; // % APR
  termMonths: number; // months
  insuranceMonthly: number; // $/mo
  registrationAnnual: number; // $/yr
  maintenanceMonthly: number; // $/mo
  oneTimeFees: number; // doc/title/etc upfront (can be rolled if desired, but we keep upfront here)
}

export type Scenario = {
  id: string;
  name: string;
  analysisYears: number; // horizon for totals and comparisons
  items: Array<PropertyItem | VehicleItem>;
};

// ---------- Utility helpers ----------

function currency(n: number): string {
  if (!isFinite(n)) return "-";
  return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function currencyPrecise(n: number): string {
  if (!isFinite(n)) return "-";
  return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 });
}

function pct(n: number): string {
  return `${(n * 100).toFixed(2)}%`;
}

// Standard loan payment (amortizing) monthly payment
function monthlyPayment(principal: number, annualRate: number, nMonths: number): number {
  const r = annualRate / 12;
  if (r === 0) return principal / nMonths;
  return (principal * r) / (1 - Math.pow(1 + r, -nMonths));
}

// Amortization schedule returning remaining balance per month
function buildAmortization(principal: number, annualRate: number, nMonths: number): { interest: number; principal: number; balance: number; pmt: number; month: number; }[] {
  const r = annualRate / 12;
  const pmt = monthlyPayment(principal, annualRate, nMonths);
  let balance = principal;
  const rows = [] as { interest: number; principal: number; balance: number; pmt: number; month: number; }[];
  for (let m = 1; m <= nMonths; m++) {
    const interest = r * balance;
    const principalPaid = Math.min(pmt - interest, balance);
    balance = Math.max(0, balance - principalPaid);
    rows.push({ interest, principal: principalPaid, balance, pmt, month: m });
    if (balance <= 0) break;
  }
  return rows;
}

// ---------- Calculators ----------

function calcProperty(item: PropertyItem, analysisYears: number) {
  const loanAmount = Math.max(0, item.purchasePrice - item.downPaymentAmount);
  const nMonths = Math.round(item.termYears * 12);
  const schedule = buildAmortization(loanAmount, item.interestRateAPR / 100, nMonths);

  // PMI logic: PMI charged monthly on original loan amount until LTV <= pmiLTVCancel
  // LTV = current balance / original value
  const pmiMonthlyRaw = (item.pmiAnnualRate / 100) * loanAmount / 12; // based on original loan
  const initialLtv = item.purchasePrice > 0 ? loanAmount / item.purchasePrice : 0;
  const hasPMI = pmiMonthlyRaw > 0 && initialLtv > item.pmiLTVCancel;
  const cancelMonth = hasPMI
    ? schedule.find((row) => row.balance / item.purchasePrice <= item.pmiLTVCancel)?.month ?? nMonths
    : 0;

  // Recurring monthly charges
  const taxMonthly = (item.propertyTaxRate / 100) * item.purchasePrice / 12;
  const insuranceMonthly = item.insuranceAnnual / 12;
  const hoaMonthly = item.hoaMonthly;
  const maintenanceMonthly = (item.maintenancePctAnnual / 100) * item.purchasePrice / 12;

  // Upfront costs
  const closingPctAmount = (item.closingCostsPct / 100) * item.purchasePrice;
  const pointsAmount = (item.pointsPct / 100) * loanAmount;
  const originationAmount = (item.originationPct / 100) * loanAmount;
  const upfront = closingPctAmount + item.closingCostsFixed + pointsAmount + originationAmount - item.lenderCredits;

  // Horizon sums
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

  const recurringMonthlyNow = (schedule[0]?.pmt || 0) + taxMonthly + insuranceMonthly + hoaMonthly + maintenanceMonthly + (hasPMI && cancelMonth >= 1 ? pmiMonthlyRaw : 0);

  const monthlyBreakdown = {
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

function calcVehicle(item: VehicleItem, analysisYears: number) {
  const taxableBase = Math.max(0, item.purchasePrice - item.tradeInValue);
  const salesTax = (item.salesTaxRate / 100) * taxableBase;

  const upfront = item.oneTimeFees + (item.rollTaxIntoLoan ? 0 : salesTax) + item.downPaymentAmount;

  const amountFinanced = Math.max(0, item.purchasePrice - item.downPaymentAmount - item.tradeInValue + (item.rollTaxIntoLoan ? salesTax : 0));
  const nMonths = item.termMonths;
  const schedule = buildAmortization(amountFinanced, item.interestRateAPR / 100, nMonths);

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

  const monthlyBreakdown = {
    loan: schedule[0]?.pmt || 0,
    insurance: item.insuranceMonthly,
    registration: item.registrationAnnual / 12,
    maintenance: item.maintenanceMonthly,
  };

  const monthlyTotalNow = (schedule[0]?.pmt || 0) + item.insuranceMonthly + item.registrationAnnual / 12 + item.maintenanceMonthly;

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
      totalOutlay: sumLoanPmts + insurance + registration + maintenance + upfront,
    },
    monthlyTotalNow,
  };
}

// ---------- Default factories ----------

function newProperty(): PropertyItem {
  return {
    id: uuidv4(),
    type: "property",
    name: "New Property",
    purchasePrice: 500000,
    downPaymentAmount: 100000,
    interestRateAPR: 6.5,
    termYears: 30,
    propertyTaxRate: 1.2,
    insuranceAnnual: 1800,
    hoaMonthly: 0,
    maintenancePctAnnual: 1.0,
    pmiAnnualRate: 0.5,
    pmiLTVCancel: 0.80,
    closingCostsPct: 2.5,
    closingCostsFixed: 1500,
    pointsPct: 0,
    originationPct: 0.5,
    lenderCredits: 0,
  };
}

function newVehicle(): VehicleItem {
  return {
    id: uuidv4(),
    type: "vehicle",
    name: "New Vehicle",
    purchasePrice: 50000,
    downPaymentAmount: 5000,
    tradeInValue: 0,
    salesTaxRate: 7.0,
    rollTaxIntoLoan: true,
    interestRateAPR: 5.5,
    termMonths: 60,
    insuranceMonthly: 150,
    registrationAnnual: 200,
    maintenanceMonthly: 75,
    oneTimeFees: 500,
  };
}

function newScenario(): Scenario {
  return {
    id: uuidv4(),
    name: "My Scenario",
    analysisYears: 5,
    items: [],
  };
}

// ---------- Local storage ----------

const LS_KEY = "future-purchase-planner.scenarios.v1";

function loadScenarios(): Scenario[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [newScenario()];
    const parsed: Scenario[] = JSON.parse(raw);
    return parsed && parsed.length > 0 ? parsed : [newScenario()];
  } catch {
    return [newScenario()];
  }
}

function saveScenarios(scenarios: Scenario[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(scenarios));
}

// ---------- UI Components ----------

function SectionCard({ title, children, icon }: { title: string; children: React.ReactNode; icon?: React.ReactNode; }) {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow p-5 border border-neutral-200 dark:border-neutral-800">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function NumberInput({ label, value, onChange, step = 1, suffix, min = 0 }: { label: string; value: number; onChange: (v: number) => void; step?: number; suffix?: string; min?: number; }) {
  return (
    <label className="flex items-center justify-between gap-4 py-1">
      <span className="text-sm text-neutral-600 dark:text-neutral-300">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="number"
          className="w-36 px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950"
          step={step}
          min={min}
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(parseFloat(e.target.value || "0"))}
        />
        {suffix && <span className="text-sm text-neutral-500">{suffix}</span>}
      </div>
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void; }) {
  return (
    <label className="flex items-center justify-between gap-4 py-1">
      <span className="text-sm text-neutral-600 dark:text-neutral-300">{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

function Row({ label, value }: { label: string; value: string; }) {
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className="text-neutral-600 dark:text-neutral-300">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

// Item editor modal
function ItemEditor({ item, onSave, onClose }: { item: PropertyItem | VehicleItem; onSave: (item: PropertyItem | VehicleItem) => void; onClose: () => void; }) {
  const [draft, setDraft] = useState<PropertyItem | VehicleItem>({ ...item });
  const isProperty = draft.type === "property";

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-950 w-full max-w-3xl rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            <h3 className="text-lg font-semibold">Edit Item: {draft.name}</h3>
          </div>
          <button className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-lg" onClick={onClose}><X className="w-5 h-5"/></button>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-neutral-600 dark:text-neutral-300">Name</span>
            <input className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </label>

          {isProperty ? (
            <>
              <NumberInput label="Purchase price" value={(draft as PropertyItem).purchasePrice} onChange={(v) => setDraft({ ...draft, purchasePrice: v } as PropertyItem)} suffix="$" step={1000} />
              <NumberInput label="Down payment" value={(draft as PropertyItem).downPaymentAmount} onChange={(v) => setDraft({ ...draft, downPaymentAmount: v } as PropertyItem)} suffix="$" step={1000} />
              <NumberInput label="Interest rate (APR)" value={(draft as PropertyItem).interestRateAPR} onChange={(v) => setDraft({ ...draft, interestRateAPR: v } as PropertyItem)} suffix="%" step={0.01} />
              <NumberInput label="Loan term" value={(draft as PropertyItem).termYears} onChange={(v) => setDraft({ ...draft, termYears: v } as PropertyItem)} suffix="years" step={1} />
              <NumberInput label="Property tax rate" value={(draft as PropertyItem).propertyTaxRate} onChange={(v) => setDraft({ ...draft, propertyTaxRate: v } as PropertyItem)} suffix="%/yr" step={0.01} />
              <NumberInput label="Home insurance" value={(draft as PropertyItem).insuranceAnnual} onChange={(v) => setDraft({ ...draft, insuranceAnnual: v } as PropertyItem)} suffix="$ / yr" step={50} />
              <NumberInput label="HOA dues" value={(draft as PropertyItem).hoaMonthly} onChange={(v) => setDraft({ ...draft, hoaMonthly: v } as PropertyItem)} suffix="$ / mo" step={10} />
              <NumberInput label="Maintenance" value={(draft as PropertyItem).maintenancePctAnnual} onChange={(v) => setDraft({ ...draft, maintenancePctAnnual: v } as PropertyItem)} suffix="% of value / yr" step={0.1} />
              <NumberInput label="PMI annual rate" value={(draft as PropertyItem).pmiAnnualRate} onChange={(v) => setDraft({ ...draft, pmiAnnualRate: v } as PropertyItem)} suffix="%" step={0.01} />
              <NumberInput label="PMI cancel LTV" value={(draft as PropertyItem).pmiLTVCancel * 100} onChange={(v) => setDraft({ ...draft, pmiLTVCancel: v / 100 } as PropertyItem)} suffix="%" step={1} />
              <NumberInput label="Closing costs (pct)" value={(draft as PropertyItem).closingCostsPct} onChange={(v) => setDraft({ ...draft, closingCostsPct: v } as PropertyItem)} suffix="% of price" step={0.1} />
              <NumberInput label="Closing costs (fixed)" value={(draft as PropertyItem).closingCostsFixed} onChange={(v) => setDraft({ ...draft, closingCostsFixed: v } as PropertyItem)} suffix="$" step={100} />
              <NumberInput label="Points" value={(draft as PropertyItem).pointsPct} onChange={(v) => setDraft({ ...draft, pointsPct: v } as PropertyItem)} suffix="% of loan" step={0.125} />
              <NumberInput label="Origination fee" value={(draft as PropertyItem).originationPct} onChange={(v) => setDraft({ ...draft, originationPct: v } as PropertyItem)} suffix="% of loan" step={0.1} />
              <NumberInput label="Lender credits" value={(draft as PropertyItem).lenderCredits} onChange={(v) => setDraft({ ...draft, lenderCredits: v } as PropertyItem)} suffix="$ (subtracts)" step={100} />
            </>
          ) : (
            <>
              <NumberInput label="Purchase price" value={(draft as VehicleItem).purchasePrice} onChange={(v) => setDraft({ ...draft, purchasePrice: v } as VehicleItem)} suffix="$" step={500} />
              <NumberInput label="Down payment" value={(draft as VehicleItem).downPaymentAmount} onChange={(v) => setDraft({ ...draft, downPaymentAmount: v } as VehicleItem)} suffix="$" step={250} />
              <NumberInput label="Trade-in value" value={(draft as VehicleItem).tradeInValue} onChange={(v) => setDraft({ ...draft, tradeInValue: v } as VehicleItem)} suffix="$" step={250} />
              <NumberInput label="Sales tax rate" value={(draft as VehicleItem).salesTaxRate} onChange={(v) => setDraft({ ...draft, salesTaxRate: v } as VehicleItem)} suffix="%" step={0.1} />
              <Toggle label="Roll sales tax into loan" checked={(draft as VehicleItem).rollTaxIntoLoan} onChange={(v) => setDraft({ ...draft, rollTaxIntoLoan: v } as VehicleItem)} />
              <NumberInput label="Interest rate (APR)" value={(draft as VehicleItem).interestRateAPR} onChange={(v) => setDraft({ ...draft, interestRateAPR: v } as VehicleItem)} suffix="%" step={0.01} />
              <NumberInput label="Loan term" value={(draft as VehicleItem).termMonths} onChange={(v) => setDraft({ ...draft, termMonths: v } as VehicleItem)} suffix="months" step={1} />
              <NumberInput label="Insurance" value={(draft as VehicleItem).insuranceMonthly} onChange={(v) => setDraft({ ...draft, insuranceMonthly: v } as VehicleItem)} suffix="$ / mo" step={10} />
              <NumberInput label="Registration" value={(draft as VehicleItem).registrationAnnual} onChange={(v) => setDraft({ ...draft, registrationAnnual: v } as VehicleItem)} suffix="$ / yr" step={10} />
              <NumberInput label="Maintenance" value={(draft as VehicleItem).maintenanceMonthly} onChange={(v) => setDraft({ ...draft, maintenanceMonthly: v } as VehicleItem)} suffix="$ / mo" step={10} />
              <NumberInput label="One-time fees" value={(draft as VehicleItem).oneTimeFees} onChange={(v) => setDraft({ ...draft, oneTimeFees: v } as VehicleItem)} suffix="$ upfront" step={25} />
            </>
          )}
        </div>
        <div className="flex items-center justify-end gap-2 p-4 border-t border-neutral-200 dark:border-neutral-800">
          <button className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700" onClick={onClose}>Cancel</button>
          <button className="px-3 py-2 rounded-lg bg-black text-white" onClick={() => onSave(draft)}>Save</button>
        </div>
      </div>
    </div>
  );
}

// Per-item summary card
function ItemSummary({ item, analysisYears, onEdit, onDelete }: { item: PropertyItem | VehicleItem; analysisYears: number; onEdit: () => void; onDelete: () => void; }) {
  const result = useMemo(() => item.type === "property" ? calcProperty(item, analysisYears) : calcVehicle(item, analysisYears), [item, analysisYears]);

  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 bg-neutral-50 dark:bg-neutral-950">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div>
          <div className="text-sm uppercase tracking-wide text-neutral-500">{item.type === "property" ? "Property" : "Vehicle"}</div>
          <div className="text-lg font-semibold">{item.name}</div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg border border-neutral-300 dark:border-neutral-700" onClick={onEdit}><Pencil className="w-4 h-4"/></button>
          <button className="p-2 rounded-lg border border-red-300 text-red-600" onClick={onDelete}><Trash2 className="w-4 h-4"/></button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SectionCard title="Monthly right now" icon={<BarChart3 className="w-4 h-4"/>}>
          {Object.entries(result.monthlyBreakdown).map(([k, v]) => (
            <Row key={k} label={k.toUpperCase()} value={currencyPrecise(v)} />
          ))}
          <div className="border-t my-2" />
          <Row label="TOTAL / mo" value={currencyPrecise(result.monthlyTotalNow)} />
          {item.type === "property" && (
            <Row label="PMI ends (month)" value={(result as any).cancelMonth.toString()} />
          )}
        </SectionCard>

        <SectionCard title={`Upfront costs`} icon={<FilePlus2 className="w-4 h-4"/>}>
          {item.type === "property" ? (
            <>
              <Row label="Closing + fixed + points + origination - credits" value={currencyPrecise((result as any).upfront)} />
              <Row label="Down payment (separate)" value={currencyPrecise((item as PropertyItem).downPaymentAmount)} />
              <div className="border-t my-2" />
              <Row label="TOTAL upfront (incl. down)" value={currencyPrecise((result as any).upfront + (item as PropertyItem).downPaymentAmount)} />
            </>
          ) : (
            <>
              <Row label="Down payment + fees + (tax if not rolled)" value={currencyPrecise((result as any).upfront)} />
              <Row label="Sales tax (total)" value={currencyPrecise((result as any).salesTax)} />
            </>
          )}
        </SectionCard>

        <SectionCard title={`Totals over ${analysisYears} years`} icon={<Layers className="w-4 h-4"/>}>
          {item.type === "property" ? (
            <>
              <Row label="Mortgage payments" value={currencyPrecise((result as any).sums.mortgagePayments)} />
              <Row label="Interest (subset above)" value={currencyPrecise((result as any).sums.interest)} />
              <Row label="Taxes + Insurance + HOA + Maint" value={currencyPrecise((result as any).sums.recurringNonMortgage)} />
              <Row label="PMI" value={currencyPrecise((result as any).sums.pmi)} />
              <div className="border-t my-2" />
              <Row label="TOTAL outlay (excl. down)" value={currencyPrecise((result as any).sums.totalOutlay)} />
              <Row label="TOTAL outlay (incl. down)" value={currencyPrecise((result as any).sums.totalOutlay + (item as PropertyItem).downPaymentAmount)} />
            </>
          ) : (
            <>
              <Row label="Loan payments" value={currencyPrecise((result as any).sums.loanPayments)} />
              <Row label="Interest (subset above)" value={currencyPrecise((result as any).sums.interest)} />
              <Row label="Insurance + Reg + Maint" value={currencyPrecise((result as any).sums.insurance + (result as any).sums.registration + (result as any).sums.maintenance)} />
              <div className="border-t my-2" />
              <Row label="TOTAL outlay (incl. upfront)" value={currencyPrecise((result as any).sums.totalOutlay)} />
            </>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

function ScenarioHeader({ scenario, onRename, onAnalysisYears }: { scenario: Scenario; onRename: (name: string) => void; onAnalysisYears: (y: number) => void; }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
      <div className="flex items-center gap-2">
        <FolderOpen className="w-5 h-5"/>
        <input className="text-2xl font-bold bg-transparent border-b border-transparent focus:border-neutral-400 outline-none" value={scenario.name} onChange={(e) => onRename(e.target.value)} />
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-neutral-600">Analysis horizon:</span>
          <input type="number" className="w-20 px-2 py-1 rounded-lg border border-neutral-300" min={1} value={scenario.analysisYears} onChange={(e) => onAnalysisYears(parseInt(e.target.value || "1", 10))} />
          <span>years</span>
        </div>
      </div>
    </div>
  );
}

// Scenario compare panel
function ComparePanel({ scenarios, selectedIds }: { scenarios: Scenario[]; selectedIds: string[]; }) {
  const selected = scenarios.filter(s => selectedIds.includes(s.id));

  const rows = useMemo(() => {
    // compute per-scenario totals and monthly
    return selected.map(s => {
      let monthlyNow = 0;
      let upfrontTotal = 0;
      let totalOutlay = 0;
      s.items.forEach(item => {
        if (item.type === "property") {
          const r = calcProperty(item, s.analysisYears);
          monthlyNow += r.monthlyTotalNow;
          upfrontTotal += r.upfront + item.downPaymentAmount;
          totalOutlay += r.sums.totalOutlay + item.downPaymentAmount; // include down for comparison
        } else {
          const r = calcVehicle(item, s.analysisYears);
          monthlyNow += r.monthlyTotalNow;
          upfrontTotal += r.upfront;
          totalOutlay += r.sums.totalOutlay;
        }
      });
      return { id: s.id, name: s.name, horizon: s.analysisYears, monthlyNow, upfrontTotal, totalOutlay };
    });
  }, [selected]);

  if (selected.length === 0) return null;

  return (
    <SectionCard title="Scenario comparison" icon={<BarChart3 className="w-4 h-4"/>}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2">Scenario</th>
              {rows.map(r => (<th key={r.id} className="py-2">{r.name}</th>))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="py-2">Analysis horizon (years)</td>
              {rows.map(r => (<td key={r.id}>{r.horizon}</td>))}
            </tr>
            <tr className="border-b">
              <td className="py-2">Monthly total now</td>
              {rows.map(r => (<td key={r.id}>{currencyPrecise(r.monthlyNow)}</td>))}
            </tr>
            <tr className="border-b">
              <td className="py-2">Upfront total</td>
              {rows.map(r => (<td key={r.id}>{currencyPrecise(r.upfrontTotal)}</td>))}
            </tr>
            <tr>
              <td className="py-2">Total outlay over horizon</td>
              {rows.map(r => (<td key={r.id}>{currencyPrecise(r.totalOutlay)}</td>))}
            </tr>
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

export default function App() {
  const [scenarios, setScenarios] = useState<Scenario[]>(loadScenarios());
  const [currentId, setCurrentId] = useState<string>(scenarios[0]?.id);
  const [editingItem, setEditingItem] = useState<PropertyItem | VehicleItem | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const current = scenarios.find(s => s.id === currentId)!;

  useEffect(() => { saveScenarios(scenarios); }, [scenarios]);

  function updateCurrent(updater: (s: Scenario) => Scenario) {
    setScenarios(prev => prev.map(s => s.id === currentId ? updater({ ...s }) : s));
  }

  function addItem(type: ItemType) {
    const item = type === "property" ? newProperty() : newVehicle();
    updateCurrent((s) => ({ ...s, items: [...s.items, item] }));
    setEditingItem(item);
  }

  function duplicateScenario(id: string) {
    const src = scenarios.find(s => s.id === id);
    if (!src) return;
    const copy: Scenario = { ...src, id: uuidv4(), name: src.name + " (copy)" };
    setScenarios([...scenarios, copy]);
    setCurrentId(copy.id);
  }

  function removeScenario(id: string) {
    const next = scenarios.filter(s => s.id !== id);
    const prunedCompareIds = compareIds.filter(cid => cid !== id);

    if (!next.length) {
      const replacement = newScenario();
      setScenarios([replacement]);
      setCurrentId(replacement.id);
      setCompareIds([]);
      return;
    }

    setScenarios(next);
    if (currentId === id) setCurrentId(next[0].id);
    setCompareIds(prunedCompareIds);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900 text-neutral-900 dark:text-neutral-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="p-2 bg-black text-white rounded-2xl shadow">
              <Calculator className="w-6 h-6"/>
            </motion.div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Future Purchase Cost Planner</h1>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Model properties & vehicles, save scenarios, and compare side by side.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700" onClick={() => { const s = newScenario(); setScenarios([...scenarios, s]); setCurrentId(s.id); }}>
              <FilePlus2 className="inline w-4 h-4 mr-1"/> New scenario
            </button>
            <button className="px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700" onClick={() => duplicateScenario(currentId)}>
              <Copy className="inline w-4 h-4 mr-1"/> Duplicate
            </button>
            <button className="px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-red-600" onClick={() => removeScenario(currentId)}>
              <Trash2 className="inline w-4 h-4 mr-1"/> Delete
            </button>
          </div>
        </header>

        {/* Scenario selector & compare picker */}
        <SectionCard title="Scenarios" icon={<Layers className="w-4 h-4"/>}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-600">Current:</span>
              <select className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950" value={currentId} onChange={(e) => setCurrentId(e.target.value)}>
                {scenarios.map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-600">Compare:</span>
              <select className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950" multiple value={compareIds} onChange={(e) => setCompareIds(Array.from(e.target.selectedOptions).map(o => o.value))}>
                {scenarios.map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
              </select>
            </div>
            <div className="text-sm text-neutral-500">Hold Ctrl / Cmd to select multiple scenarios to compare.</div>
          </div>
        </SectionCard>

        <div className="my-6" />

        {/* Current scenario */}
        <SectionCard title="Scenario" icon={<FolderOpen className="w-4 h-4"/>}>
          <ScenarioHeader
            scenario={current}
            onRename={(name) => updateCurrent(s => ({ ...s, name }))}
            onAnalysisYears={(y) => updateCurrent(s => ({ ...s, analysisYears: Math.max(1, y) }))}
          />

          <div className="my-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex gap-2">
              <button className="px-3 py-2 rounded-xl bg-black text-white" onClick={() => addItem("property")}>
                <Plus className="inline w-4 h-4 mr-1"/> Add property
              </button>
              <button className="px-3 py-2 rounded-xl bg-black text-white" onClick={() => addItem("vehicle")}>
                <Plus className="inline w-4 h-4 mr-1"/> Add vehicle
              </button>
            </div>
          </div>

          {current.items.length === 0 ? (
            <div className="text-sm text-neutral-600">No items yet. Add a property or vehicle to begin.</div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {current.items.map((it) => (
                <ItemSummary
                  key={it.id}
                  item={it}
                  analysisYears={current.analysisYears}
                  onEdit={() => setEditingItem(it)}
                  onDelete={() => updateCurrent(s => ({ ...s, items: s.items.filter(x => x.id !== it.id) }))}
                />
              ))}
            </div>
          )}
        </SectionCard>

        <div className="my-6" />

        <ComparePanel scenarios={scenarios} selectedIds={compareIds} />

        <footer className="mt-10 text-xs text-neutral-500">
          <p>
            Notes: Property monthly totals include mortgage payment, PMI (until cancellation), taxes, insurance, HOA, and maintenance.
            Upfront totals include down payment, closing costs (percent + fixed), points, origination, minus lender credits.
            Vehicle monthly totals include loan payment, insurance, registration (prorated monthly), and maintenance. Upfront totals include down payment, fees, and tax if not rolled into the loan.
          </p>
        </footer>
      </div>

      <AnimatePresence>
        {editingItem && (
          <ItemEditor
            item={editingItem}
            onSave={(updated) => {
              updateCurrent(s => ({ ...s, items: s.items.map(it => it.id === updated.id ? updated : it) }));
              setEditingItem(null);
            }}
            onClose={() => setEditingItem(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
