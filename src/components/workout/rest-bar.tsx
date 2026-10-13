"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { dismissRestOver, finishRest, nudgeRest, skipRest, useRest } from "@/lib/rest-store";
import { formatClock, progress, remainingSeconds, spokenTimeLeft } from "@/lib/rest-timer";

export const REST_BAR_HEIGHT = 56;

/**
 * Slim rest bar pinned above the tab bar (or the screen bottom during a workout,
 * where the tab bar is hidden). Mounted once in AppShell so it shows on every tab.
 */
export function RestBar({ aboveTabBar }: { aboveTabBar: boolean }) {
  const { timer, over } = useRest();
  const pathname = usePathname();
  const router = useRouter();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!timer) return;
    const tick = () => {
      const t = Date.now();
      setNow(t);
      if (timer.endsAt <= t) finishRest(timer);
    };
    tick();
    const id = window.setInterval(tick, 250);
    // A locked phone pauses intervals; recheck as soon as the page is visible again.
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [timer]);

  if (!timer && !over) return null;

  const seconds = timer ? remainingSeconds(timer, now) : 0;
  const fraction = timer ? progress(timer, now) : 0;
  const showNext = over && over.href !== pathname;

  return (
    <div
      className={cn(
        "fixed inset-x-0 z-40 md:inset-x-auto md:right-6 md:bottom-6 md:w-[420px]",
        aboveTabBar ? "bottom-[calc(64px+env(safe-area-inset-bottom))]" : "bottom-0 pb-[env(safe-area-inset-bottom)]",
        over ? "bg-primary text-primary-foreground motion-safe:animate-pulse" : "bg-card text-card-foreground",
        "border-t border-border shadow-[0_-8px_24px_rgba(0,0,0,0.35)] md:overflow-hidden md:rounded-xl md:border"
      )}
    >
      <div className="relative flex h-14 items-center gap-1 pr-1 pl-4">
        <div className="absolute inset-x-0 top-0 h-0.5 bg-border" aria-hidden>
          <div className="h-full bg-primary transition-[width] duration-200 ease-linear" style={{ width: `${fraction * 100}%` }} />
        </div>

        {timer ? (
          <>
            <div role="timer" aria-live="off" className="flex min-w-0 flex-1 items-baseline gap-2">
              <span aria-hidden className="font-mono text-3xl font-bold tabular-nums">{formatClock(seconds)}</span>
              <span aria-hidden className="text-xs text-muted-foreground">Rest</span>
              <span className="sr-only">{spokenTimeLeft(seconds)}</span>
            </div>
            <button
              type="button"
              aria-label="Subtract 15 seconds"
              onClick={() => nudgeRest(-15)}
              className="h-11 min-w-14 rounded-lg px-2 text-sm hover:bg-muted active:bg-muted"
            >
              −15s
            </button>
            <button
              type="button"
              aria-label="Add 15 seconds"
              onClick={() => nudgeRest(15)}
              className="h-11 min-w-14 rounded-lg px-2 text-sm hover:bg-muted active:bg-muted"
            >
              +15s
            </button>
            <button
              type="button"
              aria-label="Skip rest"
              onClick={skipRest}
              className="flex size-11 items-center justify-center rounded-lg hover:bg-muted active:bg-muted"
            >
              <X className="size-5" />
            </button>
          </>
        ) : (
          <>
            <p className="flex-1 text-lg" role="status" aria-live="polite">
              Rest over
            </p>
            {showNext ? (
              <button
                type="button"
                onClick={() => {
                  dismissRestOver();
                  router.push(over.href);
                }}
                className="h-11 rounded-lg px-3 text-sm underline-offset-4 hover:underline"
              >
                Next set
              </button>
            ) : null}
            <button
              type="button"
              aria-label="Dismiss"
              onClick={dismissRestOver}
              className="flex size-11 items-center justify-center rounded-lg"
            >
              <X className="size-5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
