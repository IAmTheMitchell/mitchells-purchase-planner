interface RowProps {
  label: string;
  value: string;
}

export function Row({ label, value }: RowProps) {
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className="text-neutral-600 dark:text-neutral-300">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
