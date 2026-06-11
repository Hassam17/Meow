"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Music } from "lucide-react";
import { Equalizer } from "@/components/Equalizer";
import type { NowPlaying as NowPlayingData } from "@/lib/spotify";

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function NowPlaying() {
  const [data, setData] = useState<NowPlayingData | null>(null);

  useEffect(() => {
    const load = () =>
      fetch("/api/now-playing")
        .then((r) => r.json())
        .then(setData)
        .catch(() => {});
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="block accent-left">
      <div className="block-label">
        <Music size={14} strokeWidth={1.75} />
        now playing
      </div>

      <AnimatePresence mode="wait">
        {!data ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="block-value">
            —
          </motion.div>
        ) : (
          <motion.div
            key={`${data.trackName}-${data.playedAt ?? "live"}`}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3 }}
          >
            {data.isPlaying && (
              <div className="mb-1.5">
                <Equalizer />
              </div>
            )}
            <div className="block-value">{data.trackName}</div>
            <div className="block-sub">
              {data.artist}
              {!data.isPlaying && data.playedAt && ` · ${timeAgo(data.playedAt)}`}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {data && data.recentTracks.length > 0 && (
        <div className="more-panel">
          <div className="more-head">recently played</div>
          {data.recentTracks.map((t, i) => (
            <div className="more-row" key={i}>
              <span>{t.trackName}</span>
              <span className="more-meta">{t.artist}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
