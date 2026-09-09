import Link from "next/link";
import { Dumbbell } from "lucide-react";
import { getOptionalUser } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const user = await getOptionalUser();
  if (user) redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-2 font-semibold">
          <Dumbbell className="size-5" />
          Gym Tracker
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" render={<Link href="/sign-in" />}>
            Sign in
          </Button>
          <Button render={<Link href="/sign-up" />}>Get started</Button>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center gap-8 px-6 py-16">
        <div className="space-y-4">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Free workout logging
          </p>
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight md:text-5xl">
            Track sets, routines, and progress — inspired by Strong & Hevy.
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            Log workouts fast, reuse templates, watch volume and estimated 1RM climb, and
            follow friends for a simple social feed.
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
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              title: "Fast logging",
              body: "Sets, reps, weight, and a rest timer built for the gym floor.",
            },
            {
              title: "Routines & history",
              body: "Save templates, replay them, and review every session.",
            },
            {
              title: "Progress & social",
              body: "Charts for volume and strength plus a lightweight follow feed.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border bg-card p-4">
              <h2 className="font-medium">{item.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
