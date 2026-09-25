import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { startWorkout } from "@/lib/actions/gym";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";

export default async function NewWorkoutPage() {
  const user = await requireUser();
  const routines = await prisma.routine.findMany({
    where: { userId: user.id },
    include: {
      exercises: { include: { exercise: true }, orderBy: { order: "asc" } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const active = await prisma.workout.findFirst({
    where: { userId: user.id, endedAt: null },
    orderBy: { startedAt: "desc" },
  });

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Session"
        title="Start workout"
        description="Pick a routine or open an empty log."
      />

      {active && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-primary/40 bg-primary/10 px-4 py-3">
          <p className="text-sm">You have a workout in progress.</p>
          <Button nativeButton={false} render={<Link href={`/workout/${active.id}`} />}>
            Resume
          </Button>
        </div>
      )}

      <form action={startWorkout}>
        <Button type="submit" className="w-full" size="lg">
          Empty workout
        </Button>
      </form>

      <div className="space-y-2">
        <h2 className="font-heading text-2xl uppercase tracking-wide">From routine</h2>
        {routines.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No routines yet.{" "}
            <Link href="/routines/new" className="text-primary underline-offset-4 hover:underline">
              Create one
            </Link>
          </p>
        )}
        {routines.length > 0 && (
          <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {routines.map((routine) => (
              <div
                key={routine.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="font-heading text-xl uppercase tracking-wide">{routine.name}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {routine.exercises.map((ex) => ex.exercise.name).join(", ")}
                  </p>
                </div>
                <form action={startWorkout.bind(null, routine.id)}>
                  <Button type="submit" size="sm">
                    Start
                  </Button>
                </form>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
