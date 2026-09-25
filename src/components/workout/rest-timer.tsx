"use client";

import { useEffect, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export const DEFAULT_REST_SECONDS = 90;

function formatClock(totalSeconds: number) {
  const safe = Math.max(0, totalSeconds);
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function RestTimer({
  defaultSeconds = DEFAULT_REST_SECONDS,
  autoStart = false,
  variant = "inline",
  onSkip,
}: {
  defaultSeconds?: number;
  autoStart?: boolean;
  variant?: "inline" | "dock";
  onSkip?: () => void;
}) {
  const [seconds, setSeconds] = useState(defaultSeconds);
  const [remaining, setRemaining] = useState(defaultSeconds);
  const [running, setRunning] = useState(autoStart);

  useEffect(() => {
    if (!running || remaining <= 0) return;
    const id = window.setInterval(() => {
      setRemaining((current) => (current <= 1 ? 0 : current - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [running, remaining]);

  useEffect(() => {
    if (!running || remaining > 0) return;
    const id = window.setTimeout(() => setRunning(false), 0);
    return () => window.clearTimeout(id);
  }, [running, remaining]);

  if (variant === "dock") {
    return (
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-primary/40 bg-card px-3 pt-2 md:hidden"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        role="timer"
        aria-label="Rest timer"
      >
        <div className="flex items-center gap-2">
          <div className="min-w-16 shrink-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Rest
            </p>
            <p className="font-mono text-2xl font-semibold tabular-nums text-primary">
              {formatClock(remaining)}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-11 flex-1 text-base"
            onClick={() => {
              const next = Math.max(0, remaining - 15);
              setRemaining(next);
              if (next === 0) setRunning(false);
            }}
          >
            -15s
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11 flex-1 text-base"
            onClick={() => setRemaining((current) => current + 15)}
          >
            +15s
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-11 flex-1 text-base"
            onClick={() => {
              setRunning(false);
              onSkip?.();
            }}
          >
            Skip
          </Button>
        </div>
      </div>
    );
  }

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-primary/30 bg-card px-3 py-2.5">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Rest
        </p>
        <div
          className={
            running
              ? "min-w-20 font-mono text-3xl font-semibold tabular-nums text-primary"
              : "min-w-20 font-mono text-3xl font-semibold tabular-nums"
          }
        >
          {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
        </div>
      </div>
      <div className="flex gap-1">
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          aria-label={running ? "Pause rest timer" : "Start rest timer"}
          onClick={() => setRunning((value) => !value)}
        >
          {running ? <Pause className="size-4" /> : <Play className="size-4" />}
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          aria-label="Reset rest timer"
          onClick={() => {
            setRunning(false);
            setRemaining(seconds);
          }}
        >
          <RotateCcw className="size-4" />
        </Button>
      </div>
      <div className="flex gap-1">
        {[60, 90, 120, 180].map((value) => (
          <Button
            key={value}
            type="button"
            size="sm"
            variant={seconds === value ? "default" : "ghost"}
            onClick={() => {
              setSeconds(value);
              setRemaining(value);
              setRunning(false);
            }}
          >
            {value}s
          </Button>
        ))}
      </div>
    </div>
  );
}
