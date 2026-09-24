import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { formatEquipment, formatMuscleGroup } from "@/lib/workout-utils";
import { CreateExerciseForm } from "@/components/exercises/create-exercise-form";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
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
    <div className="space-y-5">
      <PageHeader
        eyebrow="Library"
        title="Exercises"
        description="Built-in movements plus anything you add."
      />

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
          className="field-select max-w-48"
        >
          {muscles.map((m) => (
            <option key={m} value={m}>
              {m === "ALL" ? "All muscles" : formatMuscleGroup(m)}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="h-8 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          Filter
        </button>
      </form>

      <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
        {exercises.map((exercise) => (
          <div key={exercise.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
            <div>
              <p className="font-medium">{exercise.name}</p>
              <div className="mt-1 flex flex-wrap gap-1">
                <Badge variant="secondary">{formatMuscleGroup(exercise.muscleGroup)}</Badge>
                <Badge variant="outline">{formatEquipment(exercise.equipment)}</Badge>
                {exercise.isCustom && <Badge>Custom</Badge>}
              </div>
            </div>
          </div>
        ))}
        {exercises.length === 0 && (
          <p className="px-4 py-6 text-sm text-muted-foreground">No exercises match your filters.</p>
        )}
      </div>
    </div>
  );
}
