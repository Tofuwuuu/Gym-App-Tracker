import { format } from "date-fns";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { calculateVolume, estimateOneRepMax } from "@/lib/workout-utils";
import { OneRepMaxChart, VolumeChart } from "@/components/charts/progress-charts";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ProgressPage() {
  const user = await requireUser();

  const workouts = await prisma.workout.findMany({
    where: { userId: user.id, endedAt: { not: null } },
    orderBy: { startedAt: "asc" },
    include: {
      exercises: {
        include: {
          exercise: true,
          sets: true,
        },
      },
    },
  });

  const volumeData = workouts.map((workout) => ({
    date: format(workout.startedAt, "MMM d"),
    volume: Math.round(
      workout.exercises.reduce((sum, ex) => sum + calculateVolume(ex.sets), 0)
    ),
  }));

  const prMap = new Map<
    string,
    { name: string; weight: number; reps: number; oneRepMax: number; date: Date }
  >();

  const oneRmSeries = new Map<string, Array<{ date: string; oneRepMax: number }>>();

  for (const workout of workouts) {
    for (const ex of workout.exercises) {
      for (const set of ex.sets) {
        if (set.isWarmup || !set.completed || set.reps <= 0 || set.weight <= 0) continue;
        const orm = estimateOneRepMax(set.weight, set.reps);
        const current = prMap.get(ex.exerciseId);
        if (!current || orm > current.oneRepMax) {
          prMap.set(ex.exerciseId, {
            name: ex.exercise.name,
            weight: set.weight,
            reps: set.reps,
            oneRepMax: orm,
            date: workout.startedAt,
          });
        }

        const series = oneRmSeries.get(ex.exerciseId) ?? [];
        const date = format(workout.startedAt, "MMM d");
        const last = series[series.length - 1];
        if (last?.date === date) {
          if (orm > last.oneRepMax) last.oneRepMax = orm;
        } else {
          series.push({ date, oneRepMax: orm });
        }
        oneRmSeries.set(ex.exerciseId, series);
      }
    }
  }

  const prs = Array.from(prMap.values()).sort((a, b) => b.oneRepMax - a.oneRepMax);
  const topExerciseId = Array.from(prMap.entries()).sort(
    (a, b) => b[1].oneRepMax - a[1].oneRepMax
  )[0]?.[0];
  const topSeries = topExerciseId ? oneRmSeries.get(topExerciseId) ?? [] : [];
  const topName = topExerciseId ? prMap.get(topExerciseId)?.name : undefined;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Strength"
        title="Progress"
        description="Volume trends, estimated 1RM, and personal records."
      />

      <VolumeChart data={volumeData} />
      <OneRepMaxChart
        data={topSeries}
        title={topName ? `Estimated 1RM · ${topName}` : "Estimated 1RM"}
      />

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-xl uppercase tracking-wide">Personal records</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {prs.length === 0 && (
            <p className="text-sm text-muted-foreground">Hit some working sets to unlock PRs.</p>
          )}
          {prs.slice(0, 12).map((pr) => (
            <div
              key={pr.name}
              className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium">{pr.name}</p>
                <p className="text-muted-foreground">
                  {pr.weight} kg × {pr.reps}
                </p>
              </div>
              <div className="text-right">
                <p className="font-heading text-xl uppercase text-primary">{pr.oneRepMax}</p>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  est 1RM · {format(pr.date, "MMM d")}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
