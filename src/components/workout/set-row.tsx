"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { setLabel, type LoggedSet } from "@/lib/sets";

const DELETE_AT = 96;

/** A logged set. Tap to edit; swipe left to delete (Undo comes from the toast). */
export function SetRow({
  set,
  selected,
  onSelect,
  onDelete,
}: {
  set: LoggedSet;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const start = useRef<{ x: number; y: number; id: number } | null>(null);
  const swiping = useRef(false);
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);

  function reset() {
    start.current = null;
    setDragging(false);
    setDx(0);
  }

  return (
    <li className="relative overflow-hidden rounded-xl bg-destructive/80">
      <span className="absolute inset-y-0 right-4 flex items-center text-sm text-white" aria-hidden>
        Delete
      </span>
      <button
        type="button"
        aria-pressed={selected}
        onPointerDown={(event) => {
          start.current = { x: event.clientX, y: event.clientY, id: event.pointerId };
          swiping.current = false;
        }}
        onPointerMove={(event) => {
          const s = start.current;
          if (!s || s.id !== event.pointerId) return;
          const moveX = event.clientX - s.x;
          const moveY = event.clientY - s.y;
          if (!swiping.current) {
            if (Math.abs(moveX) < 8 || Math.abs(moveX) < Math.abs(moveY)) {
              if (Math.abs(moveY) > 8) start.current = null; // vertical scroll wins
              return;
            }
            swiping.current = true;
            setDragging(true);
            event.currentTarget.setPointerCapture(event.pointerId);
          }
          setDx(Math.min(0, moveX));
        }}
        onPointerUp={() => {
          if (swiping.current && dx <= -DELETE_AT) onDelete();
          reset();
        }}
        onPointerCancel={reset}
        onClick={() => {
          if (swiping.current) {
            swiping.current = false;
            return;
          }
          onSelect();
        }}
        style={{ transform: `translateX(${dx}px)`, transition: dragging ? "none" : "transform 160ms ease-out" }}
        className={cn(
          "relative flex min-h-14 w-full touch-pan-y select-none items-center justify-between gap-3 rounded-xl border px-4 text-left text-base",
          selected ? "border-primary bg-card" : "border-border bg-card"
        )}
      >
        <span>
          <SetText set={set} />
        </span>
        {set.isWarmup ? <span className="text-xs text-muted-foreground">Warm-up</span> : null}
      </button>
    </li>
  );
}

/** "Set 3 · 60 kg × 8" with only the numbers bold. */
function SetText({ set }: { set: LoggedSet }) {
  const label = setLabel(set);
  return (
    <span aria-label={label}>
      {label.split(/(\d+(?:\.\d+)?)/).map((part, i) =>
        i % 2 === 1 ? (
          <b key={i} className="font-mono font-bold tabular-nums">
            {part}
          </b>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}
