"use client";

import { useSyncExternalStore } from "react";
import {
  adjustRest,
  createRest,
  parseLengths,
  parseRest,
  REST_KEY,
  REST_LENGTHS_KEY,
  REST_OVER_MS,
  restLengthFor,
  type RestState,
} from "@/lib/rest-timer";

const EVENT = "gym-rest-change";

type Over = { href: string; until: number };
export type RestSnapshot = { timer: RestState | null; over: Over | null };

const EMPTY: RestSnapshot = { timer: null, over: null };
let over: Over | null = null;
let overTimeout: number | undefined;
let cache: { raw: string | null | undefined; over: Over | null; snap: RestSnapshot } = {
  raw: undefined,
  over: null,
  snap: EMPTY,
};

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    /* storage blocked: the timer still runs for this page view */
  }
  window.dispatchEvent(new Event(EVENT));
}

function getSnapshot(): RestSnapshot {
  const raw = read(REST_KEY);
  if (raw !== cache.raw || over !== cache.over) {
    cache = { raw, over, snap: { timer: parseRest(raw), over } };
  }
  return cache.snap;
}

function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function useRest(): RestSnapshot {
  return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
}

function setTimer(state: RestState | null) {
  write(REST_KEY, state ? JSON.stringify(state) : null);
}

function rememberLength(exerciseId: string, seconds: number) {
  const lengths = parseLengths(read(REST_LENGTHS_KEY));
  lengths[exerciseId] = seconds;
  write(REST_LENGTHS_KEY, JSON.stringify(lengths));
}

function clearOver() {
  window.clearTimeout(overTimeout);
  over = null;
  window.dispatchEvent(new Event(EVENT));
}

export function startRest(exerciseId: string, href: string) {
  clearOver();
  const seconds = restLengthFor(parseLengths(read(REST_LENGTHS_KEY)), exerciseId);
  setTimer(createRest(exerciseId, href, seconds, Date.now()));
}

export function nudgeRest(deltaSeconds: number) {
  const current = parseRest(read(REST_KEY));
  if (!current) return;
  const next = adjustRest(current, deltaSeconds);
  rememberLength(next.exerciseId, next.total);
  if (next.endsAt <= Date.now()) finishRest(next);
  else setTimer(next);
}

export function skipRest() {
  clearOver();
  setTimer(null);
}

/** Zero reached: clear the stored timer and show "Rest over" for a few seconds. */
export function finishRest(state: RestState) {
  setTimer(null);
  window.clearTimeout(overTimeout);
  over = { href: state.href, until: Date.now() + REST_OVER_MS };
  window.dispatchEvent(new Event(EVENT));
  try {
    navigator.vibrate?.([120, 80, 120]);
  } catch {
    /* not supported */
  }
  overTimeout = window.setTimeout(clearOver, REST_OVER_MS);
}

export function dismissRestOver() {
  clearOver();
}

export function getRestHref(): string | null {
  return parseRest(read(REST_KEY))?.href ?? null;
}
