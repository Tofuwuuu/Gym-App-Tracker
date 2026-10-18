/**
 * Set logging helpers. Weights are integer tenths of a kilogram on the client
 * (60 kg = 600) so steppers never accumulate float error. The database column
 * stays a Float in kilograms; convert at the boundary with kgToTenths/tenthsToKg.
 */

export const WEIGHT_STEP_TENTHS = 25; // 2.5 kg
export const MAX_WEIGHT_TENTHS = 10000; // 1000 kg
export const MAX_REPS = 999;

export type LoggedSet = {
  setNumber: number;
  weightTenths: number;
  reps: number;
  isWarmup: boolean;
  completed: boolean;
};

export type ExerciseDraft = {
  key: string;
  exerciseId: string;
  name: string;
  sets: LoggedSet[];
};

export type WorkoutDraft = {
  version: 1;
  /** Generated on the device when the workout starts; sent with the save for future dedupe. */
  clientId: string;
  exercises: ExerciseDraft[];
  notes: string;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function kgToTenths(kg: number): number {
  if (!Number.isFinite(kg) || kg <= 0) return 0;
  return clamp(Math.round(kg * 10), 0, MAX_WEIGHT_TENTHS);
}

export function tenthsToKg(tenths: number): number {
  return Math.round(tenths) / 10;
}

/** 600 -> "60", 625 -> "62.5" */
export function formatTenths(tenths: number): string {
  const kg = tenthsToKg(tenths);
  return Number.isInteger(kg) ? String(kg) : kg.toFixed(1);
}

export function stepWeight(tenths: number, direction: 1 | -1): number {
  return clamp(tenths + direction * WEIGHT_STEP_TENTHS, 0, MAX_WEIGHT_TENTHS);
}

export function stepReps(reps: number, direction: 1 | -1): number {
  return clamp(reps + direction, 0, MAX_REPS);
}

/** Typed weight ("62.5", "62,5", " 60 ") to tenths. null if not a number. */
export function parseWeightInput(raw: string): number | null {
  const clean = raw.trim().replace(",", ".");
  if (!/^\d+(\.\d*)?$|^\.\d+$/.test(clean)) return null;
  return kgToTenths(Number(clean));
}

export function parseRepsInput(raw: string): number | null {
  const clean = raw.trim();
  if (!/^\d+$/.test(clean)) return null;
  return clamp(Number(clean), 0, MAX_REPS);
}

/** "Set 3 · 60 kg × 8" */
export function setLabel(set: Pick<LoggedSet, "setNumber" | "weightTenths" | "reps">): string {
  return `Set ${set.setNumber} · ${formatTenths(set.weightTenths)} kg × ${set.reps}`;
}

function renumber(sets: LoggedSet[]): LoggedSet[] {
  return sets.map((set, index) => ({ ...set, setNumber: index + 1 }));
}

export function appendSet(sets: LoggedSet[], weightTenths: number, reps: number): LoggedSet[] {
  return renumber([...sets, { setNumber: 0, weightTenths, reps, isWarmup: false, completed: true }]);
}

export function updateSet(sets: LoggedSet[], setNumber: number, weightTenths: number, reps: number): LoggedSet[] {
  return sets.map((set) => (set.setNumber === setNumber ? { ...set, weightTenths, reps, completed: true } : set));
}

export type RemovedSet = { set: LoggedSet; index: number };

/** Removes a set and renumbers the rest. Returns what Undo needs to put it back. */
export function removeSet(sets: LoggedSet[], setNumber: number): { sets: LoggedSet[]; removed: RemovedSet | null } {
  const index = sets.findIndex((set) => set.setNumber === setNumber);
  if (index === -1) return { sets, removed: null };
  return { sets: renumber(sets.filter((_, i) => i !== index)), removed: { set: sets[index], index } };
}

export function restoreSet(sets: LoggedSet[], removed: RemovedSet): LoggedSet[] {
  const next = [...sets];
  next.splice(Math.min(removed.index, next.length), 0, removed.set);
  return renumber(next);
}

/** Routine placeholders (not completed, 0 kg, 0 reps) are plans, not logged sets. */
export function isPlaceholder(set: { completed: boolean; weight: number; reps: number }): boolean {
  return !set.completed && set.weight === 0 && set.reps === 0;
}

/** Values to prefill the steppers: last set this session, else last time, else zeros. */
export function prefillFor(
  sets: LoggedSet[],
  lastTime: { weightTenths: number; reps: number } | undefined
): { weightTenths: number; reps: number } {
  const last = sets[sets.length - 1];
  if (last) return { weightTenths: last.weightTenths, reps: last.reps };
  if (lastTime) return { weightTenths: lastTime.weightTenths, reps: lastTime.reps };
  return { weightTenths: 0, reps: 0 };
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;

/**
 * Reads a saved workout draft. Accepts the current shape (weightTenths) and the
 * older shape that stored `weight` in kilograms, converting it so nothing is lost.
 * Drafts from before clientId get a new one. Anything unreadable returns null and the caller falls back to server data.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function newClientId(): string {
  return crypto.randomUUID();
}

export function migrateDraft(raw: unknown, makeId: () => string = newClientId): WorkoutDraft | null {
  if (!isObj(raw) || !Array.isArray(raw.exercises)) return null;
  const exercises: ExerciseDraft[] = [];
  for (const ex of raw.exercises) {
    if (!isObj(ex) || typeof ex.exerciseId !== "string" || typeof ex.name !== "string" || !Array.isArray(ex.sets)) {
      return null;
    }
    const sets: LoggedSet[] = [];
    for (const s of ex.sets) {
      if (!isObj(s)) return null;
      let weightTenths: number;
      if (Number.isInteger(s.weightTenths)) weightTenths = clamp(s.weightTenths as number, 0, MAX_WEIGHT_TENTHS);
      else if (typeof s.weight === "number" || s.weight === null) weightTenths = kgToTenths((s.weight as number | null) ?? 0);
      else return null;
      const reps = typeof s.reps === "number" && Number.isFinite(s.reps) ? clamp(Math.round(s.reps), 0, MAX_REPS) : 0;
      sets.push({
        setNumber: sets.length + 1,
        weightTenths,
        reps,
        isWarmup: s.isWarmup === true,
        completed: s.completed !== false,
      });
    }
    exercises.push({
      key: typeof ex.key === "string" ? ex.key : `${ex.exerciseId}-${exercises.length}`,
      exerciseId: ex.exerciseId,
      name: ex.name,
      sets,
    });
  }
  const clientId = typeof raw.clientId === "string" && UUID.test(raw.clientId) ? raw.clientId : makeId();
  return { version: 1, clientId, exercises, notes: typeof raw.notes === "string" ? raw.notes : "" };
}
