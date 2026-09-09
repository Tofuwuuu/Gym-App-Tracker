import Link from "next/link";
import { format } from "date-fns";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { calculateVolume, formatDuration } from "@/lib/workout-utils";
import { Card, CardContent } from "@/components/ui/card";

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">History</h1>
        <p className="text-muted-foreground">Every completed session.</p>
      </div>

      {workouts.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground">
            No completed workouts yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {workouts.map((workout) => {
            const volume = workout.exercises.reduce(
              (sum, ex) => sum + calculateVolume(ex.sets),
              0
            );
            return (
              <Link
                key={workout.id}
                href={`/history/${workout.id}`}
                className="block rounded-xl border bg-card p-4 hover:bg-muted/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      {format(workout.startedAt, "EEE, MMM d · h:mm a")}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {workout.exercises.map((ex) => ex.exercise.name).join(" · ")}
                    </p>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <p>{formatDuration(workout.startedAt, workout.endedAt)}</p>
                    <p>{Math.round(volume).toLocaleString()} kg vol</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
