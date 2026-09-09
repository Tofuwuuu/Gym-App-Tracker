"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { formatEquipment, formatMuscleGroup } from "@/lib/workout-utils";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type ExerciseOption = {
  id: string;
  name: string;
  muscleGroup: string;
  equipment: string;
};

export function ExercisePicker({
  exercises,
  onSelect,
  excludeIds = [],
}: {
  exercises: ExerciseOption[];
  onSelect: (exercise: ExerciseOption) => void;
  excludeIds?: string[];
}) {
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState<string>("ALL");

  const muscles = useMemo(
    () => ["ALL", ...Array.from(new Set(exercises.map((e) => e.muscleGroup))).sort()],
    [exercises]
  );

  const filtered = exercises.filter((exercise) => {
    if (excludeIds.includes(exercise.id)) return false;
    if (muscle !== "ALL" && exercise.muscleGroup !== muscle) return false;
    if (!query.trim()) return true;
    return exercise.name.toLowerCase().includes(query.toLowerCase());
  });

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search exercises..."
          className="pl-8"
        />
      </div>
      <div className="flex flex-wrap gap-1">
        {muscles.map((m) => (
          <Button
            key={m}
            type="button"
            size="sm"
            variant={muscle === m ? "default" : "outline"}
            onClick={() => setMuscle(m)}
          >
            {m === "ALL" ? "All" : formatMuscleGroup(m)}
          </Button>
        ))}
      </div>
      <div className="max-h-72 space-y-1 overflow-y-auto rounded-lg border p-2">
        {filtered.length === 0 && (
          <p className="p-3 text-sm text-muted-foreground">No exercises found.</p>
        )}
        {filtered.map((exercise) => (
          <button
            key={exercise.id}
            type="button"
            onClick={() => onSelect(exercise)}
            className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left hover:bg-muted"
          >
            <span className="font-medium">{exercise.name}</span>
            <div className="flex gap-1">
              <Badge variant="secondary">{formatMuscleGroup(exercise.muscleGroup)}</Badge>
              <Badge variant="outline">{formatEquipment(exercise.equipment)}</Badge>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
