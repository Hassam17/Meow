"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { BarChart3, Check, Gamepad2, Plus } from "lucide-react";

type Session = { date: string; mins: number };
type Game = { name: string; sessions: Session[] };
type GameMap = Record<string, Game>;

const STORAGE_KEY = "nutmag-sessions";
const DAYS_SHOWN = 14;
const DOW_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const DEFAULT_GAMES: GameMap = {
  tekken8: { name: "Tekken 8", sessions: [] },
  elden: { name: "Elden Ring", sessions: [] },
  cs2: { name: "CS2", sessions: [] },
};

// hydration sentinel: false during SSR + first client render, true after —
// lets us pull from localStorage without a server/client mismatch
const emptySubscribe = () => () => {};

function loadGames(): GameMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as GameMap;
  } catch {
    // fall through to defaults
  }
  return DEFAULT_GAMES;
}

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function lastNDays(n: number): string[] {
  const days: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push(isoDate(d));
  }
  return days;
}

function formatMins(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

export function SessionTracker() {
  const hydrated = useSyncExternalStore(emptySubscribe, () => true, () => false);
  // null until loaded from localStorage — keeps SSR and first client render identical
  const [games, setGames] = useState<GameMap | null>(null);
  const [selected, setSelected] = useState("tekken8");
  const [minsInput, setMinsInput] = useState("");
  const [copied, setCopied] = useState(false);

  // render-phase init on the first post-hydration render ("adjusting state
  // during render" — see react.dev/learn/you-might-not-need-an-effect)
  if (hydrated && games === null) {
    setGames(loadGames());
  }

  useEffect(() => {
    if (games) localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
  }, [games]);

  if (!games) {
    return (
      <div className="block">
        <div className="block-label">
          <Gamepad2 size={14} strokeWidth={1.75} />
          session tracker
        </div>
        <div className="block-sub">loading...</div>
      </div>
    );
  }

  const game = games[selected] ?? Object.values(games)[0];

  function switchGame(value: string) {
    if (value !== "custom") {
      setSelected(value);
      return;
    }
    const name = prompt("Game name:");
    if (!name) return;
    const key = name.toLowerCase().replace(/\s+/g, "_");
    setGames((prev) => (prev && !prev[key] ? { ...prev, [key]: { name, sessions: [] } } : prev));
    setSelected(key);
  }

  function addSession() {
    const mins = parseInt(minsInput, 10);
    if (!mins || mins < 1) return;
    const today = isoDate(new Date());
    setGames((prev) => {
      if (!prev) return prev;
      const g = prev[selected];
      if (!g) return prev;
      const existing = g.sessions.find((s) => s.date === today);
      const sessions = existing
        ? g.sessions.map((s) => (s.date === today ? { ...s, mins: s.mins + mins } : s))
        : [...g.sessions, { date: today, mins }];
      return { ...prev, [selected]: { ...g, sessions } };
    });
    setMinsInput("");
  }

  const days = lastNDays(DAYS_SHOWN);
  const byDay: Record<string, number> = {};
  game.sessions.forEach((s) => {
    byDay[s.date] = (byDay[s.date] ?? 0) + s.mins;
  });
  const vals = days.map((d) => byDay[d] ?? 0);
  const maxVal = Math.max(...vals, 1);
  const total = vals.reduce((a, b) => a + b, 0);
  const avg = total > 0 ? Math.round(total / DAYS_SHOWN) : 0;
  const best = Math.max(...vals);
  const recent = game.sessions
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  function copyReport() {
    const daysPlayed = vals.filter((v) => v > 0).length;
    const breakdown = days.map((d) => `${d}: ${byDay[d] ?? 0}m`).join(", ");
    const text =
      `Generate a gaming session report for ${game.name}. ` +
      `Data from last ${DAYS_SHOWN} days: total ${total} mins across ${daysPlayed} days. ` +
      `Best day: ${best} mins. Daily breakdown: ${breakdown}. ` +
      `Give me insights, streaks, and suggestions.`;
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {});
  }

  return (
    <div className="block">
      <div className="block-label">
        <Gamepad2 size={14} strokeWidth={1.75} />
        session tracker
      </div>

      <select className="tracker-select" value={selected} onChange={(e) => switchGame(e.target.value)}>
        {Object.entries(games).map(([key, g]) => (
          <option key={key} value={key}>
            {g.name}
          </option>
        ))}
        <option value="custom">+ add game...</option>
      </select>

      <div className="tracker-body">
        {/* hidden while collapsed — revealed when the column expands on hover */}
        <div className="tracker-chart-pane">
          <div className="tracker-chart-inner">
          <div className="tracker-sub-label">daily sessions · last {DAYS_SHOWN} days</div>
          <div className="chart-bars">
            {vals.map((v, i) => {
              const isToday = i === vals.length - 1;
              return (
                <div
                  className="cb"
                  key={days[i]}
                  style={{
                    height: `${Math.max(4, Math.round((v / maxVal) * 100))}%`,
                    background: isToday ? "var(--accent-orange)" : "var(--accent-cyan)",
                    opacity: v ? 1 : 0.2,
                  }}
                >
                  <div className="cb-tip">{v ? `${v}m` : "—"}</div>
                </div>
              );
            })}
          </div>
          <div className="chart-labels">
            {days.map((d, i) => (
              <span key={d} className={i === days.length - 1 ? "today" : undefined}>
                {DOW_SHORT[new Date(`${d}T00:00:00`).getDay()]}
              </span>
            ))}
          </div>
          <div className="tracker-stats">
            <div className="tracker-stat">
              <div className="tracker-stat-n">{Math.round(total / 60)}h</div>
              <div className="tracker-stat-l">14-day total</div>
            </div>
            <div className="tracker-stat">
              <div className="tracker-stat-n">{avg}m</div>
              <div className="tracker-stat-l">avg/day</div>
            </div>
            <div className="tracker-stat">
              <div className="tracker-stat-n">{Math.round((best / 60) * 10) / 10}h</div>
              <div className="tracker-stat-l">best day</div>
            </div>
          </div>
          </div>
        </div>

        <div className="tracker-log-pane">
          <div className="tracker-sub-label">recent log</div>
          <div className="session-log">
            {recent.length === 0 ? (
              <div className="slog-empty">no sessions yet — log one below</div>
            ) : (
              recent.map((s) => (
                <div className="slog-row" key={s.date}>
                  <span>
                    {new Date(`${s.date}T00:00:00`).toLocaleDateString("en", { month: "short", day: "numeric" })}
                  </span>
                  <span className="slog-dur">{formatMins(s.mins)}</span>
                </div>
              ))
            )}
          </div>
          <div className="add-session">
            <input
              type="number"
              min={1}
              max={600}
              placeholder="mins played today"
              value={minsInput}
              onChange={(e) => setMinsInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addSession()}
            />
            <button type="button" onClick={addSession}>
              <Plus size={12} strokeWidth={1.75} />
              log
            </button>
          </div>
          <button type="button" className="report-btn" onClick={copyReport}>
            {copied ? <Check size={12} strokeWidth={2} /> : <BarChart3 size={12} strokeWidth={1.75} />}
            {copied ? "report prompt copied" : "copy report prompt"}
          </button>
        </div>
      </div>
    </div>
  );
}
