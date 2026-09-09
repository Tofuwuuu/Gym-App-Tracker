"use client";

import { useEffect, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RestTimer({ defaultSeconds = 90 }: { defaultSeconds?: number }) {
  const [seconds, setSeconds] = useState(defaultSeconds);
  const [remaining, setRemaining] = useState(defaultSeconds);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    if (remaining <= 0) {
      setRunning(false);
      return;
    }
    const id = window.setInterval(() => {
      setRemaining((r) => r - 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [running, remaining]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card p-3">
      <div className="min-w-20 font-mono text-2xl font-semibold tabular-nums">
        {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
      </div>
      <div className="flex gap-1">
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          onClick={() => setRunning((r) => !r)}
        >
          {running ? <Pause className="size-4" /> : <Play className="size-4" />}
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
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
