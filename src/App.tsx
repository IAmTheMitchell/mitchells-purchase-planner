import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { v4 as uuidv4 } from "uuid";
import {
  Copy,
  Download,
  FilePlus2,
  FolderOpen,
  Layers,
  Plus,
  Trash2,
  Upload,
  Calculator as CalculatorIcon,
} from "lucide-react";

import { ItemEditor } from "./components/ItemEditor";
import { ItemSummary } from "./components/ItemSummary";
import { ScenarioHeader } from "./components/ScenarioHeader";
import { ComparePanel } from "./components/ComparePanel";
import { SectionCard } from "./components/SectionCard";
import { newProperty, newScenario, newVehicle } from "./defaults";
import {
  loadScenarios,
  parseScenarios,
  saveScenarios,
  serializeScenarios,
} from "./persistence";
import { ItemType, PropertyItem, Scenario, VehicleItem } from "./types";

export default function App() {
  const isBrowser = typeof window !== "undefined";
  const initialScenariosRef = useRef<Scenario[] | null>(null);
  const actionButtonClass =
    "w-full sm:w-auto px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-sm font-medium text-center transition hover:bg-neutral-50 dark:hover:bg-neutral-800";

  if (initialScenariosRef.current === null) {
    initialScenariosRef.current = isBrowser ? loadScenarios() : [newScenario()];
  }

  const initialScenarios = initialScenariosRef.current as Scenario[];

  const [scenarios, setScenarios] = useState<Scenario[]>(initialScenarios);
  const [currentId, setCurrentId] = useState<string>(
    initialScenarios[0]?.id ?? "",
  );
  const [editingItem, setEditingItem] = useState<
    PropertyItem | VehicleItem | null
  >(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState<boolean>(isBrowser);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!hydrated) {
      const loaded = loadScenarios();
      setScenarios(loaded);
      setCurrentId(loaded[0]?.id ?? "");
      setCompareIds((prev) =>
        prev.filter((id) => loaded.some((scenario) => scenario.id === id)),
      );
      setHydrated(true);
      return;
    }

    saveScenarios(scenarios);
  }, [hydrated, scenarios]);

  const current = useMemo(
    () =>
      scenarios.find((scenario) => scenario.id === currentId) ?? scenarios[0],
    [scenarios, currentId],
  );

  useEffect(() => {
    if ((!currentId || !current) && scenarios.length > 0) {
      setCurrentId(scenarios[0].id);
    }
  }, [current, currentId, scenarios]);

  function updateCurrent(updater: (scenario: Scenario) => Scenario) {
    if (!current) return;
    setScenarios((prev) =>
      prev.map((scenario) =>
        scenario.id === current.id ? updater({ ...scenario }) : scenario,
      ),
    );
  }

  function addItem(type: ItemType) {
    const item = type === "property" ? newProperty() : newVehicle();
    updateCurrent((scenario) => ({
      ...scenario,
      items: [...scenario.items, item],
    }));
    setEditingItem(item);
  }

  function duplicateScenario(id: string) {
    const source = scenarios.find((scenario) => scenario.id === id);
    if (!source) return;
    const copy: Scenario = {
      ...source,
      id: uuidv4(),
      name: `${source.name} (copy)`,
    };
    setScenarios((prev) => [...prev, copy]);
    setCurrentId(copy.id);
  }

  function removeScenario(id: string) {
    const next = scenarios.filter((scenario) => scenario.id !== id);

    if (!next.length) {
      const replacement = newScenario();
      setScenarios([replacement]);
      setCurrentId(replacement.id);
      setCompareIds([]);
      return;
    }

    setScenarios(next);
    if (current?.id === id) {
      setCurrentId(next[0].id);
    }
    setCompareIds((prev) => prev.filter((compareId) => compareId !== id));
  }

  function handleExport() {
    if (!isBrowser || scenarios.length === 0) return;

    try {
      const payload = serializeScenarios(scenarios);
      const blob = new Blob([payload], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const link = document.createElement("a");
      link.href = url;
      link.download = `purchase-planner-export-${timestamp}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (error) {
      if (isBrowser) {
        const message =
          error instanceof Error ? error.message : "Unknown export error";
        window.alert(`Export failed: ${message}`);
      }
    }
  }

  async function handleImport(files: FileList | null) {
    if (!files?.length) return;

    const [file] = files;
    try {
      const text = await file.text();
      const imported = parseScenarios(text);
      setScenarios(imported);
      setCurrentId(imported[0].id);
      setCompareIds((prev) =>
        prev.filter((id) => imported.some((scenario) => scenario.id === id)),
      );
    } catch (error) {
      if (isBrowser) {
        const message =
          error instanceof Error ? error.message : "Unknown import error";
        window.alert(`Import failed: ${message}`);
      }
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  if (!current) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900 text-neutral-900 dark:text-neutral-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-2 bg-black text-white rounded-2xl shadow"
            >
              <CalculatorIcon className="w-6 h-6" />
            </motion.div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                Mitchell's Purchase Planner
              </h1>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Model properties & vehicles, save scenarios, and compare side by
                side.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap md:justify-end w-full md:w-auto">
            <button
              className={actionButtonClass}
              onClick={() => {
                const scenario = newScenario();
                setScenarios((prev) => [...prev, scenario]);
                setCurrentId(scenario.id);
              }}
            >
              <FilePlus2 className="inline w-4 h-4 mr-1" /> New scenario
            </button>
            <button
              className={actionButtonClass}
              onClick={() => duplicateScenario(current.id)}
            >
              <Copy className="inline w-4 h-4 mr-1" /> Duplicate
            </button>
            <button
              className={actionButtonClass}
              onClick={handleExport}
            >
              <Download className="inline w-4 h-4 mr-1" /> Export all
            </button>
            <button
              className={actionButtonClass}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="inline w-4 h-4 mr-1" /> Import
            </button>
            <button
              className={`${actionButtonClass} border-red-300 dark:border-red-800 text-red-600`}
              onClick={() => removeScenario(current.id)}
            >
              <Trash2 className="inline w-4 h-4 mr-1" /> Delete
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(event) => {
                void handleImport(event.target.files);
              }}
            />
          </div>
        </header>

        <SectionCard title="Scenarios" icon={<Layers className="w-4 h-4" />}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-sm text-neutral-600">Current:</span>
              <select
                className="w-full sm:flex-1 px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950"
                value={current.id}
                onChange={(e) => setCurrentId(e.target.value)}
              >
                {scenarios.map((scenario) => (
                  <option key={scenario.id} value={scenario.id}>
                    {scenario.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-sm text-neutral-600">Compare:</span>
              <select
                className="w-full sm:flex-1 px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950"
                multiple
                value={compareIds}
                onChange={(e) =>
                  setCompareIds(
                    Array.from(
                      e.target.selectedOptions,
                      (option) => option.value,
                    ),
                  )
                }
              >
                {scenarios.map((scenario) => (
                  <option key={scenario.id} value={scenario.id}>
                    {scenario.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-sm text-neutral-500">
              Hold Ctrl / Cmd to select multiple scenarios to compare.
            </div>
          </div>
        </SectionCard>

        <div className="my-6" />

        <SectionCard title="Scenario" icon={<FolderOpen className="w-4 h-4" />}>
          <ScenarioHeader
            scenario={current}
            onRename={(name) =>
              updateCurrent((scenario) => ({ ...scenario, name }))
            }
            onAnalysisYears={(years) =>
              updateCurrent((scenario) => ({
                ...scenario,
                analysisYears: Math.max(1, years),
              }))
            }
          />

          <div className="my-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                className="w-full sm:w-auto px-3 py-2 rounded-xl bg-black text-white text-center"
                onClick={() => addItem("property")}
              >
                <Plus className="inline w-4 h-4 mr-1" /> Add property
              </button>
              <button
                className="w-full sm:w-auto px-3 py-2 rounded-xl bg-black text-white text-center"
                onClick={() => addItem("vehicle")}
              >
                <Plus className="inline w-4 h-4 mr-1" /> Add vehicle
              </button>
            </div>
          </div>

          {current.items.length === 0 ? (
            <div className="text-sm text-neutral-600">
              No items yet. Add a property or vehicle to begin.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {current.items.map((item) => (
                <ItemSummary
                  key={item.id}
                  item={item}
                  analysisYears={current.analysisYears}
                  onEdit={() => setEditingItem(item)}
                  onDelete={() =>
                    updateCurrent((scenario) => ({
                      ...scenario,
                      items: scenario.items.filter(
                        (existing) => existing.id !== item.id,
                      ),
                    }))
                  }
                />
              ))}
            </div>
          )}
        </SectionCard>

        <div className="my-6" />

        <ComparePanel scenarios={scenarios} selectedIds={compareIds} />

        <footer className="mt-10 text-xs text-neutral-500">
          <p>
            Notes: Property monthly totals include mortgage payment, PMI (until
            cancellation), taxes, insurance, HOA, and maintenance. Upfront
            totals include down payment, closing costs (percent + fixed),
            points, origination, minus lender credits. Vehicle monthly totals
            include loan payment, insurance, registration (prorated monthly),
            and maintenance. Upfront totals include down payment, fees, and tax
            if not rolled into the loan.
          </p>
          <p className="mt-3">
            Disclaimer: These calculations are illustrative only and do not
            constitute financial advice. Verify assumptions with licensed
            professionals before making purchase decisions.
          </p>
        </footer>
      </div>

      <AnimatePresence>
        {editingItem && (
          <ItemEditor
            item={editingItem}
            onSave={(updated) => {
              updateCurrent((scenario) => ({
                ...scenario,
                items: scenario.items.map((existing) =>
                  existing.id === updated.id ? updated : existing,
                ),
              }));
              setEditingItem(null);
            }}
            onClose={() => setEditingItem(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
