import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { RoutineBuilder } from "@/components/routines/routine-builder";

export default async function EditRoutinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const [routine, exercises] = await Promise.all([
    prisma.routine.findFirst({
      where: { id, userId: user.id },
      include: {
        exercises: {
          include: { exercise: true },
          orderBy: { order: "asc" },
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

  if (!routine) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit routine</h1>
        <p className="text-muted-foreground">{routine.name}</p>
      </div>
      <RoutineBuilder
        routineId={routine.id}
        exerciseLibrary={exercises}
        initialName={routine.name}
        initialNotes={routine.notes ?? ""}
        initialExercises={routine.exercises.map((ex) => ({
          exerciseId: ex.exerciseId,
          name: ex.exercise.name,
          targetSets: ex.targetSets,
          targetReps: ex.targetReps,
        }))}
      />
    </div>
  );
}
