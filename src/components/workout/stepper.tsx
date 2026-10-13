"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";

/** Press-and-hold repeat: one step on press, then repeats after a short delay. */
function useAutoRepeat(step: () => void) {
  const stepRef = useRef(step);
  const timers = useRef<{ delay?: number; repeat?: number }>({});

  useEffect(() => {
    stepRef.current = step;
  });

  const stop = useCallback(() => {
    window.clearTimeout(timers.current.delay);
    window.clearInterval(timers.current.repeat);
  }, []);

  useEffect(() => stop, [stop]);

  return {
    onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => {
      if (event.button !== 0) return;
      event.preventDefault();
      stop();
      stepRef.current();
      timers.current.delay = window.setTimeout(() => {
        timers.current.repeat = window.setInterval(() => stepRef.current(), 80);
      }, 400);
    },
    onPointerUp: stop,
    onPointerLeave: stop,
    onPointerCancel: stop,
    onContextMenu: (event: React.MouseEvent) => event.preventDefault(),
    // Keyboard and switch access fire click with detail 0; pointer taps were handled on down.
    onClick: (event: React.MouseEvent) => {
      if (event.detail === 0) stepRef.current();
    },
  };
}

export function Stepper({
  label,
  unit,
  value,
  display,
  inputMode,
  decreaseLabel,
  increaseLabel,
  onStep,
  onCommit,
}: {
  label: string;
  unit: string;
  value: number;
  display: string;
  inputMode: "decimal" | "numeric";
  decreaseLabel: string;
  increaseLabel: string;
  onStep: (direction: 1 | -1) => void;
  /** Typed text; return false to reject it. */
  onCommit: (raw: string) => boolean;
}) {
  const down = useAutoRepeat(() => onStep(-1));
  const up = useAutoRepeat(() => onStep(1));
  const [draft, setDraft] = useState<string | null>(null);

  function commit() {
    if (draft !== null && draft.trim() !== "") onCommit(draft);
    setDraft(null);
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        aria-label={decreaseLabel}
        disabled={value <= 0}
        className="flex size-14 shrink-0 touch-manipulation select-none items-center justify-center rounded-xl bg-muted text-foreground active:bg-muted/60 disabled:opacity-40"
        {...down}
      >
        <Minus className="size-6" />
      </button>
      <label className="flex min-w-0 flex-1 flex-col items-center">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="flex items-baseline gap-1">
          <input
            type="text"
            inputMode={inputMode}
            enterKeyHint="done"
            autoComplete="off"
            value={draft ?? display}
            onFocus={(event) => {
              setDraft(display);
              event.currentTarget.select();
            }}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={commit}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
              if (event.key === "Escape") {
                setDraft(null);
                event.currentTarget.blur();
              }
            }}
            className="w-28 rounded-lg bg-transparent text-center font-mono text-4xl leading-tight font-bold tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <span className="text-sm text-muted-foreground">{unit}</span>
        </span>
      </label>
      <button
        type="button"
        aria-label={increaseLabel}
        className="flex size-14 shrink-0 touch-manipulation select-none items-center justify-center rounded-xl bg-muted text-foreground active:bg-muted/60"
        {...up}
      >
        <Plus className="size-6" />
      </button>
    </div>
  );
}
