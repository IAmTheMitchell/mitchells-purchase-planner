interface NumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  suffix?: string;
  min?: number;
}

export function NumberInput({ label, value, onChange, step = 1, suffix, min = 0 }: NumberInputProps) {
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

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

export function Toggle({ label, checked, onChange }: ToggleProps) {
  return (
    <label className="flex items-center justify-between gap-4 py-1">
      <span className="text-sm text-neutral-600 dark:text-neutral-300">{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}
