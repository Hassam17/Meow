"use client";

import { useEffect, useState } from "react";
import type { NowPlaying as NowPlayingData } from "@/lib/spotify";

export function NowPlaying() {
  const [data, setData] = useState<NowPlayingData | null>(null);

  useEffect(() => {
    const load = () => fetch("/api/now-playing").then((r) => r.json()).then(setData).catch(() => setData(null));
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <section>
      <h2 className="font-[family-name:var(--font-display)] text-[var(--accent-cyan)]">Now Playing</h2>
      {!data && <p className="text-[var(--text-muted)]">nothing to show</p>}
      {data && (
        <div className="flex items-center gap-3">
          {data.albumArtUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.albumArtUrl} alt="" className="h-16 w-16 rounded" />
          )}
          <div>
            <p className="text-[var(--text-primary)]">{data.trackName}</p>
            <p className="text-sm text-[var(--text-muted)]">{data.artist}</p>
            <p className="text-xs text-[var(--text-muted)]">
              {data.isPlaying ? "live" : data.playedAt ? `last played ${data.playedAt}` : "paused"}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
