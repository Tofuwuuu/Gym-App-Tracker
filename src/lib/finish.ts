/**
 * Finishing a workout. The local draft (and rest timer) stay on the phone until
 * the server confirms the save, so a dropped connection never loses sets.
 */

export type SaveResult = { error?: string } | void | undefined;
export type FinishResult = { ok: true } | { ok: false; message?: string };

export type DraftStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export const draftKey = (workoutId: string) => `gym:workout:${workoutId}:v1`;

export function clearDraft(storage: DraftStorage, workoutId: string) {
  try {
    storage.removeItem(draftKey(workoutId));
  } catch {
    /* storage blocked */
  }
}

/** Next.js redirects carry a digest like "NEXT_REDIRECT;replace;/history/w1;307;". */
export function redirectTarget(error: unknown): string | null {
  if (typeof error !== "object" || error === null) return null;
  const digest = (error as { digest?: unknown }).digest;
  if (typeof digest !== "string" || !digest.startsWith("NEXT_REDIRECT")) return null;
  return digest.split(";")[2] ?? "";
}

export function isRedirectError(error: unknown): boolean {
  return redirectTarget(error) !== null;
}

/**
 * Runs the save. `onSaved` (clear draft and timer) runs only once the server has
 * accepted it: a resolved result without an error, or the redirect to savedPath.
 * Any thrown error or returned error keeps everything for "Try again".
 */
export async function runFinish(
  save: () => Promise<SaveResult>,
  onSaved: () => void,
  savedPath?: string
): Promise<FinishResult> {
  let result: SaveResult;
  try {
    result = await save();
  } catch (error) {
    const target = redirectTarget(error);
    if (target !== null) {
      // Only the redirect to the saved workout means success. Any other one
      // (for example to sign-in after a session expired) keeps the draft.
      if (savedPath === undefined || target === savedPath) onSaved();
      throw error;
    }
    return { ok: false };
  }
  if (result && result.error) return { ok: false, message: result.error };
  onSaved();
  return { ok: true };
}
