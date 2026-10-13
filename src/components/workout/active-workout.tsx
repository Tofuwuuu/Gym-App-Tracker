"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { EllipsisVertical, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { discardWorkout, saveWorkout } from "@/lib/actions/gym";
import { ExercisePicker, type ExerciseOption } from "@/components/workout/exercise-picker";
import { Stepper } from "@/components/workout/stepper";
import { SetRow } from "@/components/workout/set-row";
import { skipRest, startRest, useRest } from "@/lib/rest-store";
import { clearDraft, draftKey, finishFailureNotice, runFinish, type FailureReason } from "@/lib/finish";
import Link from "next/link";
import {
  appendSet,
  formatTenths,
  migrateDraft,
  newClientId,
  parseRepsInput,
  parseWeightInput,
  prefillFor,
  removeSet,
  restoreSet,
  stepReps,
  stepWeight,
  tenthsToKg,
  updateSet,
  type ExerciseDraft,
  type RemovedSet,
  type WorkoutDraft,
} from "@/lib/sets";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type LastTime = Array<{ weightTenths: number; reps: number }>;

const UNDO_MS = 5000;

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
    <p
      className="font-mono text-xl font-semibold tabular-nums text-primary"
      aria-label="Elapsed time"
      suppressHydrationWarning
    >
      {formatElapsed(elapsed)}
    </p>
  );
}

function SaveFailedNotice({
  reason,
  workoutId,
  pending,
  onRetry,
}: {
  reason: FailureReason;
  workoutId: string;
  pending: boolean;
  onRetry: () => void;
}) {
  const notice = finishFailureNotice(reason, workoutId);
  return (
    <div
      role="alert"
      className="mx-3 mt-3 flex items-center gap-3 rounded-xl border border-destructive/60 bg-destructive/10 py-2 pr-2 pl-4"
    >
      <p className="flex-1 text-sm">{notice.text}</p>
      {notice.action.href ? (
        <Link href={notice.action.href} className={cn(buttonVariants({ variant: "outline" }), "h-11 shrink-0")}>
          {notice.action.label}
        </Link>
      ) : (
        <Button type="button" variant="outline" className="h-11 shrink-0" disabled={pending} onClick={onRetry}>
          {pending ? "Saving..." : notice.action.label}
        </Button>
      )}
    </div>
  );
}

type Values = { weightTenths: number; reps: number };
type Undo = { exerciseKey: string; removed: RemovedSet; id: number };

export function ActiveWorkout({
  workoutId,
  initialExercises,
  exerciseLibrary,
  lastTime,
  notes: initialNotes = "",
  startedAt,
}: {
  workoutId: string;
  initialExercises: ExerciseDraft[];
  exerciseLibrary: ExerciseOption[];
  lastTime: Record<string, LastTime>;
  notes?: string;
  startedAt: string;
}) {
  const [exercises, setExercises] = useState<ExerciseDraft[]>(initialExercises);
  const [notes, setNotes] = useState(initialNotes);
  const [clientId, setClientId] = useState<string | null>(null);
  const [activeKey, setActiveKey] = useState<string | null>(initialExercises[0]?.key ?? null);
  const [values, setValues] = useState<Values>(() =>
    prefillFor(initialExercises[0]?.sets ?? [], lastTime[initialExercises[0]?.exerciseId ?? ""]?.at(-1))
  );
  const [editing, setEditing] = useState<number | null>(null);
  const [justLogged, setJustLogged] = useState(false);
  const [undo, setUndo] = useState<Undo | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [restored, setRestored] = useState(false);
  const [saveFailed, setSaveFailed] = useState<FailureReason | null>(null);
  const [pending, startTransition] = useTransition();
  const listEnd = useRef<HTMLDivElement>(null);
  const seq = useRef(0);
  const rest = useRest();
  const barVisible = Boolean(rest.timer || rest.over);

  const active = exercises.find((ex) => ex.key === activeKey) ?? null;
  const history = active ? lastTime[active.exerciseId] : undefined;
  const excludeIds = useMemo(() => exercises.map((e) => e.exerciseId), [exercises]);

  // Restore the local draft after mount (sets live on this device until Finish).
  // Reading localStorage during render would break hydration, so this runs once in an effect.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    let draft: WorkoutDraft | null = null;
    try {
      const raw = window.localStorage.getItem(draftKey(workoutId));
      draft = raw ? migrateDraft(JSON.parse(raw)) : null;
    } catch {
      draft = null;
    }
    // A workout's clientId is created once, when it starts on this device, and kept in the draft.
    setClientId(draft?.clientId ?? newClientId());
    if (draft && draft.exercises.length > 0) {
      const first = draft.exercises[0];
      setExercises(draft.exercises);
      setNotes(draft.notes || initialNotes);
      setActiveKey(first.key);
      setValues(prefillFor(first.sets, lastTime[first.exerciseId]?.at(-1)));
    }
    setRestored(true);
    // Mount only: later prop changes must not overwrite in-progress sets.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workoutId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!restored || !clientId) return;
    const draft: WorkoutDraft = { version: 1, clientId, exercises, notes };
    try {
      window.localStorage.setItem(draftKey(workoutId), JSON.stringify(draft));
    } catch {
      /* storage full or blocked */
    }
  }, [clientId, exercises, notes, restored, workoutId]);

  useEffect(() => {
    if (!undo) return;
    const id = window.setTimeout(() => setUndo(null), UNDO_MS);
    return () => window.clearTimeout(id);
  }, [undo]);

  useEffect(() => {
    if (!justLogged) return;
    const id = window.setTimeout(() => setJustLogged(false), 1200);
    return () => window.clearTimeout(id);
  }, [justLogged]);

  function selectExercise(key: string) {
    const ex = exercises.find((e) => e.key === key);
    if (!ex) return;
    setActiveKey(key);
    setEditing(null);
    setValues(prefillFor(ex.sets, lastTime[ex.exerciseId]?.at(-1)));
  }

  function setSets(key: string, update: (sets: ExerciseDraft["sets"]) => ExerciseDraft["sets"]) {
    setExercises((prev) => prev.map((ex) => (ex.key === key ? { ...ex, sets: update(ex.sets) } : ex)));
  }

  function logSet() {
    if (!active || values.reps <= 0) return;
    if (editing !== null) {
      setSets(active.key, (sets) => updateSet(sets, editing, values.weightTenths, values.reps));
      setEditing(null);
      return;
    }
    setSets(active.key, (sets) => appendSet(sets, values.weightTenths, values.reps));
    setJustLogged(true);
    startRest(active.exerciseId, `/workout/${workoutId}`);
    window.requestAnimationFrame(() => listEnd.current?.scrollIntoView({ block: "end", behavior: "smooth" }));
  }

  function deleteSet(setNumber: number) {
    if (!active) return;
    const { removed } = removeSet(active.sets, setNumber);
    if (!removed) return;
    setSets(active.key, (sets) => removeSet(sets, setNumber).sets);
    setEditing(null);
    setUndo({ exerciseKey: active.key, removed, id: ++seq.current });
  }

  function undoDelete() {
    if (!undo) return;
    setSets(undo.exerciseKey, (sets) => restoreSet(sets, undo.removed));
    setUndo(null);
  }

  function editSet(setNumber: number) {
    if (!active) return;
    if (editing === setNumber) {
      setEditing(null);
      setValues(prefillFor(active.sets, history?.at(-1)));
      return;
    }
    const set = active.sets.find((s) => s.setNumber === setNumber);
    if (!set) return;
    setEditing(setNumber);
    setValues({ weightTenths: set.weightTenths, reps: set.reps });
  }

  function cancelEdit() {
    setEditing(null);
    if (active) setValues(prefillFor(active.sets, history?.at(-1)));
  }

  function addExercise(exercise: ExerciseOption) {
    const key = `${exercise.id}-new-${++seq.current}`;
    setExercises((prev) => [...prev, { key, exerciseId: exercise.id, name: exercise.name, sets: [] }]);
    setActiveKey(key);
    setEditing(null);
    setValues(prefillFor([], lastTime[exercise.id]?.at(-1)));
    setPickerOpen(false);
  }

  function removeExercise(key: string) {
    const next = exercises.filter((ex) => ex.key !== key);
    setExercises(next);
    if (activeKey === key) {
      const first = next[0];
      setActiveKey(first?.key ?? null);
      setEditing(null);
      setValues(prefillFor(first?.sets ?? [], first ? lastTime[first.exerciseId]?.at(-1) : undefined));
    }
  }

  function clearLocal() {
    clearDraft(window.localStorage, workoutId);
    skipRest();
  }

  function discard() {
    startTransition(async () => {
      clearLocal();
      await discardWorkout(workoutId);
    });
  }

  function finish() {
    if (exercises.length === 0) {
      toast.error("Add at least one exercise");
      return;
    }
    startTransition(async () => {
      const payload = {
        workoutId,
        clientId: clientId ?? undefined,
        notes,
        exercises: exercises.map((ex) => ({
          exerciseId: ex.exerciseId,
          sets: ex.sets.map((set) => ({
            setNumber: set.setNumber,
            weight: tenthsToKg(set.weightTenths),
            reps: set.reps,
            isWarmup: set.isWarmup,
            completed: set.completed,
          })),
        })),
      };
      // The draft and timer stay until the server confirms; failures show "Try again".
      const result = await runFinish(() => saveWorkout(payload), clearLocal, `/history/${workoutId}`);
      setSaveFailed(result.ok ? null : result.reason);
    });
  }

  const buttonLabel = editing !== null ? "Save set" : justLogged ? "Logged" : "Log set";

  return (
    <div className="flex h-dvh flex-col md:h-[calc(100dvh-3.5rem)] md:overflow-hidden md:rounded-xl md:border md:border-border">
      <header className="shrink-0 border-b border-border bg-background/95 pt-[env(safe-area-inset-top)] backdrop-blur">
        {saveFailed ? <SaveFailedNotice reason={saveFailed} workoutId={workoutId} pending={pending} onRetry={finish} /> : null}
        <div className="flex h-14 items-center gap-2 px-3">
          <ElapsedClock startedAt={startedAt} />
          <div className="ml-auto flex items-center gap-1">
            <Button type="button" onClick={finish} disabled={pending} className="h-11 px-4 text-base">
              {pending ? "Saving..." : "Finish"}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button type="button" variant="ghost" size="icon" aria-label="Workout options" className="size-11" />
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
        <nav aria-label="Exercises" className="flex gap-2 overflow-x-auto px-3 pb-3 [scrollbar-width:none]">
          {exercises.map((ex) => (
            <button
              key={ex.key}
              type="button"
              aria-current={ex.key === activeKey ? "true" : undefined}
              onClick={() => selectExercise(ex.key)}
              className={cn(
                "flex h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm whitespace-nowrap",
                ex.key === activeKey
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground"
              )}
            >
              {ex.name}
              {ex.sets.length > 0 ? <b className="font-mono tabular-nums">{ex.sets.length}</b> : null}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="flex h-11 shrink-0 items-center gap-1.5 rounded-full border border-dashed border-border px-4 text-sm text-muted-foreground"
          >
            <Plus className="size-4" />
            Add exercise
          </button>
        </nav>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-4 pb-4">
        {active ? (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h1 className="text-2xl leading-tight">{active.name}</h1>
                {history ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Last time:{" "}
                    {history.map((s, i) => (
                      <span key={i}>
                        {i > 0 ? ", " : null}
                        <b className="font-mono font-bold tabular-nums text-foreground">{formatTenths(s.weightTenths)}</b>{" "}
                        kg × <b className="font-mono font-bold tabular-nums text-foreground">{s.reps}</b>
                      </span>
                    ))}
                  </p>
                ) : null}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-11 shrink-0 text-muted-foreground"
                aria-label={`Remove ${active.name}`}
                onClick={() => removeExercise(active.key)}
              >
                <Trash2 className="size-5" />
              </Button>
            </div>

            {active.sets.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                No sets yet. Set your weight and reps, then tap Log set.
              </p>
            ) : (
              <ul className="space-y-2" aria-label={`${active.name} sets`}>
                {active.sets.map((set) => (
                  <SetRow
                    key={`${active.key}-${set.setNumber}-${set.weightTenths}-${set.reps}`}
                    set={set}
                    selected={editing === set.setNumber}
                    onSelect={() => editSet(set.setNumber)}
                    onDelete={() => deleteSet(set.setNumber)}
                  />
                ))}
              </ul>
            )}
            <div ref={listEnd} />

            <details className="rounded-xl border border-border px-4 py-3 text-sm">
              <summary className="cursor-pointer text-muted-foreground">Workout notes</summary>
              <Textarea
                className="mt-3"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="How did it feel?"
              />
            </details>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <p className="text-muted-foreground">Add an exercise to start logging.</p>
            <Button type="button" className="h-14 px-6 text-base" onClick={() => setPickerOpen(true)}>
              <Plus className="size-5" />
              Add exercise
            </Button>
          </div>
        )}
      </div>

      {active ? (
        <section
          aria-label="Log a set"
          className={cn(
            "relative shrink-0 space-y-3 border-t border-border bg-background px-4 pt-4",
            barVisible ? "pb-[calc(56px+0.75rem+env(safe-area-inset-bottom))]" : "pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
          )}
        >
          {undo ? (
            <div
              role="status"
              className="absolute inset-x-4 bottom-full mb-3 flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-2 shadow-lg"
            >
              <span className="text-sm">Set deleted</span>
              <button
                type="button"
                onClick={undoDelete}
                className="h-11 rounded-lg px-3 text-sm text-primary underline-offset-4 hover:underline"
              >
                Undo
              </button>
            </div>
          ) : null}

          <Stepper
            label="Weight"
            unit="kg"
            value={values.weightTenths}
            display={formatTenths(values.weightTenths)}
            inputMode="decimal"
            decreaseLabel="Decrease weight"
            increaseLabel="Increase weight"
            onStep={(dir) => setValues((v) => ({ ...v, weightTenths: stepWeight(v.weightTenths, dir) }))}
            onCommit={(raw) => {
              const parsed = parseWeightInput(raw);
              if (parsed === null) return false;
              setValues((v) => ({ ...v, weightTenths: parsed }));
              return true;
            }}
          />
          <Stepper
            label="Reps"
            unit="reps"
            value={values.reps}
            display={String(values.reps)}
            inputMode="numeric"
            decreaseLabel="Decrease reps"
            increaseLabel="Increase reps"
            onStep={(dir) => setValues((v) => ({ ...v, reps: stepReps(v.reps, dir) }))}
            onCommit={(raw) => {
              const parsed = parseRepsInput(raw);
              if (parsed === null) return false;
              setValues((v) => ({ ...v, reps: parsed }));
              return true;
            }}
          />

          {editing !== null ? (
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="ghost" className="h-11" onClick={cancelEdit}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="h-11 text-destructive"
                onClick={() => deleteSet(editing)}
              >
                Delete set
              </Button>
            </div>
          ) : null}

          <Button
            type="button"
            onClick={logSet}
            disabled={values.reps <= 0}
            className="h-14 w-full rounded-xl text-lg"
            aria-live="polite"
          >
            {buttonLabel}
          </Button>
        </section>
      ) : null}

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add exercise</DialogTitle>
          </DialogHeader>
          <ExercisePicker exercises={exerciseLibrary} excludeIds={excludeIds} onSelect={addExercise} />
        </DialogContent>
      </Dialog>

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
