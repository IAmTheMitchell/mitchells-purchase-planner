import { useState } from "react";
import { Calculator, X } from "lucide-react";

import { PropertyItem, VehicleItem } from "../types";
import { NumberInput, Toggle } from "./inputs";

interface ItemEditorProps {
  item: PropertyItem | VehicleItem;
  onSave: (item: PropertyItem | VehicleItem) => void;
  onClose: () => void;
}

export function ItemEditor({ item, onSave, onClose }: ItemEditorProps) {
  const [draft, setDraft] = useState<PropertyItem | VehicleItem>({ ...item });
  const isProperty = draft.type === "property";

  return (
    <div className="fixed inset-0 bg-black/40 flex items-start md:items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-neutral-950 w-full max-w-3xl mx-auto rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            <h3 className="text-lg font-semibold">Edit Item: {draft.name}</h3>
          </div>
          <button
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-lg"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-full md:max-h-[70vh] overflow-y-auto">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-neutral-600 dark:text-neutral-300">
              Name
            </span>
            <input
              className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </label>

          {isProperty ? (
            <>
              <NumberInput
                label="Purchase price"
                value={(draft as PropertyItem).purchasePrice}
                onChange={(v) =>
                  setDraft({ ...draft, purchasePrice: v } as PropertyItem)
                }
                suffix="$"
                step={1000}
              />
              <NumberInput
                label="Down payment"
                value={(draft as PropertyItem).downPaymentAmount}
                onChange={(v) =>
                  setDraft({ ...draft, downPaymentAmount: v } as PropertyItem)
                }
                suffix="$"
                step={1000}
              />
              <NumberInput
                label="Interest rate (APR)"
                value={(draft as PropertyItem).interestRateAPR}
                onChange={(v) =>
                  setDraft({ ...draft, interestRateAPR: v } as PropertyItem)
                }
                suffix="%"
                step={0.01}
              />
              <NumberInput
                label="Loan term"
                value={(draft as PropertyItem).termYears}
                onChange={(v) =>
                  setDraft({ ...draft, termYears: v } as PropertyItem)
                }
                suffix="years"
                step={1}
              />
              <NumberInput
                label="Property tax rate"
                value={(draft as PropertyItem).propertyTaxRate}
                onChange={(v) =>
                  setDraft({ ...draft, propertyTaxRate: v } as PropertyItem)
                }
                suffix="%/yr"
                step={0.01}
              />
              <NumberInput
                label="Home insurance"
                value={(draft as PropertyItem).insuranceAnnual}
                onChange={(v) =>
                  setDraft({ ...draft, insuranceAnnual: v } as PropertyItem)
                }
                suffix="$ / yr"
                step={50}
              />
              <NumberInput
                label="HOA dues"
                value={(draft as PropertyItem).hoaMonthly}
                onChange={(v) =>
                  setDraft({ ...draft, hoaMonthly: v } as PropertyItem)
                }
                suffix="$ / mo"
                step={10}
              />
              <NumberInput
                label="Maintenance"
                value={(draft as PropertyItem).maintenancePctAnnual}
                onChange={(v) =>
                  setDraft({
                    ...draft,
                    maintenancePctAnnual: v,
                  } as PropertyItem)
                }
                suffix="% of value / yr"
                step={0.1}
              />
              <NumberInput
                label="PMI annual rate"
                value={(draft as PropertyItem).pmiAnnualRate}
                onChange={(v) =>
                  setDraft({ ...draft, pmiAnnualRate: v } as PropertyItem)
                }
                suffix="%"
                step={0.01}
              />
              <NumberInput
                label="PMI cancel LTV"
                value={(draft as PropertyItem).pmiLTVCancel * 100}
                onChange={(v) =>
                  setDraft({ ...draft, pmiLTVCancel: v / 100 } as PropertyItem)
                }
                suffix="%"
                step={1}
              />
              <NumberInput
                label="Closing costs (pct)"
                value={(draft as PropertyItem).closingCostsPct}
                onChange={(v) =>
                  setDraft({ ...draft, closingCostsPct: v } as PropertyItem)
                }
                suffix="% of price"
                step={0.1}
              />
              <NumberInput
                label="Closing costs (fixed)"
                value={(draft as PropertyItem).closingCostsFixed}
                onChange={(v) =>
                  setDraft({ ...draft, closingCostsFixed: v } as PropertyItem)
                }
                suffix="$"
                step={100}
              />
              <NumberInput
                label="Points"
                value={(draft as PropertyItem).pointsPct}
                onChange={(v) =>
                  setDraft({ ...draft, pointsPct: v } as PropertyItem)
                }
                suffix="% of loan"
                step={0.125}
              />
              <NumberInput
                label="Origination fee"
                value={(draft as PropertyItem).originationPct}
                onChange={(v) =>
                  setDraft({ ...draft, originationPct: v } as PropertyItem)
                }
                suffix="% of loan"
                step={0.1}
              />
              <NumberInput
                label="Lender credits"
                value={(draft as PropertyItem).lenderCredits}
                onChange={(v) =>
                  setDraft({ ...draft, lenderCredits: v } as PropertyItem)
                }
                suffix="$ (subtracts)"
                step={100}
              />
            </>
          ) : (
            <>
              <NumberInput
                label="Purchase price"
                value={(draft as VehicleItem).purchasePrice}
                onChange={(v) =>
                  setDraft({ ...draft, purchasePrice: v } as VehicleItem)
                }
                suffix="$"
                step={500}
              />
              <NumberInput
                label="Down payment"
                value={(draft as VehicleItem).downPaymentAmount}
                onChange={(v) =>
                  setDraft({ ...draft, downPaymentAmount: v } as VehicleItem)
                }
                suffix="$"
                step={250}
              />
              <NumberInput
                label="Trade-in value"
                value={(draft as VehicleItem).tradeInValue}
                onChange={(v) =>
                  setDraft({ ...draft, tradeInValue: v } as VehicleItem)
                }
                suffix="$"
                step={250}
              />
              <NumberInput
                label="Sales tax rate"
                value={(draft as VehicleItem).salesTaxRate}
                onChange={(v) =>
                  setDraft({ ...draft, salesTaxRate: v } as VehicleItem)
                }
                suffix="%"
                step={0.1}
              />
              <Toggle
                label="Roll sales tax into loan"
                checked={(draft as VehicleItem).rollTaxIntoLoan}
                onChange={(v) =>
                  setDraft({ ...draft, rollTaxIntoLoan: v } as VehicleItem)
                }
              />
              <NumberInput
                label="Interest rate (APR)"
                value={(draft as VehicleItem).interestRateAPR}
                onChange={(v) =>
                  setDraft({ ...draft, interestRateAPR: v } as VehicleItem)
                }
                suffix="%"
                step={0.01}
              />
              <NumberInput
                label="Loan term"
                value={(draft as VehicleItem).termMonths}
                onChange={(v) =>
                  setDraft({ ...draft, termMonths: v } as VehicleItem)
                }
                suffix="months"
                step={1}
              />
              <NumberInput
                label="Insurance"
                value={(draft as VehicleItem).insuranceMonthly}
                onChange={(v) =>
                  setDraft({ ...draft, insuranceMonthly: v } as VehicleItem)
                }
                suffix="$ / mo"
                step={10}
              />
              <NumberInput
                label="Registration"
                value={(draft as VehicleItem).registrationAnnual}
                onChange={(v) =>
                  setDraft({ ...draft, registrationAnnual: v } as VehicleItem)
                }
                suffix="$ / yr"
                step={10}
              />
              <NumberInput
                label="Maintenance"
                value={(draft as VehicleItem).maintenanceMonthly}
                onChange={(v) =>
                  setDraft({ ...draft, maintenanceMonthly: v } as VehicleItem)
                }
                suffix="$ / mo"
                step={10}
              />
              <NumberInput
                label="One-time fees"
                value={(draft as VehicleItem).oneTimeFees}
                onChange={(v) =>
                  setDraft({ ...draft, oneTimeFees: v } as VehicleItem)
                }
                suffix="$ upfront"
                step={25}
              />
            </>
          )}
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 p-4 border-t border-neutral-200 dark:border-neutral-800">
          <button
            className="w-full sm:w-auto px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 text-center"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="w-full sm:w-auto px-3 py-2 rounded-lg bg-black text-white text-center"
            onClick={() => onSave(draft)}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
