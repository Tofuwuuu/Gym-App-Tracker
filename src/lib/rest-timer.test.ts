import assert from "node:assert/strict";
import { test } from "node:test";
import {
  adjustRest,
  createRest,
  DEFAULT_REST_SECONDS,
  formatClock,
  isOver,
  parseLengths,
  parseRest,
  progress,
  remainingMs,
  remainingSeconds,
  restLengthFor,
  spokenTimeLeft,
} from "./rest-timer";

const T0 = 1_700_000_000_000;

test("time left comes from endsAt, not from ticks", () => {
  const rest = createRest("bench", "/workout/w1", 90, T0);
  assert.equal(rest.endsAt, T0 + 90_000);
  assert.equal(remainingSeconds(rest, T0), 90);
  assert.equal(remainingSeconds(rest, T0 + 400), 90);
  assert.equal(remainingSeconds(rest, T0 + 1000), 89);
  // Phone locked for 75 seconds: no ticks ran, the answer is still right.
  assert.equal(remainingSeconds(rest, T0 + 75_000), 15);
  assert.equal(remainingMs(rest, T0 + 200_000), 0);
  assert.equal(isOver(rest, T0 + 89_999), false);
  assert.equal(isOver(rest, T0 + 90_000), true);
});

test("plus and minus 15 seconds move endsAt and the remembered length", () => {
  const rest = createRest("bench", "/w", 90, T0);
  const plus = adjustRest(rest, 15);
  assert.equal(plus.endsAt, T0 + 105_000);
  assert.equal(plus.total, 105);
  const minus = adjustRest(adjustRest(rest, -15), -15);
  assert.equal(remainingSeconds(minus, T0 + 10_000), 50);
  assert.equal(minus.total, 60);
  // Cutting below zero ends the rest.
  assert.equal(isOver(adjustRest(rest, -15), T0 + 80_000), true);
});

test("progress line runs from full to empty", () => {
  const rest = createRest("x", "/w", 60, T0);
  assert.equal(progress(rest, T0), 1);
  assert.equal(progress(rest, T0 + 30_000), 0.5);
  assert.equal(progress(rest, T0 + 90_000), 0);
});

test("default and remembered lengths per exercise", () => {
  assert.equal(restLengthFor({}, "bench"), DEFAULT_REST_SECONDS);
  assert.equal(restLengthFor({ bench: 120 }, "bench"), 120);
  assert.equal(restLengthFor({ bench: 120 }, "squat"), 90);
  assert.deepEqual(parseLengths('{"bench":120,"bad":"x"}'), { bench: 120 });
  assert.deepEqual(parseLengths("not json"), {});
});

test("stored state survives a reload round trip", () => {
  const rest = createRest("bench", "/workout/w1", 90, T0);
  assert.deepEqual(parseRest(JSON.stringify(rest)), rest);
  assert.equal(parseRest(null), null);
  assert.equal(parseRest("{}"), null);
  assert.equal(parseRest(JSON.stringify({ exerciseId: "x", endsAt: T0, href: "https://evil.test" }))?.href, "/dashboard");
});

test("clock and spoken text", () => {
  assert.equal(formatClock(90), "1:30");
  assert.equal(formatClock(5), "0:05");
  assert.equal(formatClock(600), "10:00");
  assert.equal(spokenTimeLeft(90), "1 minute 30 seconds left");
  assert.equal(spokenTimeLeft(120), "2 minutes left");
  assert.equal(spokenTimeLeft(1), "1 second left");
  assert.equal(spokenTimeLeft(0), "0 seconds left");
});
