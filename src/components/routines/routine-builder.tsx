"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createRoutine, updateRoutine } from "@/lib/actions/gym";
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

type DraftExercise = {
  key: string;
  exerciseId: string;
  name: string;
  targetSets: number;
  targetReps: number;
};

export function RoutineBuilder({
  exerciseLibrary,
  routineId,
  initialName = "",
  initialNotes = "",
  initialExercises = [],
}: {
  exerciseLibrary: ExerciseOption[];
  routineId?: string;
  initialName?: string;
  initialNotes?: string;
  initialExercises?: Array<{
    exerciseId: string;
    name: string;
    targetSets: number;
    targetReps: number;
  }>;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [notes, setNotes] = useState(initialNotes);
  const [exercises, setExercises] = useState<DraftExercise[]>(
    initialExercises.map((ex, i) => ({ key: `${ex.exerciseId}-${i}`, ...ex }))
  );
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const excludeIds = useMemo(() => exercises.map((e) => e.exerciseId), [exercises]);

  function save() {
    startTransition(async () => {
      const payload = {
        name,
        notes,
        exercises: exercises.map((ex) => ({
          exerciseId: ex.exerciseId,
          targetSets: ex.targetSets,
          targetReps: ex.targetReps,
        })),
      };

      const result = routineId
        ? await updateRoutine(routineId, payload)
        : await createRoutine(payload);

      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(routineId ? "Routine updated" : "Routine created");
      router.push("/routines");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Routine name</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Push Day A" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Notes</label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional notes"
        />
      </div>

      {exercises.map((exercise) => (
        <Card key={exercise.key}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base">{exercise.name}</CardTitle>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              onClick={() => setExercises((prev) => prev.filter((e) => e.key !== exercise.key))}
            >
              <Trash2 className="size-4" />
            </Button>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Target sets</label>
              <Input
                type="number"
                min={1}
                value={exercise.targetSets}
                onChange={(e) =>
                  setExercises((prev) =>
                    prev.map((ex) =>
                      ex.key === exercise.key
                        ? { ...ex, targetSets: Number(e.target.value) }
                        : ex
                    )
                  )
                }
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Target reps</label>
              <Input
                type="number"
                min={1}
                value={exercise.targetReps}
                onChange={(e) =>
                  setExercises((prev) =>
                    prev.map((ex) =>
                      ex.key === exercise.key
                        ? { ...ex, targetReps: Number(e.target.value) }
                        : ex
                    )
                  )
                }
              />
            </div>
          </CardContent>
        </Card>
      ))}

      <Dialog open={open} onOpenChange={setOpen}>
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
            onSelect={(exercise) => {
              setExercises((prev) => [
                ...prev,
                {
                  key: `${exercise.id}-${Date.now()}`,
                  exerciseId: exercise.id,
                  name: exercise.name,
                  targetSets: 3,
                  targetReps: 10,
                },
              ]);
              setOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>

      <Button onClick={save} disabled={pending} className="w-full">
        {pending ? "Saving..." : routineId ? "Update routine" : "Save routine"}
      </Button>
    </div>
  );
}
