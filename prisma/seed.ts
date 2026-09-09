import { PrismaClient, MuscleGroup, Equipment } from "@prisma/client";

const prisma = new PrismaClient();

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

async function main() {
  console.log("Seeding exercise library...");

  for (const exercise of exercises) {
    const existing = await prisma.exercise.findFirst({
      where: { name: exercise.name, isCustom: false },
    });

    if (!existing) {
      await prisma.exercise.create({
        data: {
          ...exercise,
          isCustom: false,
        },
      });
    }
  }

  console.log(`Seeded ${exercises.length} exercises.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
