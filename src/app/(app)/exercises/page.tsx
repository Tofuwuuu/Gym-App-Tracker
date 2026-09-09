import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { formatEquipment, formatMuscleGroup } from "@/lib/workout-utils";
import { CreateExerciseForm } from "@/components/exercises/create-exercise-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default async function ExercisesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; muscle?: string }>;
}) {
  const user = await requireUser();
  const { q, muscle } = await searchParams;

  const exercises = await prisma.exercise.findMany({
    where: {
      AND: [
        { OR: [{ isCustom: false }, { createdById: user.id }] },
        q
          ? {
              name: {
                contains: q,
                mode: "insensitive",
              },
            }
          : {},
        muscle && muscle !== "ALL" ? { muscleGroup: muscle as never } : {},
      ],
    },
    orderBy: [{ isCustom: "asc" }, { name: "asc" }],
  });

  const muscles = [
    "ALL",
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
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Exercises</h1>
        <p className="text-muted-foreground">
          Built-in library plus your custom movements.
        </p>
      </div>

      <CreateExerciseForm />

      <form className="flex flex-wrap gap-2">
        <Input
          name="q"
          defaultValue={q}
          placeholder="Search exercises..."
          className="max-w-sm"
        />
        <select
          name="muscle"
          defaultValue={muscle ?? "ALL"}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
        >
          {muscles.map((m) => (
            <option key={m} value={m}>
              {m === "ALL" ? "All muscles" : formatMuscleGroup(m)}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="h-8 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground"
        >
          Filter
        </button>
      </form>

      <div className="space-y-2">
        {exercises.map((exercise) => (
          <Card key={exercise.id}>
            <CardContent className="flex items-center justify-between gap-3 py-3">
              <div>
                <p className="font-medium">{exercise.name}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  <Badge variant="secondary">
                    {formatMuscleGroup(exercise.muscleGroup)}
                  </Badge>
                  <Badge variant="outline">
                    {formatEquipment(exercise.equipment)}
                  </Badge>
                  {exercise.isCustom && <Badge>Custom</Badge>}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {exercises.length === 0 && (
          <p className="text-sm text-muted-foreground">No exercises match your filters.</p>
        )}
      </div>
    </div>
  );
}
