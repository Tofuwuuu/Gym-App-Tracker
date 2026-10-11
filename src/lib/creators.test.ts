import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  clearCreatorsCache,
  getCreatorVideos,
  mergeLatest,
  parseFeed,
  type CreatorVideo,
} from "./creators";

const entry = (id: string, title: string, published: string) => `
 <entry>
  <title>${title}</title>
  <link rel="alternate" href="https://www.youtube.com/watch?v=${id}"/>
  <published>${published}</published>
  <media:group><media:thumbnail url="https://i2.ytimg.com/vi/${id}/hqdefault.jpg" width="480" height="360"/>
  <media:description>drop me</media:description></media:group>
 </entry>`;

const feed = (...entries: string[]) => `<feed><title>X</title>${entries.join("")}</feed>`;

const vid = (n: number, channel: string, day: number): CreatorVideo => ({
  title: `v${n}`,
  link: `https://www.youtube.com/watch?v=${String(n).padStart(11, "a")}`,
  thumbnail: "https://i2.ytimg.com/vi/aaaaaaaaaaa/hqdefault.jpg",
  channel,
  published: new Date(Date.UTC(2026, 9, day)).toISOString(),
});

describe("parseFeed", () => {
  it("keeps only the five fields, newest first, and decodes entities", () => {
    const xml = feed(
      entry("aaaaaaaaaaa", "Old &amp; slow", "2026-09-01T00:00:00+00:00"),
      entry("bbbbbbbbbbb", "New", "2026-10-01T00:00:00+00:00")
    );
    const out = parseFeed(xml, "Jeff");
    assert.deepEqual(out.map((v) => v.title), ["New", "Old & slow"]);
    assert.deepEqual(Object.keys(out[0]).sort(), ["channel", "link", "published", "thumbnail", "title"]);
    assert.equal(out[0].channel, "Jeff");
  });

  it("drops entries with unexpected links or thumbnails and empty feeds", () => {
    const bad = entry("aaaaaaaaaaa", "Bad", "2026-10-01T00:00:00+00:00").replace(
      "https://www.youtube.com/watch",
      "https://evil.example/watch"
    );
    assert.deepEqual(parseFeed(feed(bad), "X"), []);
    assert.deepEqual(parseFeed("<feed></feed>", "X"), []);
  });
});

describe("mergeLatest", () => {
  it("returns the newest 3 with one per creator before any second", () => {
    const a = [vid(1, "A", 10), vid(2, "A", 9)];
    const b = [vid(3, "B", 5)];
    const c = [vid(4, "C", 2)];
    assert.deepEqual(mergeLatest([a, b, c]).map((v) => v.title), ["v1", "v3", "v4"]);
  });

  it("fills with second videos when there are fewer creators", () => {
    const a = [vid(1, "A", 10), vid(2, "A", 9)];
    const b = [vid(3, "B", 5), vid(4, "B", 4)];
    assert.deepEqual(mergeLatest([a, b]).map((v) => v.title), ["v1", "v2", "v3"]);
  });
});

describe("getCreatorVideos", () => {
  const realFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = realFetch;
    clearCreatorsCache();
  });

  it("returns an empty list when every feed fails", async () => {
    globalThis.fetch = (async () => {
      throw new Error("offline");
    }) as typeof fetch;
    assert.deepEqual(await getCreatorVideos(), []);
  });

  it("returns an empty list on non-200 responses", async () => {
    globalThis.fetch = (async () => new Response("no", { status: 500 })) as typeof fetch;
    assert.deepEqual(await getCreatorVideos(), []);
  });

  it("caches results for about an hour", async () => {
    let calls = 0;
    globalThis.fetch = (async () => {
      calls += 1;
      return new Response(feed(entry("aaaaaaaaaaa", "T", "2026-10-01T00:00:00+00:00")));
    }) as typeof fetch;
    const t = Date.now();
    const first = await getCreatorVideos(t);
    const callsAfterFirst = calls;
    await getCreatorVideos(t + 30 * 60 * 1000);
    assert.equal(calls, callsAfterFirst);
    assert.ok(first.length > 0);
    await getCreatorVideos(t + 61 * 60 * 1000);
    assert.ok(calls > callsAfterFirst);
  });
});
