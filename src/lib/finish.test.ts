import assert from "node:assert/strict";
import { test } from "node:test";
import { clearDraft, draftKey, finishFailureNotice, isRedirectError, runFinish, UNAUTHORIZED, type DraftStorage } from "./finish";

function memoryStorage(seed: Record<string, string> = {}): DraftStorage & { data: Record<string, string> } {
  const data = { ...seed };
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => {
      data[k] = v;
    },
    removeItem: (k) => {
      delete data[k];
    },
  };
}

const ID = "w1";
const withDraft = () => memoryStorage({ [draftKey(ID)]: '{"version":1,"exercises":[],"notes":""}' });

test("a network failure keeps the draft", async () => {
  const storage = withDraft();
  const result = await runFinish(
    () => Promise.reject(new TypeError("Failed to fetch")),
    () => clearDraft(storage, ID)
  );
  assert.deepEqual(result, { ok: false, reason: "error" });
  assert.equal(finishFailureNotice("error", ID).action.label, "Try again");
  assert.ok(storage.getItem(draftKey(ID)));
});

test("a server error result keeps the draft", async () => {
  const storage = withDraft();
  const result = await runFinish(
    async () => ({ error: "Could not save workout" }),
    () => clearDraft(storage, ID)
  );
  assert.deepEqual(result, { ok: false, reason: "error", message: "Could not save workout" });
  assert.ok(storage.getItem(draftKey(ID)));
});

test("a confirmed save clears the draft", async () => {
  const storage = withDraft();
  const result = await runFinish(async () => undefined, () => clearDraft(storage, ID));
  assert.deepEqual(result, { ok: true });
  assert.equal(storage.getItem(draftKey(ID)), null);
});

test("the success redirect clears the draft and still redirects", async () => {
  const storage = withDraft();
  const redirect = Object.assign(new Error("NEXT_REDIRECT"), { digest: "NEXT_REDIRECT;replace;/history/w1;307;" });
  await assert.rejects(
    runFinish(() => Promise.reject(redirect), () => clearDraft(storage, ID), "/history/w1"),
    redirect
  );
  assert.equal(storage.getItem(draftKey(ID)), null);
  assert.equal(isRedirectError(new Error("boom")), false);
});

test("retry after a failure clears the draft once it succeeds", async () => {
  const storage = withDraft();
  let calls = 0;
  const save = async () => {
    calls += 1;
    if (calls === 1) throw new Error("server down");
    return undefined;
  };
  const first = await runFinish(save, () => clearDraft(storage, ID));
  assert.equal(first.ok, false);
  assert.ok(storage.getItem(draftKey(ID)), "draft kept after first failure");
  const second = await runFinish(save, () => clearDraft(storage, ID));
  assert.equal(second.ok, true);
  assert.equal(calls, 2);
  assert.equal(storage.getItem(draftKey(ID)), null);
});

test("a redirect to sign-in (expired session) keeps the draft", async () => {
  const storage = withDraft();
  const redirect = Object.assign(new Error("NEXT_REDIRECT"), { digest: "NEXT_REDIRECT;replace;/sign-in;307;" });
  await assert.rejects(
    runFinish(() => Promise.reject(redirect), () => clearDraft(storage, ID), "/history/w1"),
    redirect
  );
  assert.ok(storage.getItem(draftKey(ID)));
});

test("an unauthorized result shows the signed-out box and keeps the draft", async () => {
  const storage = withDraft();
  const result = await runFinish(async () => ({ error: UNAUTHORIZED }), () => clearDraft(storage, ID), "/history/w1");
  assert.deepEqual(result, { ok: false, reason: "unauthorized" });
  assert.ok(storage.getItem(draftKey(ID)));
  const notice = finishFailureNotice("unauthorized", ID);
  assert.equal(
    notice.text,
    "You've been signed out. Sign in again to save your workout. Your sets are still on this phone."
  );
  assert.equal(notice.action.label, "Sign in");
  assert.equal(notice.action.href, "/sign-in?next=%2Fworkout%2Fw1");
});

test("network and server errors keep the Try again box", () => {
  const notice = finishFailureNotice("error", ID);
  assert.equal(notice.text, "Couldn't save your workout. Your sets are still on this phone.");
  assert.equal(notice.action.label, "Try again");
  assert.equal(notice.action.href, null);
});
