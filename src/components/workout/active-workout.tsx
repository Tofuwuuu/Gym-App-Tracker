"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { EllipsisVertical, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { discardWorkout, saveWorkout } from "@/lib/actions/gym";
import { RestTimer } from "@/components/workout/rest-timer";
import { ExercisePicker, type ExerciseOption } from "@/components/workout/exercise-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type SetDraft = {
  setNumber: number;
  weight: number | null;
  reps: number | null;
  rpe?: number | null;
  isWarmup: boolean;
  completed: boolean;
};

function optionalNumber(raw: string) {
  if (raw.trim() === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function loggedNumber(value: number | null, completed: boolean) {
  if (value == null || (!completed && value === 0)) return null;
  return value;
}

type ExerciseDraft = {
  key: string;
  exerciseId: string;
  name: string;
  sets: SetDraft[];
};

function formatElapsed(totalSeconds: number) {
  const safe = Math.max(0, totalSeconds);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":");
}

function ElapsedClock({ startedAt }: { startedAt: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const elapsed = Math.floor((now - new Date(startedAt).getTime()) / 1000);

  return (
    <p className="font-mono text-xl font-semibold tabular-nums text-primary" aria-label="Elapsed time">
      {formatElapsed(elapsed)}
    </p>
  );
}

export function ActiveWorkout({
  workoutId,
  initialExercises,
  exerciseLibrary,
  notes: initialNotes = "",
  startedAt,
}: {
  workoutId: string;
  initialExercises: Array<{
    exerciseId: string;
    name: string;
    sets: SetDraft[];
  }>;
  exerciseLibrary: ExerciseOption[];
  notes?: string;
  startedAt: string;
}) {
  const [exercises, setExercises] = useState<ExerciseDraft[]>(
    initialExercises.map((ex, index) => ({
      key: `${ex.exerciseId}-${index}`,
      exerciseId: ex.exerciseId,
      name: ex.name,
      sets: ex.sets.map((set) => ({
        ...set,
        weight: loggedNumber(set.weight, set.completed),
        reps: loggedNumber(set.reps, set.completed),
      })),
    }))
  );
  const [notes, setNotes] = useState(initialNotes);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [restSession, setRestSession] = useState(0);
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
              weight: last?.weight ?? null,
              reps: last?.reps ?? null,
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
          { setNumber: 1, weight: null, reps: null, isWarmup: false, completed: false },
          { setNumber: 2, weight: null, reps: null, isWarmup: false, completed: false },
          { setNumber: 3, weight: null, reps: null, isWarmup: false, completed: false },
        ],
      },
    ]);
    setPickerOpen(false);
  }

  function toggleCompleted(exerciseKey: string, setNumber: number, completed: boolean) {
    updateSet(exerciseKey, setNumber, "completed", !completed);
    if (!completed) setRestSession((session) => session + 1);
  }

  function discard() {
    startTransition(async () => {
      await discardWorkout(workoutId);
    });
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
          sets: ex.sets.map((set) => ({
            ...set,
            weight: set.weight ?? 0,
            reps: set.reps ?? 0,
          })),
        })),
      });
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <div
      className={cn(
        "max-md:min-h-dvh md:space-y-4",
        restSession > 0 && "max-md:pb-[calc(5.25rem+env(safe-area-inset-bottom))]"
      )}
    >
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 pt-[env(safe-area-inset-top)] backdrop-blur md:hidden">
        <div className="flex h-14 items-center gap-2 px-3">
          <ElapsedClock startedAt={startedAt} />
          <div className="ml-auto flex items-center gap-1">
            <Button type="button" onClick={finish} disabled={pending} className="h-11 px-4 text-base">
              {pending ? "Saving..." : "Finish"}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Workout options"
                    className="size-11"
                  />
                }
              >
                <EllipsisVertical className="size-5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-44">
                <DropdownMenuItem variant="destructive" onClick={() => setDiscardOpen(true)}>
                  Discard workout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="hidden md:block">
        <RestTimer />
      </div>

      <div className="space-y-4 max-md:px-4 max-md:pt-4">
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
              className="max-md:size-11"
              onClick={() => removeExercise(exercise.key)}
            >
              <Trash2 className="size-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-1.5">
            <div className="grid grid-cols-[1.75rem_minmax(0,1fr)_minmax(0,1fr)_2.75rem] gap-2 px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground md:grid-cols-[32px_1fr_1fr_36px]">
              <span>Set</span>
              <span>Kg</span>
              <span>Reps</span>
              <span className="sr-only">Done</span>
            </div>
            {exercise.sets.map((set) => (
              <div
                key={set.setNumber}
                className={cn(
                  "grid h-14 grid-cols-[1.75rem_minmax(0,1fr)_minmax(0,1fr)_2.75rem] items-center gap-2 px-1 md:h-auto md:grid-cols-[32px_1fr_1fr_36px] md:py-1",
                  set.completed && "rounded-lg bg-primary/10"
                )}
              >
                <span className="font-mono text-sm text-muted-foreground">{set.setNumber}</span>
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  inputMode="decimal"
                  placeholder="—"
                  aria-label={`Set ${set.setNumber} weight in kilograms`}
                  className="h-12 text-base md:h-8 md:text-sm"
                  value={set.weight ?? ""}
                  onChange={(e) =>
                    updateSet(
                      exercise.key,
                      set.setNumber,
                      "weight",
                      optionalNumber(e.target.value)
                    )
                  }
                />
                <Input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  placeholder="—"
                  aria-label={`Set ${set.setNumber} reps`}
                  className="h-12 text-base md:h-8 md:text-sm"
                  value={set.reps ?? ""}
                  onChange={(e) =>
                    updateSet(
                      exercise.key,
                      set.setNumber,
                      "reps",
                      optionalNumber(e.target.value)
                    )
                  }
                />
                <Button
                  type="button"
                  size="icon"
                  variant={set.completed ? "default" : "outline"}
                  aria-pressed={set.completed}
                  aria-label={set.completed ? "Mark set incomplete" : "Mark set complete"}
                  className="size-11 rounded-full md:size-8"
                  onClick={() => toggleCompleted(exercise.key, set.setNumber, set.completed)}
                >
                  {set.completed ? "✓" : ""}
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="max-md:h-11 max-md:text-base"
              onClick={() => addSet(exercise.key)}
            >
              <Plus className="size-4" />
              Add set
            </Button>
          </CardContent>
        </Card>
      ))}

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogTrigger
          render={<Button variant="outline" className="w-full max-md:h-12 max-md:text-base" />}
        >
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

      <div className="sticky bottom-3 z-30 hidden gap-2 rounded-xl border border-border bg-card/95 p-2 backdrop-blur md:flex">
        <Button onClick={finish} disabled={pending} className="flex-1" size="lg">
          {pending ? "Saving..." : "Finish workout"}
        </Button>
        <Button type="button" variant="destructive" disabled={pending} onClick={discard}>
          Discard
        </Button>
      </div>
      </div>

      {restSession > 0 ? (
        <RestTimer key={restSession} variant="dock" autoStart onSkip={() => setRestSession(0)} />
      ) : null}

      <Dialog open={discardOpen} onOpenChange={setDiscardOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Discard this workout?</DialogTitle>
            <DialogDescription>This deletes the session and cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setDiscardOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" disabled={pending} onClick={discard}>
              Discard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
