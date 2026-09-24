import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { RoutineBuilder } from "@/components/routines/routine-builder";
import { PageHeader } from "@/components/layout/page-header";

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
    <div className="space-y-5">
      <PageHeader eyebrow="Templates" title="Edit routine" description={routine.name} />
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
