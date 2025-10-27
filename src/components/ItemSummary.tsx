import { useMemo } from "react";
import { BarChart3, FilePlus2, Layers, Pencil, Trash2 } from "lucide-react";

import {
  calcProperty,
  calcVehicle,
  PropertyCalculation,
  VehicleCalculation,
} from "../calculations";
import { PropertyItem, VehicleItem } from "../types";
import { currencyPrecise } from "../utils/format";
import { SectionCard } from "./SectionCard";
import { Row } from "./Row";

interface ItemSummaryProps {
  item: PropertyItem | VehicleItem;
  analysisYears: number;
  onEdit: () => void;
  onDelete: () => void;
}

export function ItemSummary({
  item,
  analysisYears,
  onEdit,
  onDelete,
}: ItemSummaryProps) {
  const result = useMemo<PropertyCalculation | VehicleCalculation>(
    () =>
      item.type === "property"
        ? calcProperty(item, analysisYears)
        : calcVehicle(item, analysisYears),
    [item, analysisYears],
  );

  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 bg-neutral-50 dark:bg-neutral-950">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div>
          <div className="text-sm uppercase tracking-wide text-neutral-500">
            {item.type === "property" ? "Property" : "Vehicle"}
          </div>
          <div className="text-lg font-semibold">{item.name}</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="p-2 rounded-lg border border-neutral-300 dark:border-neutral-700"
            onClick={onEdit}
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            className="p-2 rounded-lg border border-red-300 text-red-600"
            onClick={onDelete}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SectionCard
          title="Monthly right now"
          icon={<BarChart3 className="w-4 h-4" />}
        >
          {Object.entries(result.monthlyBreakdown).map(([key, value]) => (
            <Row
              key={key}
              label={key.toUpperCase()}
              value={currencyPrecise(value)}
            />
          ))}
          <div className="border-t my-2" />
          <Row
            label="TOTAL / mo"
            value={currencyPrecise(result.monthlyTotalNow)}
          />
          {item.type === "property" && (
            <Row
              label="PMI ends (month)"
              value={(result as PropertyCalculation).cancelMonth.toString()}
            />
          )}
        </SectionCard>

        <SectionCard
          title="Upfront costs"
          icon={<FilePlus2 className="w-4 h-4" />}
        >
          {item.type === "property" ? (
            <>
              <Row
                label="Closing + fixed + points + origination - credits"
                value={currencyPrecise((result as PropertyCalculation).upfront)}
              />
              <Row
                label="Down payment (separate)"
                value={currencyPrecise(
                  (item as PropertyItem).downPaymentAmount,
                )}
              />
              <div className="border-t my-2" />
              <Row
                label="TOTAL upfront (incl. down)"
                value={currencyPrecise(
                  (result as PropertyCalculation).upfront +
                    (item as PropertyItem).downPaymentAmount,
                )}
              />
            </>
          ) : (
            <>
              <Row
                label="Down payment + fees + (tax if not rolled)"
                value={currencyPrecise((result as VehicleCalculation).upfront)}
              />
              <Row
                label="Sales tax (total)"
                value={currencyPrecise((result as VehicleCalculation).salesTax)}
              />
            </>
          )}
        </SectionCard>

        <SectionCard
          title={`Totals over ${analysisYears} years`}
          icon={<Layers className="w-4 h-4" />}
        >
          {item.type === "property" ? (
            <>
              <Row
                label="Mortgage payments"
                value={currencyPrecise(
                  (result as PropertyCalculation).sums.mortgagePayments,
                )}
              />
              <Row
                label="Interest (subset above)"
                value={currencyPrecise(
                  (result as PropertyCalculation).sums.interest,
                )}
              />
              <Row
                label="Taxes + Insurance + HOA + Maint"
                value={currencyPrecise(
                  (result as PropertyCalculation).sums.recurringNonMortgage,
                )}
              />
              <Row
                label="PMI"
                value={currencyPrecise(
                  (result as PropertyCalculation).sums.pmi,
                )}
              />
              <div className="border-t my-2" />
              <Row
                label="TOTAL outlay (excl. down)"
                value={currencyPrecise(
                  (result as PropertyCalculation).sums.totalOutlay,
                )}
              />
              <Row
                label="TOTAL outlay (incl. down)"
                value={currencyPrecise(
                  (result as PropertyCalculation).sums.totalOutlay +
                    (item as PropertyItem).downPaymentAmount,
                )}
              />
            </>
          ) : (
            <>
              <Row
                label="Loan payments"
                value={currencyPrecise(
                  (result as VehicleCalculation).sums.loanPayments,
                )}
              />
              <Row
                label="Interest (subset above)"
                value={currencyPrecise(
                  (result as VehicleCalculation).sums.interest,
                )}
              />
              <Row
                label="Insurance + Reg + Maint"
                value={currencyPrecise(
                  (result as VehicleCalculation).sums.insurance +
                    (result as VehicleCalculation).sums.registration +
                    (result as VehicleCalculation).sums.maintenance,
                )}
              />
              <div className="border-t my-2" />
              <Row
                label="TOTAL outlay (incl. upfront)"
                value={currencyPrecise(
                  (result as VehicleCalculation).sums.totalOutlay,
                )}
              />
            </>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
