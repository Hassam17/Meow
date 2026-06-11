"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Copy, Library } from "lucide-react";
import { GameLibrary } from "@/components/GameLibrary";
import type { CurrentlyPlaying as CurrentlyPlayingData } from "@/lib/steam";

/* eslint-disable @next/next/no-img-element -- steam avatars are tiny external images */

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
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [copied, setCopied] = useState(false);

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

  function copyFriendCode() {
    if (!data?.friendCode) return;
    navigator.clipboard.writeText(data.friendCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }).catch(() => {});
  }

  return (
    <>
      <div className="block steam-card">
        <div className="steam-card-grid">
          <div className="steam-last-played">
            <div className="steam-card-title">Last played</div>

            <AnimatePresence mode="wait">
              {!data ? (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="steam-game-name">—</div>
                  <div className="steam-time">—</div>
                </motion.div>
              ) : (
                <motion.div
                  key={data.gameName}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="steam-game-name">{data.gameName}</div>
                  <div className="steam-time">
                    {data.recentPlaytimeMinutes > 0
                      ? `${Math.round((data.recentPlaytimeMinutes / 60) * 10) / 10}h recent`
                      : `last played ${formatRelativeTime(data.lastPlayedTimestamp)}`}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {data && (
              <button type="button" className="steam-library-btn" onClick={() => setLibraryOpen(true)}>
                <Library size={14} strokeWidth={1.75} />
                View Library
              </button>
            )}
          </div>

          <div className="steam-user-panel">
            <div className="steam-status-row">
              <div className="steam-status-title">Online Status</div>
              {data && (
                <span className={`status-chip ${data.status}`}>
                  <span className="status-dot" />
                  {data.status}
                </span>
              )}
            </div>

            <div className="steam-profile-row">
              {data?.avatarUrl ? (
                <img src={data.avatarUrl} alt="steam avatar" className="steam-avatar" />
              ) : (
                <div className="steam-avatar steam-avatar-placeholder">pfp</div>
              )}
              <div className="steam-username">{data?.personaName ?? "User name"}</div>
            </div>

            {data?.friendCode && (
              <button
                type="button"
                className="copy-btn"
                onClick={copyFriendCode}
                aria-label="copy steam friend code"
                title={`copy friend code (${data.friendCode})`}
              >
                {copied ? <Check size={13} strokeWidth={2} /> : <Copy size={13} strokeWidth={1.75} />}
                {copied ? "copied!" : "copy friend code"}
              </button>
            )}
          </div>
        </div>

        {data && data.recentlyPlayed.length > 0 && (
          <div className="more-panel steam-more">
            <div className="more-head">last 2 weeks</div>
            {data.recentlyPlayed.map((g) => (
              <div className="more-row" key={g.gameName}>
                <span>{g.gameName}</span>
                <span className="more-meta">
                  {g.hours2w}h · {g.hoursTotal}h total
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <GameLibrary open={libraryOpen} onClose={() => setLibraryOpen(false)} />
    </>
  );
}
