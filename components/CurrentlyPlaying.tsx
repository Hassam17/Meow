"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gamepad2 } from "lucide-react";
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
    <div className="block">
      <div className="block-label">
        <Gamepad2 size={14} strokeWidth={1.75} />
        currently playing
      </div>

      <AnimatePresence mode="wait">
        {!data ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="block-value">
            —
          </motion.div>
        ) : (
          <motion.div
            key={data.gameName}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3 }}
          >
            <div className="block-value">{data.gameName}</div>
            <div className="block-sub">
              {data.recentPlaytimeMinutes > 0
                ? `${Math.round((data.recentPlaytimeMinutes / 60) * 10) / 10}h recent · ${data.hoursTotal}h total`
                : `last played ${formatRelativeTime(data.lastPlayedTimestamp)}`}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {data && data.recentlyPlayed.length > 0 && (
        <div className="more-panel">
          <div className="more-head">recently played</div>
          {data.recentlyPlayed.map((g) => (
            <div className="more-row" key={g.gameName}>
              <span>{g.gameName}</span>
              <span className="more-meta">{g.hoursTotal}h total</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
