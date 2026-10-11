export type CreatorVideo = {
  title: string;
  link: string;
  thumbnail: string;
  channel: string;
  published: string;
};

export type Creator = { name: string; handle: string; channelId: string };

/** Channel ids verified against youtube.com/@handle pages and their RSS feeds. */
export const CREATORS: Creator[] = [
  { name: "David Laid", handle: "@davidlaid", channelId: "UCMqa1mNaKmSSe48FzwohAEA" },
  { name: "Chris Bumstead", handle: "@chrisbumstead", channelId: "UC4514FwdRy5gI6CdC9GPb0w" },
  { name: "Jeff Nippard", handle: "@jeffnippard", channelId: "UC68TLK0mAEzUyHx5x5k-S1Q" },
];

const VIDEO_LINK = /^https:\/\/www\.youtube\.com\/watch\?v=[\w-]{11}$/;
const THUMB = /^https:\/\/i\d?\.ytimg\.com\/vi\/[\w-]{11}\/[\w-]+\.jpg$/;

function decode(text: string) {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .trim();
}

function pick(block: string, pattern: RegExp) {
  const match = block.match(pattern);
  return match ? decode(match[1]) : "";
}

/** Reads a YouTube Atom feed and keeps only title, link, thumbnail, channel and date. */
export function parseFeed(xml: string, channelName: string): CreatorVideo[] {
  const videos: CreatorVideo[] = [];
  for (const [, block] of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
    const title = pick(block, /<title>([^<]*)<\/title>/);
    const link = pick(block, /<link rel="alternate" href="([^"]*)"/);
    const thumbnail = pick(block, /<media:thumbnail url="([^"]*)"/);
    const published = pick(block, /<published>([^<]*)<\/published>/);
    if (!title || !VIDEO_LINK.test(link) || !THUMB.test(thumbnail)) continue;
    if (Number.isNaN(Date.parse(published))) continue;
    videos.push({ title, link, thumbnail, channel: channelName, published });
  }
  return videos.sort((a, b) => Date.parse(b.published) - Date.parse(a.published));
}

/**
 * Merges per-creator lists into the newest `limit` videos overall.
 * Each creator gets one slot first, then a second only if slots remain.
 */
export function mergeLatest(lists: CreatorVideo[][], limit = 3): CreatorVideo[] {
  const byDate = (a: CreatorVideo, b: CreatorVideo) =>
    Date.parse(b.published) - Date.parse(a.published);
  const firsts = lists.map((list) => list[0]).filter(Boolean);
  const seconds = lists.map((list) => list[1]).filter(Boolean);
  const chosen = firsts.sort(byDate).slice(0, limit);
  if (chosen.length < limit) {
    chosen.push(...seconds.sort(byDate).slice(0, limit - chosen.length));
  }
  return chosen.sort(byDate);
}

async function fetchCreator(creator: Creator): Promise<CreatorVideo[]> {
  try {
    const res = await fetch(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${creator.channelId}`,
      { signal: AbortSignal.timeout(4000), headers: { "user-agent": "gym-app-tracker" } }
    );
    if (!res.ok) return [];
    return parseFeed(await res.text(), creator.name).slice(0, 2);
  } catch {
    return [];
  }
}

const HOUR = 60 * 60 * 1000;
const RETRY = 5 * 60 * 1000;
let cache: { at: number; ttl: number; videos: CreatorVideo[] } | null = null;

export function clearCreatorsCache() {
  cache = null;
}

/** Latest creator videos, cached about an hour. Any failure gives an empty list. */
export async function getCreatorVideos(now = Date.now()): Promise<CreatorVideo[]> {
  if (cache && now - cache.at < cache.ttl) return cache.videos;
  try {
    const lists = await Promise.all(CREATORS.map(fetchCreator));
    const videos = mergeLatest(lists, 3);
    cache = { at: now, ttl: videos.length ? HOUR : RETRY, videos };
    return videos;
  } catch {
    return [];
  }
}
