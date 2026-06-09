"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  const [key, setKey] = useState(0);

  useEffect(() => {
    const load = () =>
      fetch("/api/now-playing")
        .then((r) => r.json())
        .then((d) => {
          setData((prev) => {
            if (prev?.trackName !== d?.trackName) setKey((k) => k + 1);
            return d;
          });
        })
        .catch(() => {});
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="panel space-y-3">
      <div className="flex items-center justify-between">
        <p className="label">♪ now playing</p>
        {data?.isPlaying && (
          <span className="flex items-center gap-1.5">
            <span
              className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent-cyan)]"
              style={{ color: "var(--accent-cyan)" }}
            />
            <span className="text-[var(--accent-cyan)] text-[10px] font-[family-name:var(--font-display)] tracking-widest uppercase">
              live
            </span>
          </span>
        )}
      </div>

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
            key={key}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            className="flex gap-3 items-start"
          >
            {data.albumArtUrl && (
              <div className="relative shrink-0">
                {/* blurred album art as bg accent */}
                <div
                  className="absolute inset-0 rounded blur-xl opacity-30 scale-110"
                  style={{ backgroundImage: `url(${data.albumArtUrl})`, backgroundSize: "cover" }}
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={data.albumArtUrl}
                  alt=""
                  className="relative h-14 w-14 rounded object-cover"
                  style={{ boxShadow: "0 0 12px rgba(0,229,255,0.12)" }}
                />
              </div>
            )}

            <div className="min-w-0 flex-1 space-y-0.5">
              <p className="text-[var(--text-primary)] text-sm leading-snug truncate font-[family-name:var(--font-display)] tracking-wide">
                {data.trackName}
              </p>
              <p className="text-[var(--text-muted)] text-xs truncate">
                {data.artist}
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                {data.isPlaying ? (
                  <Equalizer />
                ) : (
                  <p className="text-[var(--text-muted)] text-[10px] font-[family-name:var(--font-display)] tracking-widest">
                    {data.playedAt ? timeAgo(data.playedAt) : "paused"}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
