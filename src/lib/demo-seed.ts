import { Equipment, MuscleGroup, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEMO_EMAIL, DEMO_NAME, DEMO_PASSWORD, DEMO_USERNAME } from "./demo-account";

const exercises: Array<{
  name: string;
  muscleGroup: MuscleGroup;
  equipment: Equipment;
}> = [
  { name: "Barbell Bench Press", muscleGroup: "CHEST", equipment: "BARBELL" },
  { name: "Incline Dumbbell Press", muscleGroup: "CHEST", equipment: "DUMBBELL" },
  { name: "Dumbbell Fly", muscleGroup: "CHEST", equipment: "DUMBBELL" },
  { name: "Cable Crossover", muscleGroup: "CHEST", equipment: "CABLE" },
  { name: "Push-Up", muscleGroup: "CHEST", equipment: "BODYWEIGHT" },
  { name: "Chest Press Machine", muscleGroup: "CHEST", equipment: "MACHINE" },
  { name: "Deadlift", muscleGroup: "BACK", equipment: "BARBELL" },
  { name: "Barbell Row", muscleGroup: "BACK", equipment: "BARBELL" },
  { name: "Pull-Up", muscleGroup: "BACK", equipment: "BODYWEIGHT" },
  { name: "Lat Pulldown", muscleGroup: "BACK", equipment: "CABLE" },
  { name: "Seated Cable Row", muscleGroup: "BACK", equipment: "CABLE" },
  { name: "Dumbbell Row", muscleGroup: "BACK", equipment: "DUMBBELL" },
  { name: "Face Pull", muscleGroup: "BACK", equipment: "CABLE" },
  { name: "Overhead Press", muscleGroup: "SHOULDERS", equipment: "BARBELL" },
  { name: "Dumbbell Shoulder Press", muscleGroup: "SHOULDERS", equipment: "DUMBBELL" },
  { name: "Lateral Raise", muscleGroup: "SHOULDERS", equipment: "DUMBBELL" },
  { name: "Front Raise", muscleGroup: "SHOULDERS", equipment: "DUMBBELL" },
  { name: "Rear Delt Fly", muscleGroup: "SHOULDERS", equipment: "DUMBBELL" },
  { name: "Barbell Curl", muscleGroup: "BICEPS", equipment: "BARBELL" },
  { name: "Dumbbell Curl", muscleGroup: "BICEPS", equipment: "DUMBBELL" },
  { name: "Hammer Curl", muscleGroup: "BICEPS", equipment: "DUMBBELL" },
  { name: "Cable Curl", muscleGroup: "BICEPS", equipment: "CABLE" },
  { name: "Preacher Curl", muscleGroup: "BICEPS", equipment: "MACHINE" },
  { name: "Tricep Pushdown", muscleGroup: "TRICEPS", equipment: "CABLE" },
  { name: "Skull Crusher", muscleGroup: "TRICEPS", equipment: "BARBELL" },
  { name: "Overhead Tricep Extension", muscleGroup: "TRICEPS", equipment: "DUMBBELL" },
  { name: "Close-Grip Bench Press", muscleGroup: "TRICEPS", equipment: "BARBELL" },
  { name: "Dips", muscleGroup: "TRICEPS", equipment: "BODYWEIGHT" },
  { name: "Wrist Curl", muscleGroup: "FOREARMS", equipment: "DUMBBELL" },
  { name: "Reverse Wrist Curl", muscleGroup: "FOREARMS", equipment: "DUMBBELL" },
  { name: "Plank", muscleGroup: "CORE", equipment: "BODYWEIGHT" },
  { name: "Hanging Leg Raise", muscleGroup: "CORE", equipment: "BODYWEIGHT" },
  { name: "Cable Crunch", muscleGroup: "CORE", equipment: "CABLE" },
  { name: "Russian Twist", muscleGroup: "CORE", equipment: "BODYWEIGHT" },
  { name: "Ab Wheel Rollout", muscleGroup: "CORE", equipment: "OTHER" },
  { name: "Back Squat", muscleGroup: "QUADS", equipment: "BARBELL" },
  { name: "Front Squat", muscleGroup: "QUADS", equipment: "BARBELL" },
  { name: "Leg Press", muscleGroup: "QUADS", equipment: "MACHINE" },
  { name: "Leg Extension", muscleGroup: "QUADS", equipment: "MACHINE" },
  { name: "Bulgarian Split Squat", muscleGroup: "QUADS", equipment: "DUMBBELL" },
  { name: "Walking Lunge", muscleGroup: "QUADS", equipment: "DUMBBELL" },
  { name: "Romanian Deadlift", muscleGroup: "HAMSTRINGS", equipment: "BARBELL" },
  { name: "Lying Leg Curl", muscleGroup: "HAMSTRINGS", equipment: "MACHINE" },
  { name: "Seated Leg Curl", muscleGroup: "HAMSTRINGS", equipment: "MACHINE" },
  { name: "Good Morning", muscleGroup: "HAMSTRINGS", equipment: "BARBELL" },
  { name: "Hip Thrust", muscleGroup: "GLUTES", equipment: "BARBELL" },
  { name: "Cable Kickback", muscleGroup: "GLUTES", equipment: "CABLE" },
  { name: "Glute Bridge", muscleGroup: "GLUTES", equipment: "BODYWEIGHT" },
  { name: "Standing Calf Raise", muscleGroup: "CALVES", equipment: "MACHINE" },
  { name: "Seated Calf Raise", muscleGroup: "CALVES", equipment: "MACHINE" },
  { name: "Farmers Walk", muscleGroup: "FULL_BODY", equipment: "DUMBBELL" },
  { name: "Kettlebell Swing", muscleGroup: "FULL_BODY", equipment: "KETTLEBELL" },
  { name: "Burpee", muscleGroup: "FULL_BODY", equipment: "BODYWEIGHT" },
];

type SetPlan = { weight: number; reps: number };

const demoSplits: Record<string, Array<{ name: string; sets: (week: number) => SetPlan[] }>> = {
  Push: [
    {
      name: "Barbell Bench Press",
      sets: (week) => [0, 1, 2].map(() => ({ weight: 75 + week * 2.5, reps: 5 })),
    },
    {
      name: "Overhead Press",
      sets: (week) => [0, 1, 2].map(() => ({ weight: 40 + week * 2.5, reps: 6 })),
    },
    {
      name: "Lateral Raise",
      sets: (week) => [0, 1, 2].map(() => ({ weight: 10 + week, reps: 12 })),
    },
  ],
  Pull: [
    {
      name: "Deadlift",
      sets: (week) => [0, 1, 2].map(() => ({ weight: 120 + week * 5, reps: 3 })),
    },
    {
      name: "Barbell Row",
      sets: (week) => [0, 1, 2].map(() => ({ weight: 60 + week * 2.5, reps: 8 })),
    },
    {
      name: "Lat Pulldown",
      sets: (week) => [0, 1, 2].map(() => ({ weight: 45 + week * 2.5, reps: 10 })),
    },
  ],
  Legs: [
    {
      name: "Back Squat",
      sets: (week) => [0, 1, 2].map(() => ({ weight: 100 + week * 5, reps: 5 })),
    },
    {
      name: "Romanian Deadlift",
      sets: (week) => [0, 1, 2].map(() => ({ weight: 80 + week * 2.5, reps: 8 })),
    },
    {
      name: "Leg Press",
      sets: (week) => [0, 1, 2].map(() => ({ weight: 140 + week * 10, reps: 10 })),
    },
  ],
};

const demoSessions = [
  { daysAgo: 20, split: "Push", week: 0 },
  { daysAgo: 18, split: "Pull", week: 0 },
  { daysAgo: 16, split: "Legs", week: 0 },
  { daysAgo: 13, split: "Push", week: 1 },
  { daysAgo: 11, split: "Pull", week: 1 },
  { daysAgo: 9, split: "Legs", week: 1 },
  { daysAgo: 6, split: "Push", week: 2 },
  { daysAgo: 4, split: "Pull", week: 2 },
  { daysAgo: 2, split: "Legs", week: 2 },
];

export type DemoSeedResult = {
  demoUserId: string;
  reset: boolean;
  history: "created" | "present";
  exerciseCount: number;
  routineCount: number;
  workoutCount: number;
};

function sessionStart(daysAgo: number) {
  const started = new Date();
  started.setHours(18, 10, 0, 0);
  started.setDate(started.getDate() - daysAgo);
  return started;
}

async function seedExerciseLibrary(prisma: PrismaClient) {
  const existing = await prisma.exercise.findMany({
    where: { isCustom: false },
    select: { name: true },
  });
  const have = new Set(existing.map((exercise) => exercise.name));
  const missing = exercises.filter((exercise) => !have.has(exercise.name));

  if (missing.length > 0) {
    await prisma.exercise.createMany({
      data: missing.map((exercise) => ({
        ...exercise,
        isCustom: false,
      })),
    });
  }

  return have.size + missing.length;
}

async function ensureDemoUser(prisma: PrismaClient) {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const identity = {
    email: DEMO_EMAIL,
    name: DEMO_NAME,
    passwordHash,
  };

  const byEmail = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
  if (byEmail) {
    return prisma.user.update({
      where: { id: byEmail.id },
      data: identity,
    });
  }

  const byUsername = await prisma.user.findUnique({ where: { username: DEMO_USERNAME } });
  if (byUsername) {
    return prisma.user.update({
      where: { id: byUsername.id },
      data: identity,
    });
  }

  return prisma.user.create({
    data: {
      ...identity,
      username: DEMO_USERNAME,
    },
  });
}

async function exerciseIdMap(prisma: PrismaClient) {
  const library = await prisma.exercise.findMany({
    where: { isCustom: false },
    select: { id: true, name: true },
  });
  return new Map(library.map((exercise) => [exercise.name, exercise.id]));
}

function exerciseIdOrThrow(exerciseIds: Map<string, string>, name: string) {
  const exerciseId = exerciseIds.get(name);
  if (!exerciseId) throw new Error(`Missing seeded exercise: ${name}`);
  return exerciseId;
}

async function createDemoRoutines(
  prisma: PrismaClient,
  userId: string,
  exerciseIds: Map<string, string>
) {
  const routineIds = new Map<string, string>();

  for (const [name, plans] of Object.entries(demoSplits)) {
    const routine = await prisma.routine.create({
      data: {
        userId,
        name,
        exercises: {
          create: plans.map((plan, order) => ({
            exerciseId: exerciseIdOrThrow(exerciseIds, plan.name),
            order,
            targetSets: 3,
            targetReps: plan.sets(0)[0]?.reps ?? 8,
          })),
        },
      },
    });
    routineIds.set(name, routine.id);
  }

  return routineIds;
}

async function createDemoWorkouts(
  prisma: PrismaClient,
  userId: string,
  exerciseIds: Map<string, string>,
  routineIds: Map<string, string>
) {
  for (const session of demoSessions) {
    const plans = demoSplits[session.split];
    const startedAt = sessionStart(session.daysAgo);
    const endedAt = new Date(startedAt.getTime() + 58 * 60 * 1000);
    await prisma.workout.create({
      data: {
        userId,
        routineId: routineIds.get(session.split) ?? null,
        startedAt,
        endedAt,
        exercises: {
          create: plans.map((plan, order) => ({
            exerciseId: exerciseIdOrThrow(exerciseIds, plan.name),
            order,
            sets: {
              create: plan.sets(session.week).map((set, index) => ({
                setNumber: index + 1,
                weight: set.weight,
                reps: set.reps,
                completed: true,
              })),
            },
          })),
        },
      },
    });
  }
}

async function deleteDemoGeneratedData(prisma: PrismaClient, userId: string) {
  await prisma.$transaction(
    async (tx) => {
      await tx.follow.deleteMany({
        where: { OR: [{ followerId: userId }, { followingId: userId }] },
      });

      await tx.workoutLike.deleteMany({
        where: { OR: [{ userId }, { workout: { userId } }] },
      });

      await tx.workout.deleteMany({ where: { userId } });
      await tx.routine.deleteMany({ where: { userId } });

      const custom = await tx.exercise.findMany({
        where: { createdById: userId, isCustom: true },
        select: { id: true },
      });
      if (custom.length === 0) return;

      const ids = custom.map((exercise) => exercise.id);
      const [workoutRefs, routineRefs] = await Promise.all([
        tx.workoutExercise.findMany({
          where: { exerciseId: { in: ids }, workout: { userId: { not: userId } } },
          select: { exerciseId: true },
        }),
        tx.routineExercise.findMany({
          where: { exerciseId: { in: ids }, routine: { userId: { not: userId } } },
          select: { exerciseId: true },
        }),
      ]);
      const blocked = new Set([
        ...workoutRefs.map((row) => row.exerciseId),
        ...routineRefs.map((row) => row.exerciseId),
      ]);
      const deletable = ids.filter((id) => !blocked.has(id));
      if (deletable.length > 0) {
        await tx.exercise.deleteMany({ where: { id: { in: deletable } } });
      }
    },
    { timeout: 30_000, maxWait: 10_000 }
  );
}

async function demoCounts(prisma: PrismaClient, userId: string, exerciseCount: number) {
  const [routineCount, workoutCount] = await Promise.all([
    prisma.routine.count({ where: { userId } }),
    prisma.workout.count({ where: { userId, endedAt: { not: null } } }),
  ]);
  return { exerciseCount, routineCount, workoutCount };
}

export async function seedDatabase(
  prisma: PrismaClient,
  options?: { resetDemo?: boolean }
): Promise<DemoSeedResult> {
  const exerciseCount = await seedExerciseLibrary(prisma);
  const user = await ensureDemoUser(prisma);
  const reset = Boolean(options?.resetDemo);

  if (reset) {
    await deleteDemoGeneratedData(prisma, user.id);
    const exerciseIds = await exerciseIdMap(prisma);
    const routineIds = await createDemoRoutines(prisma, user.id, exerciseIds);
    await createDemoWorkouts(prisma, user.id, exerciseIds, routineIds);
    return {
      demoUserId: user.id,
      reset: true,
      history: "created",
      ...(await demoCounts(prisma, user.id, exerciseCount)),
    };
  }

  const [completedCount, routineCount] = await Promise.all([
    prisma.workout.count({ where: { userId: user.id, endedAt: { not: null } } }),
    prisma.routine.count({ where: { userId: user.id } }),
  ]);

  if (completedCount > 0 && routineCount > 0) {
    return {
      demoUserId: user.id,
      reset: false,
      history: "present",
      ...(await demoCounts(prisma, user.id, exerciseCount)),
    };
  }

  const exerciseIds = await exerciseIdMap(prisma);
  let routineIds: Map<string, string>;
  if (routineCount === 0) {
    routineIds = await createDemoRoutines(prisma, user.id, exerciseIds);
  } else {
    const routines = await prisma.routine.findMany({
      where: { userId: user.id, name: { in: Object.keys(demoSplits) } },
      select: { id: true, name: true },
    });
    routineIds = new Map(routines.map((routine) => [routine.name, routine.id]));
  }

  if (completedCount === 0) {
    await createDemoWorkouts(prisma, user.id, exerciseIds, routineIds);
  }

  return {
    demoUserId: user.id,
    reset: false,
    history: "created",
    ...(await demoCounts(prisma, user.id, exerciseCount)),
  };
}
