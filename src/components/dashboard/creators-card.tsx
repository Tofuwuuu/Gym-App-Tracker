"use client";

import { useEffect, useState } from "react";
import type { CreatorVideo } from "@/lib/creators";

/** Latest videos from a few creators. Renders nothing if the feed fails or is empty. */
export function CreatorsCard() {
  const [videos, setVideos] = useState<CreatorVideo[]>([]);

  useEffect(() => {
    let live = true;
    fetch("/api/creators")
      .then((res) => (res.ok ? res.json() : { videos: [] }))
      .then((data) => {
        if (live && Array.isArray(data?.videos)) setVideos(data.videos.slice(0, 3));
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  if (videos.length === 0) return null;

  return (
    <section aria-labelledby="creators-heading" className="rounded-xl border border-border bg-card p-3">
      <h2
        id="creators-heading"
        className="mb-2 font-heading text-lg uppercase tracking-wide"
      >
        From creators
      </h2>
      <ul className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-1">
        {videos.map((video) => (
          <li key={video.link} className="w-[78%] max-w-72 shrink-0 snap-start sm:w-64">
            <a
              href={video.link}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Watch ${video.title} by ${video.channel} on YouTube`}
              className="flex min-h-14 items-start gap-3 rounded-lg p-1.5 hover:bg-muted/60"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={video.thumbnail}
                alt=""
                loading="lazy"
                className="h-16 w-28 shrink-0 rounded-md object-cover"
              />
              <span className="min-w-0">
                <span className="line-clamp-2 text-sm font-medium leading-snug">{video.title}</span>
                <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                  {video.channel}
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
