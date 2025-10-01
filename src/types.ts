export type ItemType = "property" | "vehicle";

export type BaseItem = {
  id: string;
  name: string;
  type: ItemType;
};

export interface PropertyItem extends BaseItem {
  type: "property";
  purchasePrice: number;
  downPaymentAmount: number;
  interestRateAPR: number;
  termYears: number;
  propertyTaxRate: number;
  insuranceAnnual: number;
  hoaMonthly: number;
  maintenancePctAnnual: number;
  pmiAnnualRate: number;
  pmiLTVCancel: number;
  closingCostsPct: number;
  closingCostsFixed: number;
  pointsPct: number;
  originationPct: number;
  lenderCredits: number;
}

export interface VehicleItem extends BaseItem {
  type: "vehicle";
  purchasePrice: number;
  downPaymentAmount: number;
  tradeInValue: number;
  salesTaxRate: number;
  rollTaxIntoLoan: boolean;
  interestRateAPR: number;
  termMonths: number;
  insuranceMonthly: number;
  registrationAnnual: number;
  maintenanceMonthly: number;
  oneTimeFees: number;
}

export type Scenario = {
  id: string;
  name: string;
  analysisYears: number;
  items: Array<PropertyItem | VehicleItem>;
};
