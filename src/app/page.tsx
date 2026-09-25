import Link from "next/link";
import { getOptionalUser } from "@/lib/session";
import { Wordmark } from "@/components/brand/brand-mark";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";

const features = [
  { kicker: "01", title: "Set logging", body: "Weight, reps, and a rest clock while the bar is loaded." },
  { kicker: "02", title: "Routines", body: "Push, pull, legs — start a saved split in one tap." },
  { kicker: "03", title: "Strength", body: "Volume, estimated 1RM, and PRs without a spreadsheet." },
];

export default async function LandingPage() {
  const user = await getOptionalUser();
  if (user) redirect("/dashboard");

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <div className="athletic-grid pointer-events-none absolute inset-0" />
      <header className="relative z-10 flex h-16 items-center justify-between px-5 md:px-8">
        <Wordmark />
        <div className="flex items-center gap-2">
          <Button variant="ghost" render={<Link href="/sign-in" />}>
            Sign in
          </Button>
          <Button render={<Link href="/sign-up" />}>Get started</Button>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center gap-12 px-5 py-10 md:px-8 md:py-16">
        <div className="grid items-end gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">
              Workout log
            </p>
            <h1 className="max-w-xl font-heading text-6xl font-semibold uppercase leading-[0.88] tracking-wide sm:text-7xl">
              Train.
              <span className="block text-primary">Log.</span>
              Progress.
            </h1>
            <p className="max-w-md text-base text-muted-foreground">
              A tight training log with routines, a calendar streak, and strength charts.
              Built for the session, not a blank dashboard.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" render={<Link href="/sign-up" />}>
                Create free account
              </Button>
              <Button size="lg" variant="outline" render={<Link href="/sign-in" />}>
                Sign in
              </Button>
            </div>
          </div>

          <div className="surface overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                  Live session
                </p>
                <p className="font-heading text-xl uppercase tracking-wide">Push day</p>
              </div>
              <p className="font-mono text-lg tabular-nums text-primary">01:30</p>
            </div>
            <div className="space-y-3 p-4">
              <p className="text-sm font-medium">Barbell Bench Press</p>
              {[
                ["1", "80", "5", true],
                ["2", "80", "5", true],
                ["3", "82.5", "4", false],
              ].map(([set, kg, reps, done]) => (
                <div
                  key={String(set)}
                  className="grid grid-cols-[28px_1fr_1fr_28px] items-center gap-2 text-sm"
                >
                  <span className="text-muted-foreground">{set}</span>
                  <span className="rounded-md bg-muted px-2 py-1.5 font-mono tabular-nums">{kg}</span>
                  <span className="rounded-md bg-muted px-2 py-1.5 font-mono tabular-nums">{reps}</span>
                  <span
                    className={
                      done
                        ? "flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
                        : "flex size-7 items-center justify-center rounded-full border border-border text-xs text-muted-foreground"
                    }
                  >
                    {done ? "✓" : ""}
                  </span>
                </div>
              ))}
              <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                {[
                  ["6", "Sets"],
                  ["2.1k", "kg"],
                  ["1", "PR"],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-lg bg-muted px-2 py-2">
                    <p className="font-heading text-2xl uppercase text-primary">{value}</p>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="bg-card px-4 py-4">
              <p className="font-mono text-xs text-primary">{feature.kicker}</p>
              <p className="mt-2 font-heading text-2xl uppercase tracking-wide">{feature.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{feature.body}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
