export type FootballEvent = {
  id: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  title: string;
  location: string;
  notes: string;
  played: boolean;
};

export type GymDayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type GymPlanDay = {
  key: GymDayKey;
  label: string;
  focus: string;
  exercises: string[];
};

export type LifestyleState = {
  football: FootballEvent[];
  gymCheckins: Record<string, GymDayKey>;
};

const STORAGE_KEY = "nutmag-lifestyle";
const listeners = new Set<() => void>();

export const GYM_PLAN: GymPlanDay[] = [
  { key: "mon", label: "Mon", focus: "chest + triceps", exercises: ["bench press", "incline dumbbell press", "tricep pushdowns"] },
  { key: "tue", label: "Tue", focus: "back + biceps", exercises: ["lat pulldowns", "barbell rows", "dumbbell curls"] },
  { key: "wed", label: "Wed", focus: "legs + abs", exercises: ["squats", "romanian deadlifts", "hanging leg raises"] },
  { key: "thu", label: "Thu", focus: "shoulders + core", exercises: ["overhead press", "lateral raises", "planks"] },
  { key: "fri", label: "Fri", focus: "football + conditioning", exercises: ["sprints", "ball work", "mobility cooldown"] },
  { key: "sat", label: "Sat", focus: "arms + upper accessories", exercises: ["close-grip press", "hammer curls", "face pulls"] },
  { key: "sun", label: "Sun", focus: "recovery", exercises: ["walk", "stretch", "foam roll"] },
];

const DEFAULT_STATE: LifestyleState = {
  football: [
    {
      id: "football-1",
      date: isoDate(offsetDate(2)),
      startTime: "19:00",
      durationMinutes: 90,
      title: "5-a-side check-in",
      location: "local turf",
      notes: "boots, water, shin guards",
      played: false,
    },
    {
      id: "football-2",
      date: isoDate(offsetDate(5)),
      startTime: "18:30",
      durationMinutes: 120,
      title: "weekend football",
      location: "main ground",
      notes: "arrive 20 min early",
      played: false,
    },
  ],
  gymCheckins: {},
};

let state: LifestyleState | null = null;

function emit() {
  listeners.forEach((listener) => listener());
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage blocked/full — keep in-memory state for this session
  }
}

function sanitize(raw: unknown): LifestyleState {
  const stored = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const football = Array.isArray(stored.football)
    ? stored.football
        .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
        .map((item, index) => ({
          id: typeof item.id === "string" ? item.id : `football-${index}`,
          date: typeof item.date === "string" ? item.date : isoDate(new Date()),
          startTime: typeof item.startTime === "string" ? item.startTime : "19:00",
          durationMinutes: typeof item.durationMinutes === "number" ? item.durationMinutes : 90,
          title: typeof item.title === "string" ? item.title : "football session",
          location: typeof item.location === "string" ? item.location : "tbd",
          notes: typeof item.notes === "string" ? item.notes : "",
          played: item.played === true || item.checkedIn === true,
        }))
    : DEFAULT_STATE.football;
  const gymCheckins =
    stored.gymCheckins && typeof stored.gymCheckins === "object"
      ? Object.fromEntries(
          Object.entries(stored.gymCheckins as Record<string, unknown>).filter(
            (entry): entry is [string, GymDayKey] => typeof entry[0] === "string" && typeof entry[1] === "string",
          ),
        )
      : {};

  return { football, gymCheckins };
}

export function getLifestyle(): LifestyleState {
  if (state === null) {
    state = DEFAULT_STATE;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) state = sanitize(JSON.parse(raw));
    } catch {
      // corrupt saved data — fall back to defaults
    }
  }
  return state;
}

export function getServerLifestyle(): LifestyleState {
  return DEFAULT_STATE;
}

export function subscribeLifestyle(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function commit(next: LifestyleState) {
  state = next;
  persist();
  emit();
}

export function addFootballEvent(event: Omit<FootballEvent, "id" | "played">) {
  const current = getLifestyle();
  const nextEvent: FootballEvent = {
    id: `football-${Date.now()}`,
    played: false,
    ...event,
  };
  commit({
    ...current,
    football: [...current.football, nextEvent].sort((a, b) =>
      `${a.date}-${a.startTime}`.localeCompare(`${b.date}-${b.startTime}`),
    ),
  });
}

export function toggleFootballPlayed(id: string) {
  const current = getLifestyle();
  commit({
    ...current,
    football: current.football.map((event) => (event.id === id ? { ...event, played: !event.played } : event)),
  });
}

export function removeFootballEvent(id: string) {
  const current = getLifestyle();
  commit({
    ...current,
    football: current.football.filter((event) => event.id !== id),
  });
}

export function toggleGymCheckin(date: string, dayKey: GymDayKey) {
  const current = getLifestyle();
  const nextCheckins = { ...current.gymCheckins };
  if (nextCheckins[date] === dayKey) {
    delete nextCheckins[date];
  } else {
    nextCheckins[date] = dayKey;
  }
  commit({
    ...current,
    gymCheckins: nextCheckins,
  });
}

export function weekdayKey(date: Date): GymDayKey {
  return GYM_PLAN[(date.getDay() + 6) % 7].key;
}

export function isoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function offsetDate(offset: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date;
}
