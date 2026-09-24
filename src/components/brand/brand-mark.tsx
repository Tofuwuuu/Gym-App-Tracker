import { cn } from "@/lib/utils";

export function BrandMark({
  className,
  iconClassName,
}: {
  className?: string;
  iconClassName?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-[0_0_0_1px_color-mix(in_oklab,var(--primary)_40%,transparent)]",
        className
      )}
      aria-hidden
    >
      <svg
        viewBox="0 0 24 24"
        className={cn("size-5", iconClassName)}
        fill="none"
      >
        <path
          d="M3.5 9.25v5.5M7.25 6.5v11M16.75 6.5v11M20.5 9.25v5.5M7.25 12h9.5"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

export function Wordmark({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <BrandMark className={compact ? "size-7 rounded-md" : "size-8"} iconClassName="size-4" />
      <span
        className={cn(
          "font-heading font-semibold uppercase tracking-[0.08em] text-foreground",
          compact ? "text-lg" : "text-[1.35rem]"
        )}
      >
        Gym Tracker
      </span>
    </span>
  );
}
