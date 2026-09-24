import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
}) {
  return (
    <div className="bg-card px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {label}
        </p>
        <Icon className="size-3.5 text-primary" />
      </div>
      <p className="mt-2 font-heading text-4xl font-semibold uppercase leading-none tracking-wide">
        {value}
      </p>
    </div>
  );
}
