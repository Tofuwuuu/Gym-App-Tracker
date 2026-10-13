/**
 * Rest timer state. Only { exerciseId, endsAt } (plus total length and the
 * workout link) is stored; time left is always endsAt - Date.now(), so the
 * timer survives reloads, tab switches, and a locked phone.
 */

export const DEFAULT_REST_SECONDS = 90;
export const MIN_REST_SECONDS = 15;
export const MAX_REST_SECONDS = 600;
export const REST_OVER_MS = 5000;

export const REST_KEY = "gym:rest:v1";
export const REST_LENGTHS_KEY = "gym:restByExercise:v1";

export type RestState = {
  exerciseId: string;
  endsAt: number; // epoch ms
  total: number; // seconds, for the progress line
  href: string; // workout to return to
};

export type RestLengths = Record<string, number>;

const clampSeconds = (s: number) => Math.min(MAX_REST_SECONDS, Math.max(MIN_REST_SECONDS, Math.round(s)));

export function restLengthFor(lengths: RestLengths, exerciseId: string): number {
  const value = lengths[exerciseId];
  return typeof value === "number" && Number.isFinite(value) ? clampSeconds(value) : DEFAULT_REST_SECONDS;
}

export function createRest(exerciseId: string, href: string, seconds: number, now: number): RestState {
  const total = clampSeconds(seconds);
  return { exerciseId, href, total, endsAt: now + total * 1000 };
}

export function remainingMs(state: RestState, now: number): number {
  return Math.max(0, state.endsAt - now);
}

/** Whole seconds shown on screen (rounds up so 0:00 only appears at the end). */
export function remainingSeconds(state: RestState, now: number): number {
  return Math.ceil(remainingMs(state, now) / 1000);
}

export function progress(state: RestState, now: number): number {
  return Math.min(1, Math.max(0, remainingMs(state, now) / (state.total * 1000)));
}

/** +15s or -15s moves endsAt. The new length is what gets remembered for the exercise. */
export function adjustRest(state: RestState, deltaSeconds: number): RestState {
  return {
    ...state,
    endsAt: state.endsAt + deltaSeconds * 1000,
    total: clampSeconds(state.total + deltaSeconds),
  };
}

export function isOver(state: RestState, now: number): boolean {
  return state.endsAt <= now;
}

/** 90 -> "1:30", 5 -> "0:05" */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** 90 -> "1 minute 30 seconds left" */
export function spokenTimeLeft(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds);
  const m = Math.floor(s / 60);
  const r = s % 60;
  const parts: string[] = [];
  if (m) parts.push(`${m} ${m === 1 ? "minute" : "minutes"}`);
  if (r || !m) parts.push(`${r} ${r === 1 ? "second" : "seconds"}`);
  return `${parts.join(" ")} left`;
}

export function parseRest(raw: string | null): RestState | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Partial<RestState>;
    if (typeof v.exerciseId !== "string" || typeof v.endsAt !== "number" || !Number.isFinite(v.endsAt)) return null;
    return {
      exerciseId: v.exerciseId,
      endsAt: v.endsAt,
      total: typeof v.total === "number" && v.total > 0 ? v.total : DEFAULT_REST_SECONDS,
      href: typeof v.href === "string" && v.href.startsWith("/") ? v.href : "/dashboard",
    };
  } catch {
    return null;
  }
}

export function parseLengths(raw: string | null): RestLengths {
  if (!raw) return {};
  try {
    const v: unknown = JSON.parse(raw);
    if (typeof v !== "object" || v === null || Array.isArray(v)) return {};
    const out: RestLengths = {};
    for (const [k, n] of Object.entries(v)) if (typeof n === "number" && Number.isFinite(n)) out[k] = clampSeconds(n);
    return out;
  } catch {
    return {};
  }
}
