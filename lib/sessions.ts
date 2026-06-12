// Session-tracker store — same external-store pattern as lib/layout.ts.
// Lives outside the component so the tracker card and its flyout (separate
// components under the widget framework) share one source of truth for the
// game list and the current selection. Games persist to
// localStorage["nutmag-sessions"]; the selection is per-visit.

export type Session = { date: string; mins: number };
export type Game = { name: string; sessions: Session[] };
export type GameMap = Record<string, Game>;

const STORAGE_KEY = "nutmag-sessions";
const listeners = new Set<() => void>();

const DEFAULT_GAMES: GameMap = {
  tekken8: { name: "Tekken 8", sessions: [] },
  elden: { name: "Elden Ring", sessions: [] },
  cs2: { name: "CS2", sessions: [] },
};

let games: GameMap | null = null;
let selected = "tekken8";

function emit() {
  listeners.forEach((listener) => listener());
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
  } catch {
    // storage full/blocked — data still applies for this session
  }
}

/** null on the server / first hydration render; real data right after */
export function getGames(): GameMap | null {
  if (games === null) {
    games = DEFAULT_GAMES;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) games = JSON.parse(raw) as GameMap;
    } catch {
      // corrupt saved sessions — keep the defaults
    }
  }
  return games;
}

export function getServerGames(): GameMap | null {
  return null;
}

export function getSelected(): string {
  return selected;
}

export function setSelected(key: string) {
  selected = key;
  emit();
}

/** add a game and select it; returns the new key */
export function addGame(name: string): string {
  const key = name.toLowerCase().replace(/\s+/g, "_");
  const current = getGames() ?? DEFAULT_GAMES;
  if (!current[key]) {
    games = { ...current, [key]: { name, sessions: [] } };
    persist();
  }
  selected = key;
  emit();
  return key;
}

export function addSession(gameKey: string, mins: number) {
  const current = getGames();
  const game = current?.[gameKey];
  if (!current || !game || mins < 1) return;
  const today = isoDate(new Date());
  const existing = game.sessions.find((s) => s.date === today);
  const sessions = existing
    ? game.sessions.map((s) => (s.date === today ? { ...s, mins: s.mins + mins } : s))
    : [...game.sessions, { date: today, mins }];
  games = { ...current, [gameKey]: { ...game, sessions } };
  persist();
  emit();
}

export function subscribeSessions(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function lastNDays(n: number): string[] {
  const days: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push(isoDate(d));
  }
  return days;
}
