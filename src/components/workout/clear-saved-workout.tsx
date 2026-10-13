"use client";

import { useEffect } from "react";
import { clearDraft } from "@/lib/finish";
import { getRestHref, skipRest } from "@/lib/rest-store";

/** Rendered on a finished workout's history page: the save is confirmed, so drop local copies. */
export function ClearSavedWorkout({ workoutId }: { workoutId: string }) {
  useEffect(() => {
    clearDraft(window.localStorage, workoutId);
    if (getRestHref() === `/workout/${workoutId}`) skipRest();
  }, [workoutId]);
  return null;
}
