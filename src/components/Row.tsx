interface RowProps {
  label: string;
  value: string;
}

export function Row({ label, value }: RowProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 py-1 text-sm">
      <span className="text-neutral-600 dark:text-neutral-300">{label}</span>
      <span className="font-medium sm:text-right">{value}</span>
    </div>
  );
}
