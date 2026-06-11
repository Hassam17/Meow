"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Music, Pause, Play } from "lucide-react";
import type { NowPlaying as NowPlayingData, PlayerAction } from "@/lib/spotify";

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
  const [controlError, setControlError] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch("/api/now-playing")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [load]);

  async function control(action: PlayerAction, uri?: string) {
    setControlError(null);
    try {
      const res = await fetch("/api/spotify-control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, uri }),
      });
      const result = (await res.json()) as { ok: boolean; error?: string };
      if (!result.ok) {
        setControlError(result.error ?? "control failed");
        return;
      }
      // Give Spotify a beat to apply the change, then refresh the capsule
      setTimeout(load, 700);
    } catch {
      setControlError("control request failed");
    }
  }

  const showQueue = !!data?.isPlaying && (data?.queue.length ?? 0) > 0;
  const progressPercent =
    data?.progressMs != null && data.durationMs
      ? Math.min(100, Math.max(0, (data.progressMs / data.durationMs) * 100))
      : 0;

  return (
    <div className="block spotify-capsule">
      <div className="spotify-label">
        <Music size={14} strokeWidth={1.75} />
        now playing
      </div>

      <AnimatePresence mode="wait">
        {!data ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="spotify-shell"
          >
            <div className="spotify-now-row">
              <div className="spotify-art-frame">
                <Music size={22} strokeWidth={1.75} />
              </div>
              <div className="spotify-copy">
                <div className="spotify-title">—</div>
                <div className="spotify-artist">spotify idle</div>
              </div>
              <div className="spotify-controls">
                <button type="button" className="player-btn" aria-label="previous track" disabled>
                  <ChevronLeft size={18} strokeWidth={2.25} />
                </button>
                <button type="button" className="player-btn player-btn-main" aria-label="play" disabled>
                  <Play size={18} strokeWidth={2.25} />
                </button>
                <button type="button" className="player-btn" aria-label="next track" disabled>
                  <ChevronRight size={18} strokeWidth={2.25} />
                </button>
              </div>
            </div>
            <div className="spotify-progress" aria-hidden="true">
              <span style={{ width: "0%" }} />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key={`${data.trackName}-${data.playedAt ?? "live"}`}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3 }}
            className="spotify-shell"
          >
            <div className="spotify-now-row">
              <div className="spotify-art-frame">
                {data.albumArtUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- spotify album art is a tiny external image
                  <img src={data.albumArtUrl} alt="" />
                ) : (
                  <Music size={22} strokeWidth={1.75} />
                )}
              </div>

              <div className="spotify-copy">
                <div className="spotify-title">{data.trackName}</div>
                <div className="spotify-artist">
                  {data.artist}
                  {!data.isPlaying && data.playedAt && ` · ${timeAgo(data.playedAt)}`}
                </div>
              </div>

              <div className="spotify-controls">
                <button type="button" className="player-btn" onClick={() => control("previous")} aria-label="previous track">
                  <ChevronLeft size={18} strokeWidth={2.25} />
                </button>
                <button
                  type="button"
                  className="player-btn player-btn-main"
                  onClick={() => control(data.isPlaying ? "pause" : "play")}
                  aria-label={data.isPlaying ? "pause" : "play"}
                >
                  {data.isPlaying ? <Pause size={18} strokeWidth={2.25} /> : <Play size={18} strokeWidth={2.25} />}
                </button>
                <button type="button" className="player-btn" onClick={() => control("next")} aria-label="next track">
                  <ChevronRight size={18} strokeWidth={2.25} />
                </button>
              </div>
            </div>

            <div className={`spotify-progress${data.isPlaying ? " is-live" : ""}`} aria-hidden="true">
              <span style={{ width: `${progressPercent}%` }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {controlError && <div className="control-error">{controlError}</div>}

      {data && (showQueue || data.recentTracks.length > 0) && (
        <div className="more-panel spotify-more">
          {showQueue ? (
            <>
              <div className="more-head">Recently Played / Queue</div>
              {data.queue.map((t, i) => (
                <div className="more-row" key={i}>
                  <span>{t.trackName}</span>
                  <span className="more-meta">{t.artist}</span>
                </div>
              ))}
            </>
          ) : (
            <>
              <div className="more-head">Recently Played / Queue</div>
              {data.recentTracks.map((t, i) => (
                <div
                  className="more-row clickable"
                  key={i}
                  onClick={() => control("play-track", t.uri)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") control("play-track", t.uri);
                  }}
                >
                  <span>{t.trackName}</span>
                  <span className="more-meta">{t.artist}</span>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
