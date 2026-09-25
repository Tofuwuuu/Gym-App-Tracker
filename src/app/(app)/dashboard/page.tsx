import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  Dumbbell,
  Play,
  TrendingUp,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import {
  calculateVolume,
  consecutiveTrainingStreak,
  formatCompactVolume,
  formatDuration,
  formatEquipment,
  localDateKey,
} from "@/lib/workout-utils";
import { startWorkout } from "@/lib/actions/gym";
import { StatCard } from "@/components/dashboard/stat-card";
import { WorkoutHeatmap } from "@/components/charts/workout-heatmap";
import { EquipmentUsageChart } from "@/components/charts/equipment-chart";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function DashboardPage() {
  const user = await requireUser();
  const year = new Date().getFullYear();

  const [routines, workouts, activeWorkout] = await Promise.all([
    prisma.routine.findMany({
      where: { userId: user.id },
      include: {
        exercises: { include: { exercise: true }, orderBy: { order: "asc" } },
      },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
    prisma.workout.findMany({
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
    }),
    prisma.workout.findFirst({
      where: { userId: user.id, endedAt: null },
      orderBy: { startedAt: "desc" },
    }),
  ]);

  const totalSets = workouts.reduce(
    (sum, workout) =>
      sum +
      workout.exercises.reduce(
        (inner, ex) =>
          inner + ex.sets.filter((set) => set.completed && !set.isWarmup).length,
        0
      ),
    0
  );

  const totalVolume = workouts.reduce(
    (sum, workout) =>
      sum + workout.exercises.reduce((inner, ex) => inner + calculateVolume(ex.sets), 0),
    0
  );

  const uniqueExercises = new Set(
    workouts.flatMap((workout) => workout.exercises.map((ex) => ex.exerciseId))
  ).size;

  const dayCountsMap = new Map<string, number>();
  for (const workout of workouts) {
    if (workout.startedAt.getFullYear() !== year) continue;
    const key = localDateKey(workout.startedAt);
    dayCountsMap.set(key, (dayCountsMap.get(key) ?? 0) + 1);
  }
  const heatmapDays = Array.from(dayCountsMap.entries()).map(([date, count]) => ({
    date,
    count,
  }));

  const streak = consecutiveTrainingStreak(dayCountsMap.keys());

  const equipmentMap = new Map<string, number>();
  for (const workout of workouts) {
    for (const ex of workout.exercises) {
      const key = ex.exercise.equipment;
      const sets = ex.sets.filter((s) => s.completed && !s.isWarmup).length || 1;
      equipmentMap.set(key, (equipmentMap.get(key) ?? 0) + sets);
    }
  }
  const equipmentData = Array.from(equipmentMap.entries())
    .map(([key, value]) => ({
      key,
      name: formatEquipment(key),
      value,
    }))
    .sort((a, b) => b.value - a.value);

  const recent = workouts.slice(0, 8);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={`Season ${year}`}
        title="Overview"
        description={`${streak} day streak · training snapshot`}
        action={
          activeWorkout ? (
            <Button render={<Link href={`/workout/${activeWorkout.id}`} />}>
              Resume workout
            </Button>
          ) : (
            <form action={startWorkout.bind(null, undefined)}>
              <Button type="submit">
                <Play className="size-4" />
                Start workout
              </Button>
            </form>
          )
        }
      />

      <div className="flex w-full flex-col gap-5">
      {/* Full-width slot above the stats for a future suggested next workout card. */}
      <div className="grid w-full grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border xl:grid-cols-4">
        <StatCard label="Total Sets" value={String(totalSets)} icon={Dumbbell} />
        <StatCard
          label="Total Volume"
          value={formatCompactVolume(totalVolume)}
          icon={TrendingUp}
        />
        <StatCard
          label="Workouts"
          value={String(workouts.length)}
          icon={CalendarDays}
        />
        <StatCard
          label="Exercises"
          value={String(uniqueExercises)}
          icon={Dumbbell}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="font-heading text-xl uppercase tracking-wide">Calendar</CardTitle>
            <p className="text-sm text-muted-foreground">Streak {streak} days</p>
          </div>
          <div className="rounded-md border border-border px-2.5 py-1 font-mono text-xs text-primary">
            {year}
          </div>
        </CardHeader>
        <CardContent>
          <WorkoutHeatmap year={year} days={heatmapDays} />
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,17.5rem)_minmax(0,1fr)]">
        <EquipmentUsageChart data={equipmentData} />

        <Card className="border shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-xl uppercase tracking-wide">Today</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="workouts">
              <TabsList className="mb-4">
                <TabsTrigger value="workouts">Workouts</TabsTrigger>
                <TabsTrigger value="splits">Splits</TabsTrigger>
                <TabsTrigger value="exercises">Exercises</TabsTrigger>
              </TabsList>

              <TabsContent value="workouts" className="space-y-2">
                {recent.length === 0 && (
                  <p className="py-6 text-sm text-muted-foreground">
                    No completed workouts yet. Start one from Quick Actions.
                  </p>
                )}
                {recent.map((workout) => {
                  const volume = workout.exercises.reduce(
                    (sum, ex) => sum + calculateVolume(ex.sets),
                    0
                  );
                  return (
                    <Link
                      key={workout.id}
                      href={`/history/${workout.id}`}
                      className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2 hover:border-primary/40"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {workout.exercises[0]?.exercise.name ?? "Workout"}
                          {workout.exercises.length > 1
                            ? ` +${workout.exercises.length - 1}`
                            : ""}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDuration(workout.startedAt, workout.endedAt)} ·{" "}
                          {Math.round(volume).toLocaleString()} kg
                        </p>
                      </div>
                      <ArrowUpRight className="size-4 text-muted-foreground" />
                    </Link>
                  );
                })}
              </TabsContent>

              <TabsContent value="splits" className="space-y-2">
                {routines.length === 0 && (
                  <div className="space-y-3 py-4">
                    <p className="text-sm text-muted-foreground">
                      No routines yet. Build Push / Pull / Legs templates.
                    </p>
                    <Button render={<Link href="/routines/new" />}>Create routine</Button>
                  </div>
                )}
                {routines.map((routine) => (
                  <div
                    key={routine.id}
                    className="flex items-center justify-between rounded-lg border px-3 py-2.5"
                  >
                    <div>
                      <p className="text-sm font-medium">{routine.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {routine.exercises.length} exercises
                      </p>
                    </div>
                    <form action={startWorkout.bind(null, routine.id)}>
                      <Button type="submit" size="sm" variant="outline">
                        Start
                      </Button>
                    </form>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="exercises" className="space-y-3 py-2">
                <p className="text-sm text-muted-foreground">
                  Browse the library or add custom movements.
                </p>
                <Button variant="outline" render={<Link href="/exercises" />}>
                  Open exercise database
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
}
