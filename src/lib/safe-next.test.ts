import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_AFTER_AUTH, safeNextPath } from "./safe-next";

test("same-site paths are kept", () => {
  assert.equal(safeNextPath("/workout/abc123"), "/workout/abc123");
  assert.equal(safeNextPath("/history?tab=all#top"), "/history?tab=all#top");
});

test("protocol-relative, scheme, and backslash tricks fall back", () => {
  for (const bad of [
    "//evil.com",
    "https://evil.com",
    "http://evil.com",
    "/\\evil.com",
    "\\\\evil.com",
    "javascript:alert(1)",
    "evil.com",
    "/\t/evil.com",
    "/workout\\..\\evil",
  ]) {
    assert.equal(safeNextPath(bad), DEFAULT_AFTER_AUTH, bad);
  }
});

test("empty or missing values fall back", () => {
  assert.equal(safeNextPath(""), DEFAULT_AFTER_AUTH);
  assert.equal(safeNextPath(undefined), DEFAULT_AFTER_AUTH);
  assert.equal(safeNextPath(null), DEFAULT_AFTER_AUTH);
  assert.equal(safeNextPath(["/workout/a"]), DEFAULT_AFTER_AUTH);
  assert.equal(safeNextPath("", "/"), "/");
});
