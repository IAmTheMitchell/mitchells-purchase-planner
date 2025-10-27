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
      <div className="overflow-x-auto">
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
    </SectionCard>
  );
}
