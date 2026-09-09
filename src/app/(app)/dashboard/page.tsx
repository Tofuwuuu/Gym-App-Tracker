import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Dumbbell, Play } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { formatDuration } from "@/lib/workout-utils";
import { startWorkout } from "@/lib/actions/gym";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const user = await requireUser();

  const [routines, recentWorkouts, activeWorkout, workoutCount] = await Promise.all([
    prisma.routine.findMany({
      where: { userId: user.id },
      include: { _count: { select: { exercises: true } } },
      orderBy: { updatedAt: "desc" },
      take: 4,
    }),
    prisma.workout.findMany({
      where: { userId: user.id, endedAt: { not: null } },
      orderBy: { startedAt: "desc" },
      take: 5,
      include: {
        exercises: { include: { exercise: true } },
      },
    }),
    prisma.workout.findFirst({
      where: { userId: user.id, endedAt: null },
      orderBy: { startedAt: "desc" },
    }),
    prisma.workout.count({
      where: { userId: user.id, endedAt: { not: null } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Hey{user.name ? `, ${user.name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-muted-foreground">
            {workoutCount} completed workout{workoutCount === 1 ? "" : "s"} logged
          </p>
        </div>
        {activeWorkout ? (
          <Button render={<Link href={`/workout/${activeWorkout.id}`} />}>
            Resume workout
          </Button>
        ) : (
          <form action={startWorkout.bind(null, undefined)}>
            <Button type="submit">
              <Play className="size-4" />
              Start empty workout
            </Button>
          </form>
        )}
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Routines</h2>
          <Button variant="ghost" size="sm" render={<Link href="/routines" />}>
            View all
          </Button>
        </div>
        {routines.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-start gap-3 py-6">
              <p className="text-sm text-muted-foreground">
                No routines yet. Build a template like Push / Pull / Legs.
              </p>
              <Button render={<Link href="/routines/new" />}>Create routine</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {routines.map((routine) => (
              <Card key={routine.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{routine.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-2">
                  <p className="text-sm text-muted-foreground">
                    {routine._count.exercises} exercises
                  </p>
                  <form action={startWorkout.bind(null, routine.id)}>
                    <Button type="submit" size="sm">
                      <Dumbbell className="size-4" />
                      Start
                    </Button>
                  </form>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Recent workouts</h2>
          <Button variant="ghost" size="sm" render={<Link href="/history" />}>
            History
          </Button>
        </div>
        <div className="space-y-2">
          {recentWorkouts.length === 0 && (
            <p className="text-sm text-muted-foreground">No workouts yet. Time to train.</p>
          )}
          {recentWorkouts.map((workout) => (
            <Link
              key={workout.id}
              href={`/history/${workout.id}`}
              className="block rounded-xl border bg-card p-4 transition-colors hover:bg-muted/40"
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-medium">
                    {workout.exercises[0]?.exercise.name ?? "Workout"}
                    {workout.exercises.length > 1
                      ? ` +${workout.exercises.length - 1}`
                      : ""}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(workout.startedAt, { addSuffix: true })} ·{" "}
                    {formatDuration(workout.startedAt, workout.endedAt)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
