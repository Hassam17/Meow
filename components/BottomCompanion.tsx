"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type RefObject } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, Dumbbell, Gamepad2, Music2, Moon, Sun } from "lucide-react";
import { getServerThemeMode, getThemeMode, subscribeTheme } from "@/lib/theme";
import { getPrefs, getServerPrefs, subscribePrefs } from "@/lib/prefs";
import { getLifestyle, getServerLifestyle, subscribeLifestyle, type FootballEvent, weekdayKey, GYM_PLAN, isoDate } from "@/lib/lifestyle";
import { usePolling } from "@/lib/usePolling";
import type { NowPlaying as NowPlayingData } from "@/lib/spotify";
import type { CurrentlyPlaying as CurrentlyPlayingData } from "@/lib/steam";

type FaceMode = "idle" | "blink" | "wink" | "talk";

type BottomCompanionProps = {
  docked?: boolean;
  boundsRef?: RefObject<HTMLElement | null>;
};

function useLifestyleStore() {
  return useSyncExternalStore(subscribeLifestyle, getLifestyle, getServerLifestyle);
}

function eventStart(event: FootballEvent): Date {
  return new Date(`${event.date}T${event.startTime}:00`);
}

function formatClock(value: string): string {
  const [hours, mins] = value.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, mins, 0, 0);
  return date.toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" });
}

export function BottomCompanion({ docked = false, boundsRef }: BottomCompanionProps) {
  const mode = useSyncExternalStore(subscribeTheme, getThemeMode, getServerThemeMode);
  const prefs = useSyncExternalStore(subscribePrefs, getPrefs, getServerPrefs);
  const lifestyle = useLifestyleStore();
  const { data: spotify } = usePolling<NowPlayingData>("/api/now-playing", 10_000);
  const { data: steam } = usePolling<CurrentlyPlayingData>("/api/currently-playing", 15_000);
  const [open, setOpen] = useState(false);
  const [face, setFace] = useState<FaceMode>("idle");
  const draggedRef = useRef(false);
  const talkTimerRef = useRef<number | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [dragOffset, setDragOffset] = useState(() => (docked ? { x: 12, y: 14 } : { x: 0, y: 0 }));

  const today = new Date();
  const todayIso = isoDate(today);
  const todayPlanKey = weekdayKey(today);
  const todayPlan = GYM_PLAN.find((day) => day.key === todayPlanKey) ?? GYM_PLAN[0];
  const gymDone = lifestyle.gymCheckins[todayIso] === todayPlanKey;
  const nextFootball = lifestyle.football
    .filter((event) => !event.played && eventStart(event) >= today)
    .sort((a, b) => eventStart(a).getTime() - eventStart(b).getTime())[0] ?? null;

  const mood = useMemo(() => {
    if (spotify?.isPlaying) return `listening: ${spotify.trackName}`;
    if (steam?.status === "in-game") return `locked into ${steam.gameName}`;
    if (nextFootball) return `next football ${formatClock(nextFootball.startTime)}`;
    if (gymDone) return "gym split completed";
    return "cat on dashboard duty";
  }, [spotify, steam, nextFootball, gymDone]);

  const status = useMemo(() => {
    const themeLabel =
      mode === "glass"
        ? "glass coat"
        : mode === "retro"
          ? "retro coat"
          : mode === "fifa"
            ? "squad coat"
            : mode === "mission-control"
              ? "mission coat"
              : "cyber coat";
    const spotifyLabel = spotify?.isPlaying ? `${spotify.trackName} live on spotify` : "spotify idling";
    const steamLabel = steam?.status === "in-game" ? `${steam.gameName} on steam` : "steam standing by";
    const footballLabel = nextFootball
      ? `football ${nextFootball.date} ${formatClock(nextFootball.startTime)}`
      : "no football booked";
    const gymLabel = gymDone ? `${todayPlan.focus} done` : `${todayPlan.focus} pending`;
    const pollingLabel = prefs.pollingEnabled ? "live sync on" : "live sync paused";
    return [themeLabel, spotifyLabel, steamLabel, footballLabel, gymLabel, pollingLabel];
  }, [mode, spotify, steam, nextFootball, gymDone, todayPlan.focus, prefs.pollingEnabled]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setFace((current) => {
        if (current === "talk") return current;
        return current === "idle" ? (Math.random() > 0.72 ? "wink" : "blink") : "idle";
      });
    }, 2600);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    return () => {
      if (talkTimerRef.current !== null) {
        window.clearTimeout(talkTimerRef.current);
      }
    };
  }, []);

  function toggleOpen() {
    if (draggedRef.current) return;
    if (talkTimerRef.current !== null) {
      window.clearTimeout(talkTimerRef.current);
    }
    setFace("talk");
    talkTimerRef.current = window.setTimeout(() => {
      setFace("idle");
      talkTimerRef.current = null;
    }, 900);
    setOpen((current) => !current);
  }

  function renderThemeIcon() {
    return mode === "glass" ? <Moon size={12} strokeWidth={1.75} /> : <Sun size={12} strokeWidth={1.75} />;
  }

  function clampOffset(nextX: number, nextY: number) {
    if (!docked || !boundsRef?.current || !wrapRef.current) return { x: nextX, y: nextY };
    const bounds = boundsRef.current.getBoundingClientRect();
    const wrap = wrapRef.current.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(nextX, bounds.width - wrap.width)),
      y: Math.max(0, Math.min(nextY, bounds.height - wrap.height)),
    };
  }

  return (
    <motion.div
      ref={wrapRef}
      className={`companion-wrap${docked ? " docked" : ""}`}
      aria-live="polite"
      drag
      dragConstraints={docked ? boundsRef : undefined}
      dragMomentum={false}
      style={{ x: dragOffset.x, y: dragOffset.y }}
      onDragStart={() => {
        draggedRef.current = true;
      }}
      onDragEnd={(_event, info) => {
        setDragOffset((current) => clampOffset(current.x + info.offset.x, current.y + info.offset.y));
        window.setTimeout(() => {
          draggedRef.current = false;
        }, 120);
      }}
    >
      <AnimatePresence>
        {open && (
          <motion.div
            className="companion-bubble"
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="companion-bubble-kicker">nutcat status</div>
            <div className="companion-bubble-line">{mood}</div>
            <div className="companion-status-list">
              <div className="companion-status-item">
                {renderThemeIcon()}
                {status[0]}
              </div>
              <div className="companion-status-item">
                <Music2 size={12} strokeWidth={1.75} />
                {status[1]}
              </div>
              <div className="companion-status-item">
                <Gamepad2 size={12} strokeWidth={1.75} />
                {status[2]}
              </div>
              <div className="companion-status-item">
                <CalendarDays size={12} strokeWidth={1.75} />
                {status[3]}
              </div>
              <div className="companion-status-item">
                <Dumbbell size={12} strokeWidth={1.75} />
                {status[4]}
              </div>
            </div>
            <div className="companion-bubble-note">{status[5]}</div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        className="companion-body companion-body-cat"
        onClick={toggleOpen}
        aria-label={open ? "close cat companion status" : "open cat companion status"}
        whileTap={{ scale: 0.96 }}
        animate={{ y: [0, -5, 0], rotate: [0, -1.5, 1.5, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="companion-shadow" aria-hidden />
        <div className="cat-tail" aria-hidden />
        <div className="cat-head">
          <div className="cat-ear cat-ear-left" />
          <div className="cat-ear cat-ear-right" />
          <div className="cat-eye-wrap">
            <div className={`cat-eye ${face === "blink" || face === "wink" ? "blink" : ""}`} />
            <div className={`cat-eye ${face === "blink" ? "blink" : ""} ${face === "wink" ? "wink-open" : ""}`} />
          </div>
          <div className={`cat-mouth ${face === "talk" ? "talk" : ""}`} />
          <div className="cat-whiskers cat-whiskers-left" />
          <div className="cat-whiskers cat-whiskers-right" />
        </div>
        <div className="cat-torso">
          <div className="cat-belly" />
          <div className="cat-paw cat-paw-left" />
          <div className="cat-paw cat-paw-right" />
        </div>
      </motion.button>
    </motion.div>
  );
}
