"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { CurrentlyPlaying as CurrentlyPlayingData } from "@/lib/steam";

function formatRelativeTime(unixTs: number): string {
  const diffMs = Date.now() - unixTs * 1000;
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function CurrentlyPlaying() {
  const [data, setData] = useState<CurrentlyPlayingData | null>(null);

  useEffect(() => {
    const load = () =>
      fetch("/api/currently-playing")
        .then((r) => r.json())
        .then(setData)
        .catch(() => {});
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="panel space-y-3">
      <p className="label">◈ currently playing</p>

      <AnimatePresence mode="wait">
        {!data ? (
          <motion.p
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-[var(--text-muted)] text-sm"
          >
            —
          </motion.p>
        ) : (
          <motion.div
            key={data.gameName}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            className="flex gap-3 items-start"
          >
            {data.iconUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.iconUrl}
                alt=""
                className="h-14 w-14 rounded object-cover shrink-0"
                style={{ boxShadow: "0 0 12px rgba(255,107,43,0.12)" }}
              />
            )}
            <div className="min-w-0 flex-1 space-y-0.5">
              <p className="text-[var(--text-primary)] text-sm leading-snug truncate font-[family-name:var(--font-display)] tracking-wide">
                {data.gameName}
              </p>
              <p className="text-[var(--text-muted)] text-xs">
                {Math.round((data.recentPlaytimeMinutes / 60) * 10) / 10}h recent
                <span className="mx-1.5 opacity-40">·</span>
                {data.hoursTotal}h total
              </p>
              <p className="text-[var(--text-muted)] text-[10px] font-[family-name:var(--font-display)] tracking-widest mt-1">
                last played {formatRelativeTime(data.lastPlayedTimestamp)}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
