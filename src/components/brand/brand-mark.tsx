import { PersonStanding } from "lucide-react";
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
        "inline-flex size-8 items-center justify-center rounded-lg bg-fitness-soft text-fitness",
        className
      )}
    >
      <PersonStanding className={cn("size-5", iconClassName)} strokeWidth={2.25} />
    </span>
  );
}
