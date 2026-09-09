import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { ActiveWorkout } from "@/components/workout/active-workout";

export default async function WorkoutSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const [workout, exerciseLibrary] = await Promise.all([
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
  ]);

  if (!workout) notFound();

  if (workout.endedAt) {
    const { redirect } = await import("next/navigation");
    redirect(`/history/${workout.id}`);
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Active workout</h1>
        <p className="text-muted-foreground">Log sets as you go. Rest timer is below.</p>
      </div>
      <ActiveWorkout
        workoutId={workout.id}
        notes={workout.notes ?? ""}
        exerciseLibrary={exerciseLibrary}
        initialExercises={workout.exercises.map((ex) => ({
          exerciseId: ex.exerciseId,
          name: ex.exercise.name,
          sets: ex.sets.map((set) => ({
            setNumber: set.setNumber,
            weight: set.weight,
            reps: set.reps,
            rpe: set.rpe,
            isWarmup: set.isWarmup,
            completed: set.completed,
          })),
        }))}
      />
    </div>
  );
}
