"use client";

import { useEffect, useState } from "react";
import type { CurrentlyPlaying as CurrentlyPlayingData } from "@/lib/steam";

function formatRelativeTime(unixTs: number): string {
  const diffMs = Date.now() - unixTs * 1000;
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

export function CurrentlyPlaying() {
  const [data, setData] = useState<CurrentlyPlayingData | null>(null);

  useEffect(() => {
    const load = () =>
      fetch("/api/currently-playing")
        .then((r) => r.json())
        .then(setData)
        .catch(() => setData(null));
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <section>
      <h2 className="font-[family-name:var(--font-display)] text-[var(--accent-orange)]">Currently Playing</h2>
      {!data && <p className="text-[var(--text-muted)]">nothing to show</p>}
      {data && (
        <div className="flex items-center gap-3">
          {data.iconUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.iconUrl} alt="" className="h-16 w-16 rounded" />
          )}
          <div>
            <p className="text-[var(--text-primary)]">{data.gameName}</p>
            <p className="text-sm text-[var(--text-muted)]">
              {Math.round(data.recentPlaytimeMinutes / 60 * 10) / 10}h recent · {data.hoursTotal}h total
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              last played {formatRelativeTime(data.lastPlayedTimestamp)}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
