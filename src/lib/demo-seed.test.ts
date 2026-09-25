import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { demoWorkingSetCount, planDemoSessions } from "./demo-seed";
import { consecutiveTrainingStreak, localDateKey } from "./workout-utils";

function shiftDays(date: Date, days: number) {
  const next = new Date(date.getTime());
  next.setDate(next.getDate() + days);
  return next;
}

/** Same year filter the overview uses before it counts the streak. */
function overviewStreak(startedAt: Date[], now: Date) {
  const year = now.getFullYear();
  const days = startedAt.filter((date) => date.getFullYear() === year).map(localDateKey);
  return consecutiveTrainingStreak(days, now);
}

describe("demo session dates", () => {
  it("keeps nine workouts and 81 working sets", () => {
    assert.equal(planDemoSessions(new Date(2026, 8, 25, 19, 0, 0, 0)).length, 9);
    assert.equal(demoWorkingSetCount(), 81);
  });

  it("dates sessions from the seed day and keeps a streak through the next morning", () => {
    const seededAt = new Date(2026, 8, 25, 19, 0, 0, 0);
    const startedAt = planDemoSessions(seededAt).map((session) => session.startedAt);
    const keys = new Set(startedAt.map(localDateKey));

    assert.equal(keys.size, 9);
    assert.equal(keys.has(localDateKey(seededAt)), true);
    assert.equal(keys.has(localDateKey(shiftDays(seededAt, -1))), true);
    assert.equal(keys.has(localDateKey(shiftDays(seededAt, -2))), true);
    assert.equal(keys.has(localDateKey(shiftDays(seededAt, -20))), true);

    const newest = startedAt.reduce((latest, date) => (date > latest ? date : latest));
    const oldest = startedAt.reduce((earliest, date) => (date < earliest ? date : earliest));
    const spanDays = Math.round((newest.getTime() - oldest.getTime()) / 86_400_000);
    assert.ok(spanDays >= 18 && spanDays <= 21);

    assert.equal(overviewStreak(startedAt, seededAt), 3);

    const nextMorning = new Date(2026, 8, 26, 8, 0, 0, 0);
    assert.equal(overviewStreak(startedAt, nextMorning), 3);
  });

  it("still leaves a nonzero streak when the reset falls on January 1", () => {
    const seededAt = new Date(2026, 0, 1, 19, 0, 0, 0);
    const startedAt = planDemoSessions(seededAt).map((session) => session.startedAt);

    assert.ok(overviewStreak(startedAt, seededAt) >= 1);
    assert.ok(overviewStreak(startedAt, new Date(2026, 0, 2, 8, 0, 0, 0)) >= 1);
  });
});
