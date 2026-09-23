import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { deleteRoutineForm, startWorkout } from "@/lib/actions/gym";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";

export default async function RoutinesPage() {
  const user = await requireUser();
  const routines = await prisma.routine.findMany({
    where: { userId: user.id },
    include: {
      exercises: {
        include: { exercise: true },
        orderBy: { order: "asc" },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Templates"
        title="Routines"
        description="Saved splits you can start in one tap."
        action={<Button render={<Link href="/routines/new" />}>New routine</Button>}
      />

      {routines.length === 0 ? (
        <div className="surface px-4 py-8 text-sm text-muted-foreground">
          No routines yet. Create Push, Pull, Legs — or whatever split you run.
        </div>
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {routines.map((routine) => (
            <div key={routine.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="font-heading text-2xl uppercase tracking-wide">{routine.name}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {routine.exercises.map((ex) => ex.exercise.name).join(" · ") || "No exercises yet"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <form action={startWorkout.bind(null, routine.id)}>
                  <Button type="submit" size="sm">
                    Start
                  </Button>
                </form>
                <Button
                  size="sm"
                  variant="outline"
                  render={<Link href={`/routines/${routine.id}/edit`} />}
                >
                  Edit
                </Button>
                <form action={deleteRoutineForm.bind(null, routine.id)}>
                  <Button type="submit" size="sm" variant="destructive">
                    Delete
                  </Button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
