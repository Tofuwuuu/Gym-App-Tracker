import { z } from "zod";

export const signUpSchema = z.object({
  name: z.string().min(1, "Name is required").max(80),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const signInSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

export const exerciseSchema = z.object({
  name: z.string().min(1).max(100),
  muscleGroup: z.enum([
    "CHEST",
    "BACK",
    "SHOULDERS",
    "BICEPS",
    "TRICEPS",
    "FOREARMS",
    "CORE",
    "QUADS",
    "HAMSTRINGS",
    "GLUTES",
    "CALVES",
    "FULL_BODY",
    "OTHER",
  ]),
  equipment: z.enum([
    "BARBELL",
    "DUMBBELL",
    "MACHINE",
    "CABLE",
    "BODYWEIGHT",
    "KETTLEBELL",
    "BAND",
    "OTHER",
  ]),
});

export const routineSchema = z.object({
  name: z.string().min(1).max(100),
  notes: z.string().max(500).optional(),
  exercises: z
    .array(
      z.object({
        exerciseId: z.string().min(1),
        targetSets: z.number().int().min(1).max(20),
        targetReps: z.number().int().min(1).max(100),
      })
    )
    .min(1, "Add at least one exercise"),
});

export const setEntrySchema = z.object({
  setNumber: z.number().int().min(1),
  weight: z.number().min(0),
  reps: z.number().int().min(0),
  rpe: z.number().min(1).max(10).optional().nullable(),
  isWarmup: z.boolean().optional(),
  completed: z.boolean().optional(),
});

export const workoutSaveSchema = z.object({
  workoutId: z.string().min(1),
  notes: z.string().max(1000).optional(),
  exercises: z.array(
    z.object({
      exerciseId: z.string().min(1),
      sets: z.array(setEntrySchema),
    })
  ),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type ExerciseInput = z.infer<typeof exerciseSchema>;
export type RoutineInput = z.infer<typeof routineSchema>;
export type WorkoutSaveInput = z.infer<typeof workoutSaveSchema>;
