interface NumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  suffix?: string;
  min?: number;
}

export function NumberInput({
  label,
  value,
  onChange,
  step = 1,
  suffix,
  min = 0,
}: NumberInputProps) {
  return (
    <label className="flex flex-col gap-2 py-1 text-sm">
      <span className="text-neutral-600 dark:text-neutral-300">{label}</span>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="number"
          className="w-full sm:w-40 px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950"
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
    <label className="flex flex-col gap-2 py-1 text-sm sm:flex-row sm:items-center sm:justify-between">
      <span className="text-neutral-600 dark:text-neutral-300">{label}</span>
      <input
        className="h-4 w-4 self-start sm:self-auto"
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}
