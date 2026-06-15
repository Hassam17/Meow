// Session-tracker store — same external-store pattern as lib/layout.ts.
// Lives outside the component so the tracker card and its flyout (separate
// components under the widget framework) share one source of truth for the
// game list and the current selection. Games persist to
// localStorage["nutmag-sessions"]; the selection is per-visit.

export type Session = { date: string; mins: number };
export type Game = { name: string; sessions: Session[] };
export type GameMap = Record<string, Game>;
export type SteamPresence = { gameName: string; status: "in-game" | "online" | "offline" } | null;

const STORAGE_KEY = "nutmag-sessions";
const listeners = new Set<() => void>();

const DEFAULT_GAMES: GameMap = {
  tekken8: { name: "Tekken 8", sessions: [] },
  elden: { name: "Elden Ring", sessions: [] },
  cs2: { name: "CS2", sessions: [] },
};

let games: GameMap | null = null;
let selected = "tekken8";
let activeSteamSession: { key: string; lastObservedAt: number; carryMs: number } | null = null;

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

function normalizeKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function ensureGame(name: string, select = true): string {
  const key = normalizeKey(name);
  const current = getGames() ?? DEFAULT_GAMES;
  let changed = false;
  if (!current[key]) {
    games = { ...current, [key]: { name, sessions: [] } };
    persist();
    changed = true;
  }
  if (select && selected !== key) {
    selected = key;
    changed = true;
  }
  if (changed) {
    emit();
  }
  return key;
}

/** add a game and select it; returns the new key */
export function addGame(name: string): string {
  return ensureGame(name);
}

function addSessionMinutes(gameKey: string, mins: number) {
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

export function addSession(gameKey: string, mins: number) {
  addSessionMinutes(gameKey, mins);
}

export function syncSteamPresence(presence: SteamPresence, observedAt = Date.now()) {
  const gameName = presence?.status === "in-game" ? presence.gameName.trim() : "";

  if (!gameName) {
    activeSteamSession = null;
    return;
  }

  const key = ensureGame(gameName, false);

  if (!activeSteamSession || activeSteamSession.key !== key) {
    activeSteamSession = { key, lastObservedAt: observedAt, carryMs: 0 };
    return;
  }

  const elapsedMs = Math.max(0, observedAt - activeSteamSession.lastObservedAt) + activeSteamSession.carryMs;
  const wholeMins = Math.floor(elapsedMs / 60_000);

  activeSteamSession.lastObservedAt = observedAt;
  activeSteamSession.carryMs = elapsedMs - wholeMins * 60_000;

  if (wholeMins > 0) {
    addSessionMinutes(key, wholeMins);
  }
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
