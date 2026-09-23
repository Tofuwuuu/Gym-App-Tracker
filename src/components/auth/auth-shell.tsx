import Link from "next/link";
import { Wordmark } from "@/components/brand/brand-mark";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
      <aside className="relative hidden overflow-hidden border-r border-border bg-sidebar lg:flex lg:flex-col lg:justify-between lg:p-10">
        <div className="athletic-grid pointer-events-none absolute inset-0" />
        <Link href="/" className="relative">
          <Wordmark />
        </Link>
        <div className="relative max-w-lg space-y-4">
          <p className="font-heading text-6xl font-semibold uppercase leading-[0.9] tracking-wide">
            Log every set.
            <span className="block text-primary">Keep the streak.</span>
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Routines, volume, and personal records in a training log built for the gym floor.
          </p>
        </div>
        <p className="relative text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
          Train · Log · Progress
        </p>
      </aside>
      <div className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
