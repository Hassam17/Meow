"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, RadioTower, Sun, Wrench } from "lucide-react";
import { getServerThemeMode, getThemeMode, subscribeTheme } from "@/lib/theme";
import { getPrefs, getServerPrefs, subscribePrefs } from "@/lib/prefs";

const LINES = [
  "dashboard stable",
  "widgets synced",
  "systems cozy",
  "ready for trouble",
];

export function BottomCompanion() {
  const mode = useSyncExternalStore(subscribeTheme, getThemeMode, getServerThemeMode);
  const prefs = useSyncExternalStore(subscribePrefs, getPrefs, getServerPrefs);
  const [open, setOpen] = useState(false);
  const [moodIndex, setMoodIndex] = useState(0);

  const status = useMemo(() => {
    const themeLabel = mode === "auto" ? "auto theme" : `${mode} theme`;
    const pollingLabel = prefs.pollingEnabled ? "live polling on" : "live polling off";
    const introLabel = prefs.bootSequence ? "boot intro armed" : "boot intro skipped";
    return [themeLabel, pollingLabel, introLabel];
  }, [mode, prefs]);

  const mood = LINES[moodIndex % LINES.length];

  function toggleOpen() {
    setOpen((current) => !current);
    setMoodIndex((current) => current + 1);
  }

  return (
    <div className="companion-wrap" aria-live="polite">
      <AnimatePresence>
        {open && (
          <motion.div
            className="companion-bubble"
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="companion-bubble-kicker">nutpal status</div>
            <div className="companion-bubble-line">{mood}</div>
            <div className="companion-status-list">
              <div className="companion-status-item">
                {mode === "dark" ? <Moon size={12} strokeWidth={1.75} /> : <Sun size={12} strokeWidth={1.75} />}
                {status[0]}
              </div>
              <div className="companion-status-item">
                <RadioTower size={12} strokeWidth={1.75} />
                {status[1]}
              </div>
              <div className="companion-status-item">
                <Wrench size={12} strokeWidth={1.75} />
                {status[2]}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        className="companion-body"
        onClick={toggleOpen}
        aria-label={open ? "close companion status" : "open companion status"}
        whileTap={{ scale: 0.96 }}
        animate={{ y: [0, -5, 0], rotate: [0, -1.5, 1.5, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="companion-shadow" aria-hidden />
        <div className="companion-head">
          <div className="companion-eye" />
          <div className="companion-eye" />
          <div className="companion-mouth" />
        </div>
        <div className="companion-torso">
          <div className="companion-badge" />
        </div>
        <div className="companion-arm companion-arm-left" />
        <div className="companion-arm companion-arm-right" />
        <div className="companion-leg companion-leg-left" />
        <div className="companion-leg companion-leg-right" />
      </motion.button>
    </div>
  );
}
