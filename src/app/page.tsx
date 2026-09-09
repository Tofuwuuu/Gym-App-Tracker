import Link from "next/link";
import { getOptionalUser } from "@/lib/session";
import { BrandMark } from "@/components/brand/brand-mark";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const user = await getOptionalUser();
  if (user) redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="flex h-12 items-center justify-between border-b px-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <BrandMark className="size-6 rounded-md" iconClassName="size-4" />
          Fitness Tracker
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" render={<Link href="/sign-in" />}>
            Sign in
          </Button>
          <Button render={<Link href="/sign-up" />}>Get started</Button>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-10 px-6 py-16">
        <div className="space-y-5">
          <BrandMark className="size-14 rounded-2xl" iconClassName="size-9" />
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight md:text-5xl">
            Fitness Tracker
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            A clean workout log with routines, progress charts, and a calendar heatmap —
            built like a modern Notion fitness dashboard.
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
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ["Total Sets", "Log every working set"],
            ["Volume & PRs", "Watch strength climb"],
            ["Calendar", "Build a training streak"],
          ].map(([title, body]) => (
            <div key={title} className="rounded-xl border p-4">
              <p className="font-medium">{title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
