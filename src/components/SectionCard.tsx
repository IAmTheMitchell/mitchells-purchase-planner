import { ReactNode } from "react";

interface SectionCardProps {
  title: string;
  children: ReactNode;
  icon?: ReactNode;
}

export function SectionCard({ title, children, icon }: SectionCardProps) {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow p-5 border border-neutral-200 dark:border-neutral-800">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>
      {children}
    </div>
  );
}
