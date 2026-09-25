import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { ActiveWorkout } from "@/components/workout/active-workout";
import { PageHeader } from "@/components/layout/page-header";

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
    <div className="md:space-y-4">
      <div className="hidden md:block">
        <PageHeader
          eyebrow="Session"
          title="Active workout"
          description="Log sets as you go. Rest timer sits above the list."
        />
      </div>
      <ActiveWorkout
        workoutId={workout.id}
        startedAt={workout.startedAt.toISOString()}
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
