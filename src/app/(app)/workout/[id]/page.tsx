import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { ActiveWorkout, type LastTime } from "@/components/workout/active-workout";
import { isPlaceholder, kgToTenths } from "@/lib/sets";

export default async function WorkoutSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const [workout, exerciseLibrary, recent] = await Promise.all([
    prisma.workout.findFirst({
      where: { id, userId: user.id },
      include: {
        exercises: {
          orderBy: { order: "asc" },
          include: {
            exercise: true,
            sets: { orderBy: { setNumber: "asc" } },
          },
        },
      },
    }),
    prisma.exercise.findMany({
      where: {
        OR: [{ isCustom: false }, { createdById: user.id }],
      },
      orderBy: { name: "asc" },
    }),
    // Most recent finished sessions, for "Last time" and stepper prefill.
    prisma.workoutExercise.findMany({
      where: { workout: { userId: user.id, endedAt: { not: null } } },
      orderBy: { workout: { endedAt: "desc" } },
      take: 200,
      select: {
        exerciseId: true,
        sets: {
          where: { completed: true, isWarmup: false },
          orderBy: { setNumber: "asc" },
          select: { weight: true, reps: true },
        },
      },
    }),
  ]);

  if (!workout) notFound();
  if (workout.endedAt) redirect(`/history/${workout.id}`);

  const lastTime: Record<string, LastTime> = {};
  for (const entry of recent) {
    if (lastTime[entry.exerciseId] || entry.sets.length === 0) continue;
    lastTime[entry.exerciseId] = entry.sets.map((set) => ({
      weightTenths: kgToTenths(set.weight),
      reps: set.reps,
    }));
  }

  return (
    <ActiveWorkout
      workoutId={workout.id}
      startedAt={workout.startedAt.toISOString()}
      notes={workout.notes ?? ""}
      exerciseLibrary={exerciseLibrary}
      lastTime={lastTime}
      initialExercises={workout.exercises.map((ex, index) => ({
        key: `${ex.exerciseId}-${index}`,
        exerciseId: ex.exerciseId,
        name: ex.exercise.name,
        sets: ex.sets
          .filter((set) => !isPlaceholder(set))
          .map((set, i) => ({
            setNumber: i + 1,
            weightTenths: kgToTenths(set.weight),
            reps: set.reps,
            isWarmup: set.isWarmup,
            completed: true,
          })),
      }))}
    />
  );
}
