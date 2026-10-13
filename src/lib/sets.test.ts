import assert from "node:assert/strict";
import { test } from "node:test";
import {
  appendSet,
  formatTenths,
  kgToTenths,
  migrateDraft,
  parseRepsInput,
  parseWeightInput,
  prefillFor,
  removeSet,
  restoreSet,
  setLabel,
  stepReps,
  stepWeight,
  tenthsToKg,
  updateSet,
  type LoggedSet,
} from "./sets";

test("kg converts to integer tenths and back", () => {
  assert.equal(kgToTenths(60), 600);
  assert.equal(kgToTenths(62.5), 625);
  assert.equal(kgToTenths(0.1 + 0.2), 3);
  assert.equal(kgToTenths(-5), 0);
  assert.equal(kgToTenths(Number.NaN), 0);
  assert.equal(tenthsToKg(625), 62.5);
  assert.equal(formatTenths(600), "60");
  assert.equal(formatTenths(625), "62.5");
});

test("stepping 2.5 kg forty times stays exact", () => {
  let w = 0;
  for (let i = 0; i < 40; i += 1) w = stepWeight(w, 1);
  assert.equal(w, 1000);
  assert.equal(formatTenths(w), "100");
  assert.equal(stepWeight(0, -1), 0);
  assert.equal(stepReps(0, -1), 0);
  assert.equal(stepReps(8, 1), 9);
});

test("typed values parse, including a comma decimal", () => {
  assert.equal(parseWeightInput("62.5"), 625);
  assert.equal(parseWeightInput("62,5"), 625);
  assert.equal(parseWeightInput(" 60 "), 600);
  assert.equal(parseWeightInput("abc"), null);
  assert.equal(parseRepsInput("8"), 8);
  assert.equal(parseRepsInput("8.5"), null);
});

test("row label matches the spec", () => {
  assert.equal(setLabel({ setNumber: 3, weightTenths: 600, reps: 8 }), "Set 3 · 60 kg × 8");
  assert.equal(setLabel({ setNumber: 1, weightTenths: 225, reps: 12 }), "Set 1 · 22.5 kg × 12");
});

const three = (): LoggedSet[] => appendSet(appendSet(appendSet([], 600, 8), 625, 6), 650, 5);

test("delete renumbers and undo restores the same set in place", () => {
  const sets = three();
  const { sets: after, removed } = removeSet(sets, 2);
  assert.deepEqual(after.map(setLabel), ["Set 1 · 60 kg × 8", "Set 2 · 65 kg × 5"]);
  assert.ok(removed);
  assert.deepEqual(restoreSet(after, removed), sets);
});

test("undo after another set was logged still lands in its slot", () => {
  const { sets: after, removed } = removeSet(three(), 1);
  const grown = appendSet(after, 700, 3);
  const restored = restoreSet(grown, removed!);
  assert.deepEqual(restored.map(setLabel), [
    "Set 1 · 60 kg × 8",
    "Set 2 · 62.5 kg × 6",
    "Set 3 · 65 kg × 5",
    "Set 4 · 70 kg × 3",
  ]);
});

test("removing a missing set changes nothing", () => {
  const sets = three();
  const result = removeSet(sets, 9);
  assert.equal(result.sets, sets);
  assert.equal(result.removed, null);
});

test("editing a set keeps its number", () => {
  const edited = updateSet(three(), 2, 675, 4);
  assert.equal(setLabel(edited[1]), "Set 2 · 67.5 kg × 4");
});

test("prefill uses this session, then last time, then zeros", () => {
  assert.deepEqual(prefillFor(three(), { weightTenths: 100, reps: 1 }), { weightTenths: 650, reps: 5 });
  assert.deepEqual(prefillFor([], { weightTenths: 575, reps: 10 }), { weightTenths: 575, reps: 10 });
  assert.deepEqual(prefillFor([], undefined), { weightTenths: 0, reps: 0 });
});

test("migration converts stored kilogram weights to tenths without losing sets", () => {
  const legacy = {
    notes: "felt good",
    exercises: [
      {
        key: "a",
        exerciseId: "bench",
        name: "Bench Press",
        sets: [
          { setNumber: 1, weight: 60, reps: 8, completed: true },
          { setNumber: 2, weight: 62.5, reps: 6, isWarmup: true },
          { setNumber: 3, weight: null, reps: 10 },
        ],
      },
    ],
  };
  const draft = migrateDraft(legacy);
  assert.ok(draft);
  assert.equal(draft.notes, "felt good");
  assert.deepEqual(
    draft.exercises[0].sets.map((s) => [s.setNumber, s.weightTenths, s.reps, s.isWarmup]),
    [
      [1, 600, 8, false],
      [2, 625, 6, true],
      [3, 0, 10, false],
    ]
  );
});

test("migration keeps current drafts as they are and is idempotent", () => {
  const current = { version: 1, clientId: "7b0c1c9e-2f4e-4d3a-9b1a-0c8e5f6a7b8c", notes: "", exercises: [{ key: "k", exerciseId: "x", name: "Row", sets: three() }] };
  const once = migrateDraft(current);
  assert.deepEqual(once?.exercises[0].sets, three());
  assert.deepEqual(migrateDraft(once), once);
});

test("migration rejects unreadable data instead of guessing", () => {
  assert.equal(migrateDraft(null), null);
  assert.equal(migrateDraft({ exercises: "nope" }), null);
  assert.equal(migrateDraft({ exercises: [{ exerciseId: "x", name: "Row", sets: [{ weight: "60" }] }] }), null);
});

test("migration gives old drafts a clientId and keeps an existing one", () => {
  const old = migrateDraft({ notes: "", exercises: [] }, () => "11111111-2222-4333-8444-555555555555");
  assert.equal(old?.clientId, "11111111-2222-4333-8444-555555555555");
  const kept = migrateDraft({ clientId: "7b0c1c9e-2f4e-4d3a-9b1a-0c8e5f6a7b8c", exercises: [] }, () => "x");
  assert.equal(kept?.clientId, "7b0c1c9e-2f4e-4d3a-9b1a-0c8e5f6a7b8c");
  const bad = migrateDraft({ clientId: "not-a-uuid", exercises: [] });
  assert.match(bad?.clientId ?? "", /^[0-9a-f-]{36}$/);
});
