export type CompanionType = "ai-assistant" | "cat-companion" | "pet-companion" | "notifications";
export type CompanionAnimation = "idle" | "sleep" | "wave" | "look-cursor";

export type CompanionPosition = {
  x: number;
  y: number;
};

export type CompanionNotification = {
  id: string;
  title: string;
  body: string;
  createdAt: number;
};

export type CompanionState = {
  type: CompanionType;
  animation: CompanionAnimation;
  position: CompanionPosition;
  notifications: CompanionNotification[];
};

const STORAGE_KEY = "nutmag-companion";
const listeners = new Set<() => void>();

const DEFAULT_STATE: CompanionState = {
  type: "ai-assistant",
  animation: "idle",
  position: { x: 50, y: 50 },
  notifications: [
    {
      id: "welcome",
      title: "Companion online",
      body: "Your right-side companion area is ready.",
      createdAt: 0,
    },
  ],
};

let state: CompanionState | null = null;

function clamp(value: unknown, fallback: number, min: number, max: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, value));
}

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function sanitizeType(value: unknown): CompanionType {
  return value === "cat-companion" || value === "pet-companion" || value === "notifications" ? value : "ai-assistant";
}

function sanitizeAnimation(value: unknown): CompanionAnimation {
  return value === "sleep" || value === "wave" || value === "look-cursor" ? value : "idle";
}

function sanitizeNotifications(raw: unknown): CompanionNotification[] {
  if (!Array.isArray(raw)) return DEFAULT_STATE.notifications;
  const notifications: CompanionNotification[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const record = item as Record<string, unknown>;
    const title = typeof record.title === "string" && record.title.trim() ? record.title.trim() : null;
    const body = typeof record.body === "string" && record.body.trim() ? record.body.trim() : null;
    const createdAt = clamp(record.createdAt, Date.now(), 0, Number.MAX_SAFE_INTEGER);
    if (!title || !body) continue;
    notifications.push({
      id: typeof record.id === "string" && record.id.trim() ? record.id : createId("note"),
      title,
      body,
      createdAt,
    });
  }
  return notifications.slice(0, 12);
}

function sanitizeState(raw: unknown): CompanionState {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return DEFAULT_STATE;
  const item = raw as Record<string, unknown>;
  return {
    type: sanitizeType(item.type),
    animation: sanitizeAnimation(item.animation),
    position: {
      x: clamp(item.position && typeof item.position === "object" ? (item.position as Record<string, unknown>).x : undefined, DEFAULT_STATE.position.x, 8, 92),
      y: clamp(item.position && typeof item.position === "object" ? (item.position as Record<string, unknown>).y : undefined, DEFAULT_STATE.position.y, 8, 92),
    },
    notifications: sanitizeNotifications(item.notifications),
  };
}

function readStoredState(): CompanionState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    return sanitizeState(JSON.parse(raw));
  } catch {
    return DEFAULT_STATE;
  }
}

function persist(next: CompanionState) {
  state = next;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore storage failures
    }
  }
  listeners.forEach((listener) => listener());
}

function currentState() {
  if (state === null) {
    state = readStoredState();
  }
  return state;
}

function commit(patch: Partial<CompanionState>) {
  persist({
    ...currentState(),
    ...patch,
    position: {
      ...currentState().position,
      ...(patch.position ?? {}),
    },
    notifications: patch.notifications ?? currentState().notifications,
  });
}

export function getCompanionState(): CompanionState {
  return currentState();
}

export function getServerCompanionState(): CompanionState {
  return DEFAULT_STATE;
}

export function setCompanionType(type: CompanionType) {
  commit({ type });
}

export function setCompanionAnimation(animation: CompanionAnimation) {
  commit({ animation });
}

export function setCompanionPosition(position: CompanionPosition) {
  commit({
    position: {
      x: clamp(position.x, currentState().position.x, 8, 92),
      y: clamp(position.y, currentState().position.y, 8, 92),
    },
  });
}

export function pushCompanionNotification(title: string, body: string) {
  const next = [
    {
      id: createId("note"),
      title,
      body,
      createdAt: Date.now(),
    },
    ...currentState().notifications,
  ].slice(0, 8);
  commit({ notifications: next });
}

export function clearCompanionNotifications() {
  commit({ notifications: [] });
}

export function resetCompanion() {
  persist(DEFAULT_STATE);
}

export function subscribeCompanion(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
