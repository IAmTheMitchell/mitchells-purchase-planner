import { FolderOpen } from "lucide-react";

import { Scenario } from "../types";

interface ScenarioHeaderProps {
  scenario: Scenario;
  onRename: (name: string) => void;
  onAnalysisYears: (years: number) => void;
}

export function ScenarioHeader({ scenario, onRename, onAnalysisYears }: ScenarioHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
      <div className="flex items-center gap-2">
        <FolderOpen className="w-5 h-5" />
        <input
          className="text-2xl font-bold bg-transparent border-b border-transparent focus:border-neutral-400 outline-none"
          value={scenario.name}
          onChange={(e) => onRename(e.target.value)}
        />
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-neutral-600">Analysis horizon:</span>
          <input
            type="number"
            className="w-20 px-2 py-1 rounded-lg border border-neutral-300"
            min={1}
            value={scenario.analysisYears}
            onChange={(e) => onAnalysisYears(parseInt(e.target.value || "1", 10))}
          />
          <span>years</span>
        </div>
      </div>
    </div>
  );
}
