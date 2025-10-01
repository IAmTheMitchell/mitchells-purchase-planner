import { v4 as uuidv4 } from "uuid";
import { PropertyItem, VehicleItem, Scenario } from "./types";

export function newProperty(): PropertyItem {
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
    pmiLTVCancel: 0.8,
    closingCostsPct: 2.5,
    closingCostsFixed: 1500,
    pointsPct: 0,
    originationPct: 0.5,
    lenderCredits: 0,
  };
}

export function newVehicle(): VehicleItem {
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

export function newScenario(): Scenario {
  return {
    id: uuidv4(),
    name: "My Scenario",
    analysisYears: 5,
    items: [],
  };
}
