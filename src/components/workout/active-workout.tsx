"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { discardWorkout, saveWorkout } from "@/lib/actions/gym";
import { RestTimer } from "@/components/workout/rest-timer";
import { ExercisePicker, type ExerciseOption } from "@/components/workout/exercise-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type SetDraft = {
  setNumber: number;
  weight: number;
  reps: number;
  rpe?: number | null;
  isWarmup: boolean;
  completed: boolean;
};

type ExerciseDraft = {
  key: string;
  exerciseId: string;
  name: string;
  sets: SetDraft[];
};

export function ActiveWorkout({
  workoutId,
  initialExercises,
  exerciseLibrary,
  notes: initialNotes = "",
}: {
  workoutId: string;
  initialExercises: Array<{
    exerciseId: string;
    name: string;
    sets: SetDraft[];
  }>;
  exerciseLibrary: ExerciseOption[];
  notes?: string;
}) {
  const [exercises, setExercises] = useState<ExerciseDraft[]>(
    initialExercises.map((ex, index) => ({
      key: `${ex.exerciseId}-${index}`,
      ...ex,
    }))
  );
  const [notes, setNotes] = useState(initialNotes);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const excludeIds = useMemo(() => exercises.map((e) => e.exerciseId), [exercises]);

  function updateSet(
    exerciseKey: string,
    setNumber: number,
    field: keyof SetDraft,
    value: number | boolean | null
  ) {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.key !== exerciseKey
          ? ex
          : {
              ...ex,
              sets: ex.sets.map((set) =>
                set.setNumber !== setNumber ? set : { ...set, [field]: value }
              ),
            }
      )
    );
  }

  function addSet(exerciseKey: string) {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.key !== exerciseKey) return ex;
        const last = ex.sets[ex.sets.length - 1];
        return {
          ...ex,
          sets: [
            ...ex.sets,
            {
              setNumber: ex.sets.length + 1,
              weight: last?.weight ?? 0,
              reps: last?.reps ?? 0,
              isWarmup: false,
              completed: false,
            },
          ],
        };
      })
    );
  }

  function removeExercise(exerciseKey: string) {
    setExercises((prev) => prev.filter((ex) => ex.key !== exerciseKey));
  }

  function addExercise(exercise: ExerciseOption) {
    setExercises((prev) => [
      ...prev,
      {
        key: `${exercise.id}-${Date.now()}`,
        exerciseId: exercise.id,
        name: exercise.name,
        sets: [
          { setNumber: 1, weight: 0, reps: 0, isWarmup: false, completed: false },
          { setNumber: 2, weight: 0, reps: 0, isWarmup: false, completed: false },
          { setNumber: 3, weight: 0, reps: 0, isWarmup: false, completed: false },
        ],
      },
    ]);
    setPickerOpen(false);
  }

  function finish() {
    if (exercises.length === 0) {
      toast.error("Add at least one exercise");
      return;
    }
    startTransition(async () => {
      const result = await saveWorkout({
        workoutId,
        notes,
        exercises: exercises.map((ex) => ({
          exerciseId: ex.exerciseId,
          sets: ex.sets,
        })),
      });
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <div className="space-y-4">
      <RestTimer />

      {exercises.map((exercise) => (
        <Card key={exercise.key}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="font-heading text-xl uppercase tracking-wide">
              {exercise.name}
            </CardTitle>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              aria-label={`Remove ${exercise.name}`}
              onClick={() => removeExercise(exercise.key)}
            >
              <Trash2 className="size-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-1.5">
            <div className="grid grid-cols-[32px_1fr_1fr_36px] gap-2 px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              <span>Set</span>
              <span>Kg</span>
              <span>Reps</span>
              <span className="sr-only">Done</span>
            </div>
            {exercise.sets.map((set) => (
              <div
                key={set.setNumber}
                className={
                  set.completed
                    ? "grid grid-cols-[32px_1fr_1fr_36px] items-center gap-2 rounded-lg bg-primary/10 px-1 py-1"
                    : "grid grid-cols-[32px_1fr_1fr_36px] items-center gap-2 px-1 py-1"
                }
              >
                <span className="font-mono text-sm text-muted-foreground">{set.setNumber}</span>
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  aria-label={`Set ${set.setNumber} weight in kilograms`}
                  value={set.weight}
                  onChange={(e) =>
                    updateSet(exercise.key, set.setNumber, "weight", Number(e.target.value))
                  }
                />
                <Input
                  type="number"
                  min={0}
                  aria-label={`Set ${set.setNumber} reps`}
                  value={set.reps}
                  onChange={(e) =>
                    updateSet(exercise.key, set.setNumber, "reps", Number(e.target.value))
                  }
                />
                <Button
                  type="button"
                  size="icon"
                  variant={set.completed ? "default" : "outline"}
                  aria-pressed={set.completed}
                  aria-label={set.completed ? "Mark set incomplete" : "Mark set complete"}
                  className="rounded-full"
                  onClick={() =>
                    updateSet(exercise.key, set.setNumber, "completed", !set.completed)
                  }
                >
                  {set.completed ? "✓" : ""}
                </Button>
              </div>
            ))}
            <Button type="button" variant="ghost" size="sm" onClick={() => addSet(exercise.key)}>
              <Plus className="size-4" />
              Add set
            </Button>
          </CardContent>
        </Card>
      ))}

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogTrigger render={<Button variant="outline" className="w-full" />}>
          <Plus className="size-4" />
          Add exercise
        </DialogTrigger>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add exercise</DialogTitle>
          </DialogHeader>
          <ExercisePicker
            exercises={exerciseLibrary}
            excludeIds={excludeIds}
            onSelect={addExercise}
          />
        </DialogContent>
      </Dialog>

      <div className="space-y-2">
        <label className="text-sm font-medium">Notes</label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="How did the session feel?"
        />
      </div>

      <div className="sticky bottom-3 z-30 flex gap-2 rounded-xl border border-border bg-card/95 p-2 backdrop-blur">
        <Button onClick={finish} disabled={pending} className="flex-1" size="lg">
          {pending ? "Saving..." : "Finish workout"}
        </Button>
        <Button
          type="button"
          variant="destructive"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await discardWorkout(workoutId);
            })
          }
        >
          Discard
        </Button>
      </div>
    </div>
  );
}
