import { useMemo } from "react";
import { BarChart3 } from "lucide-react";

import { calcProperty, calcVehicle } from "../calculations";
import { Scenario } from "../types";
import { currencyPrecise } from "../utils/format";
import { SectionCard } from "./SectionCard";

interface ComparePanelProps {
  scenarios: Scenario[];
  selectedIds: string[];
}

export function ComparePanel({ scenarios, selectedIds }: ComparePanelProps) {
  const selected = scenarios.filter((scenario) =>
    selectedIds.includes(scenario.id),
  );

  const rows = useMemo(() => {
    return selected.map((scenario) => {
      let monthlyNow = 0;
      let upfrontTotal = 0;
      let totalOutlay = 0;

      scenario.items.forEach((item) => {
        if (item.type === "property") {
          const result = calcProperty(item, scenario.analysisYears);
          monthlyNow += result.monthlyTotalNow;
          upfrontTotal += result.upfront + item.downPaymentAmount;
          totalOutlay += result.sums.totalOutlay + item.downPaymentAmount;
        } else {
          const result = calcVehicle(item, scenario.analysisYears);
          monthlyNow += result.monthlyTotalNow;
          upfrontTotal += result.upfront;
          totalOutlay += result.sums.totalOutlay;
        }
      });

      return {
        id: scenario.id,
        name: scenario.name,
        horizon: scenario.analysisYears,
        monthlyNow,
        upfrontTotal,
        totalOutlay,
      };
    });
  }, [selected]);

  if (selected.length === 0) return null;

  return (
    <SectionCard
      title="Scenario comparison"
      icon={<BarChart3 className="w-4 h-4" />}
    >
      <div className="space-y-4">
        <div className="grid gap-4 md:hidden">
          {rows.map((row) => (
            <div
              key={row.id}
              className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 p-4"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-xs uppercase tracking-wide text-neutral-500">
                  Scenario
                </span>
                <span className="text-lg font-semibold">{row.name}</span>
              </div>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-neutral-500">Analysis horizon</dt>
                  <dd className="font-medium">{row.horizon} yrs</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-neutral-500">Monthly total now</dt>
                  <dd className="font-medium">
                    {currencyPrecise(row.monthlyNow)}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-neutral-500">Upfront total</dt>
                  <dd className="font-medium">
                    {currencyPrecise(row.upfrontTotal)}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-neutral-500">Total outlay</dt>
                  <dd className="font-medium">
                    {currencyPrecise(row.totalOutlay)}
                  </dd>
                </div>
              </dl>
            </div>
          ))}
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">Scenario</th>
                {rows.map((row) => (
                  <th key={row.id} className="py-2">
                    {row.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2">Analysis horizon (years)</td>
                {rows.map((row) => (
                  <td key={row.id}>{row.horizon}</td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="py-2">Monthly total now</td>
                {rows.map((row) => (
                  <td key={row.id}>{currencyPrecise(row.monthlyNow)}</td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="py-2">Upfront total</td>
                {rows.map((row) => (
                  <td key={row.id}>{currencyPrecise(row.upfrontTotal)}</td>
                ))}
              </tr>
              <tr>
                <td className="py-2">Total outlay over horizon</td>
                {rows.map((row) => (
                  <td key={row.id}>{currencyPrecise(row.totalOutlay)}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </SectionCard>
  );
}
