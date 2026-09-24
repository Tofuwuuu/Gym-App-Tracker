"use client";

import { useActionState } from "react";
import { createCustomExercise, type ActionResult } from "@/lib/actions/gym";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const muscleGroups = [
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
] as const;

const equipment = [
  "BARBELL",
  "DUMBBELL",
  "MACHINE",
  "CABLE",
  "BODYWEIGHT",
  "KETTLEBELL",
  "BAND",
  "OTHER",
] as const;

const initial: ActionResult = {};

export function CreateExerciseForm() {
  const [state, formAction, pending] = useActionState(createCustomExercise, initial);

  return (
    <form action={formAction} className="space-y-3 rounded-xl border bg-card p-4">
      <h3 className="font-medium">Create custom exercise</h3>
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="muscleGroup">Muscle group</Label>
          <select
            id="muscleGroup"
            name="muscleGroup"
            defaultValue="OTHER"
            className="field-select"
          >
            {muscleGroups.map((group) => (
              <option key={group} value={group}>
                {group.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="equipment">Equipment</Label>
          <select
            id="equipment"
            name="equipment"
            defaultValue="OTHER"
            className="field-select"
          >
            {equipment.map((item) => (
              <option key={item} value={item}>
                {item.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </div>
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.success && <p className="text-sm text-primary">Exercise created.</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save exercise"}
      </Button>
    </form>
  );
}
