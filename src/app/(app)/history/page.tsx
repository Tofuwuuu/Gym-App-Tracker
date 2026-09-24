import Link from "next/link";
import { format } from "date-fns";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { calculateVolume, formatDuration } from "@/lib/workout-utils";
import { PageHeader } from "@/components/layout/page-header";

export default async function HistoryPage() {
  const user = await requireUser();
  const workouts = await prisma.workout.findMany({
    where: { userId: user.id, endedAt: { not: null } },
    orderBy: { startedAt: "desc" },
    include: {
      exercises: {
        include: {
          exercise: true,
          sets: true,
        },
      },
    },
  });

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Log"
        title="History"
        description="Every completed session."
      />

      {workouts.length === 0 ? (
        <div className="surface px-4 py-8 text-sm text-muted-foreground">
          No completed workouts yet.
        </div>
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {workouts.map((workout) => {
            const volume = workout.exercises.reduce(
              (sum, ex) => sum + calculateVolume(ex.sets),
              0
            );
            return (
              <Link
                key={workout.id}
                href={`/history/${workout.id}`}
                className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="min-w-0">
                  <p className="font-heading text-xl uppercase tracking-wide">
                    {format(workout.startedAt, "EEE, MMM d")}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {workout.exercises.map((ex) => ex.exercise.name).join(" · ")}
                  </p>
                </div>
                <div className="shrink-0 text-right text-sm">
                  <p className="font-mono text-primary">
                    {Math.round(volume).toLocaleString()} kg
                  </p>
                  <p className="text-muted-foreground">
                    {formatDuration(workout.startedAt, workout.endedAt)}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
