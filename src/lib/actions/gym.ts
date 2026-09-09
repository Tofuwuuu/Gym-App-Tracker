"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { exerciseSchema, routineSchema, workoutSaveSchema } from "@/lib/validations";

export type ActionResult = {
  error?: string;
  success?: boolean;
  id?: string;
};

export async function createCustomExercise(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = exerciseSchema.safeParse({
    name: formData.get("name"),
    muscleGroup: formData.get("muscleGroup"),
    equipment: formData.get("equipment"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const exercise = await prisma.exercise.create({
    data: {
      ...parsed.data,
      isCustom: true,
      createdById: user.id,
    },
  });

  revalidatePath("/exercises");
  return { success: true, id: exercise.id };
}

export async function createRoutine(data: {
  name: string;
  notes?: string;
  exercises: Array<{ exerciseId: string; targetSets: number; targetReps: number }>;
}): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = routineSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const routine = await prisma.routine.create({
    data: {
      name: parsed.data.name,
      notes: parsed.data.notes,
      userId: user.id,
      exercises: {
        create: parsed.data.exercises.map((ex, index) => ({
          exerciseId: ex.exerciseId,
          order: index,
          targetSets: ex.targetSets,
          targetReps: ex.targetReps,
        })),
      },
    },
  });

  revalidatePath("/routines");
  return { success: true, id: routine.id };
}

export async function updateRoutine(
  routineId: string,
  data: {
    name: string;
    notes?: string;
    exercises: Array<{ exerciseId: string; targetSets: number; targetReps: number }>;
  }
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = routineSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const existing = await prisma.routine.findFirst({
    where: { id: routineId, userId: user.id },
  });
  if (!existing) return { error: "Routine not found" };

  await prisma.$transaction([
    prisma.routineExercise.deleteMany({ where: { routineId } }),
    prisma.routine.update({
      where: { id: routineId },
      data: {
        name: parsed.data.name,
        notes: parsed.data.notes,
        exercises: {
          create: parsed.data.exercises.map((ex, index) => ({
            exerciseId: ex.exerciseId,
            order: index,
            targetSets: ex.targetSets,
            targetReps: ex.targetReps,
          })),
        },
      },
    }),
  ]);

  revalidatePath("/routines");
  revalidatePath(`/routines/${routineId}/edit`);
  return { success: true, id: routineId };
}

export async function deleteRoutine(routineId: string): Promise<ActionResult> {
  const user = await requireUser();
  const existing = await prisma.routine.findFirst({
    where: { id: routineId, userId: user.id },
  });
  if (!existing) return { error: "Routine not found" };

  await prisma.routine.delete({ where: { id: routineId } });
  revalidatePath("/routines");
  return { success: true };
}

export async function deleteRoutineForm(routineId: string, _formData?: FormData) {
  await deleteRoutine(routineId);
}

export async function startWorkout(routineId?: string | FormData) {
  const user = await requireUser();
  const resolvedRoutineId = typeof routineId === "string" ? routineId : undefined;

  let routineExercises: Array<{
    exerciseId: string;
    order: number;
    targetSets: number;
  }> = [];

  if (resolvedRoutineId) {
    const routine = await prisma.routine.findFirst({
      where: { id: resolvedRoutineId, userId: user.id },
      include: { exercises: { orderBy: { order: "asc" } } },
    });
    if (routine) {
      routineExercises = routine.exercises.map((ex) => ({
        exerciseId: ex.exerciseId,
        order: ex.order,
        targetSets: ex.targetSets,
      }));
    }
  }

  const workout = await prisma.workout.create({
    data: {
      userId: user.id,
      routineId: resolvedRoutineId || null,
      exercises: {
        create: routineExercises.map((ex) => ({
          exerciseId: ex.exerciseId,
          order: ex.order,
          sets: {
            create: Array.from({ length: ex.targetSets }, (_, i) => ({
              setNumber: i + 1,
              weight: 0,
              reps: 0,
              completed: false,
            })),
          },
        })),
      },
    },
  });

  redirect(`/workout/${workout.id}`);
}

export async function saveWorkout(data: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = workoutSaveSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const workout = await prisma.workout.findFirst({
    where: { id: parsed.data.workoutId, userId: user.id },
  });
  if (!workout) return { error: "Workout not found" };

  await prisma.$transaction(async (tx) => {
    await tx.workoutExercise.deleteMany({ where: { workoutId: workout.id } });

    for (const [index, exercise] of parsed.data.exercises.entries()) {
      await tx.workoutExercise.create({
        data: {
          workoutId: workout.id,
          exerciseId: exercise.exerciseId,
          order: index,
          sets: {
            create: exercise.sets.map((set) => ({
              setNumber: set.setNumber,
              weight: set.weight,
              reps: set.reps,
              rpe: set.rpe ?? null,
              isWarmup: set.isWarmup ?? false,
              completed: set.completed ?? true,
            })),
          },
        },
      });
    }

    await tx.workout.update({
      where: { id: workout.id },
      data: {
        notes: parsed.data.notes,
        endedAt: new Date(),
      },
    });
  });

  revalidatePath("/history");
  revalidatePath("/dashboard");
  revalidatePath("/progress");
  revalidatePath("/feed");
  redirect(`/history/${workout.id}`);
}

export async function discardWorkout(workoutId: string): Promise<ActionResult> {
  const user = await requireUser();
  const workout = await prisma.workout.findFirst({
    where: { id: workoutId, userId: user.id },
  });
  if (!workout) return { error: "Workout not found" };

  await prisma.workout.delete({ where: { id: workoutId } });
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function toggleFollow(username: string): Promise<ActionResult> {
  const user = await requireUser();
  const target = await prisma.user.findUnique({ where: { username } });
  if (!target) return { error: "User not found" };
  if (target.id === user.id) return { error: "Cannot follow yourself" };

  const existing = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: user.id,
        followingId: target.id,
      },
    },
  });

  if (existing) {
    await prisma.follow.delete({ where: { id: existing.id } });
  } else {
    await prisma.follow.create({
      data: {
        followerId: user.id,
        followingId: target.id,
      },
    });
  }

  revalidatePath(`/profile/${username}`);
  revalidatePath("/feed");
  return { success: true };
}

export async function toggleWorkoutLike(workoutId: string): Promise<ActionResult> {
  const user = await requireUser();
  const workout = await prisma.workout.findUnique({ where: { id: workoutId } });
  if (!workout) return { error: "Workout not found" };

  const existing = await prisma.workoutLike.findUnique({
    where: {
      workoutId_userId: {
        workoutId,
        userId: user.id,
      },
    },
  });

  if (existing) {
    await prisma.workoutLike.delete({ where: { id: existing.id } });
  } else {
    await prisma.workoutLike.create({
      data: { workoutId, userId: user.id },
    });
  }

  revalidatePath("/feed");
  revalidatePath(`/history/${workoutId}`);
  return { success: true };
}
