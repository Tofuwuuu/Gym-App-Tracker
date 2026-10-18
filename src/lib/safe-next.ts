/**
 * Where to send someone after sign-in or sign-up. Only same-site paths that
 * start with a single "/" are allowed; everything else falls back.
 */
export const DEFAULT_AFTER_AUTH = "/dashboard";

export function safeNextPath(raw: unknown, fallback: string = DEFAULT_AFTER_AUTH): string {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > 2048) return fallback;
  if (!raw.startsWith("/")) return fallback; // "http:", "https://", "javascript:", relative paths
  if (raw[1] === "/" || raw[1] === "\\") return fallback; // "//evil.com", "/\\evil.com"
  // Backslashes and control characters or whitespace can be read as other hosts by browsers.
  if (/[\\\u0000-\u001f\u007f\s]/.test(raw)) return fallback;
  try {
    const base = "https://same.site";
    const url = new URL(raw, base);
    if (url.origin !== base) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
