import type { ComponentType } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Dumbbell,
  Clock,
  Cpu,
  Database,
  Download,
  Gamepad2,
  GitCommitHorizontal,
  Goal,
  HardDrive,
  IdCard,
  Link2,
  Music,
  Network,
  Server,
  SlidersHorizontal,
  SquareTerminal,
  Trophy,
  Tv,
} from "lucide-react";
import { ClockWidget } from "@/components/ClockWidget";
import { QuickLinks } from "@/components/QuickLinks";
import { UptimeMilestones } from "@/components/UptimeMilestones";
import { HomelabStatus, HomelabStatusMore } from "@/components/HomelabStatus";
import { ServerStats, ServerStatsMore } from "@/components/ServerStats";
import { DiskStorage, DiskStorageMore } from "@/components/DiskStorage";
import { NetworkStats, NetworkStatsMore } from "@/components/NetworkStats";
import { Jellyfin, JellyfinMore } from "@/components/Jellyfin";
import { ArrStack, ArrStackMore } from "@/components/ArrStack";
import { StorageApps } from "@/components/StorageApps";
import { NutBotFaceWidget } from "@/components/widgets/NutBotFaceWidget";
import { NutBotTerminal } from "@/components/NutBotTerminal";
import { IdentityBlock } from "@/components/IdentityBlock";
import { NowPlaying } from "@/components/NowPlaying";
import { CurrentlyPlaying } from "@/components/CurrentlyPlaying";
import { GitHubActivity, GitHubActivityMore } from "@/components/GitHubActivity";
import { SessionTracker, SessionTrackerMore } from "@/components/SessionTracker";
import { HubSettings, HubSettingsMore } from "@/components/widgets/HubSettings";
import { FootballCheckin, FootballCheckinMore } from "@/components/FootballCheckin";
import { GymTracker, GymTrackerMore } from "@/components/GymTracker";

/* ─── widget framework contracts ─────────────────────────────────────
   A widget = a content component + a manifest entry here. The shell
   (components/framework/WidgetShell.tsx) supplies the card chrome, label,
   grid placement, and expansion behavior; per-instance overrides (size,
   orientation, expand mode, settings) come from the layout store.
──────────────────────────────────────────────────────────────────── */

export type WidgetSize = "S" | "M" | "L";
export type Orientation = "h" | "v";
/** "grow" bumps the widget one size tier on hover and cascades a shrink to
    whichever neighbor(s) it displaces — see lib/gridCascade.ts */
export type ExpandMode = "none" | "hover" | "overlay" | "grow";
export type ExpandDirection = "down" | "up";

export type SettingsField =
  | { key: string; label: string; type: "toggle"; default: boolean }
  | { key: string; label: string; type: "select"; default: string; options: { value: string; label: string }[] }
  | { key: string; label: string; type: "text"; default: string; placeholder?: string }
  | { key: string; label: string; type: "number"; default: number; min?: number; max?: number };

export type SettingsValues = Record<string, string | number | boolean>;

export type WidgetManifest = {
  id: string;
  /** rendered by the shell as the block label (and the overlay title) */
  title: string;
  icon: LucideIcon;
  /** card content only — no .block markup, no label, no fetch boilerplate */
  component: ComponentType;
  /** content of the hover flyout / overlay modal */
  expandedComponent?: ComponentType;
  /** sizes/orientations this widget formats correctly in */
  sizes: WidgetSize[];
  orientations: Orientation[];
  /** expansion capabilities; ["none"] when there is no expanded content */
  expandModes: ExpandMode[];
  defaults: { size: WidgetSize; orientation: Orientation; expand: ExpandMode; hidden?: boolean };
  /** widget-specific options — drives the auto-generated settings form */
  settings?: SettingsField[];
  flags?: {
    /** no card chrome at all (identity namecard renders its own) */
    plainChrome?: boolean;
    /** card chrome but the content renders its own header */
    customHeader?: boolean;
    /** orange accent-left border */
    accent?: boolean;
    /** extra class on the .block element */
    className?: string;
  };
};

/** manifest settings schema → default values, overlaid with stored values
    (wrong types / unknown select options fall back to the field default) */
export function resolveSettings(manifest: WidgetManifest, stored?: SettingsValues): SettingsValues {
  const values: SettingsValues = {};
  for (const field of manifest.settings ?? []) {
    const saved = stored?.[field.key];
    const valid =
      typeof saved === typeof field.default &&
      (field.type !== "select" || field.options.some((o) => o.value === saved));
    values[field.key] = valid ? (saved as string | number | boolean) : field.default;
  }
  return values;
}

/* ─── grid placement ─────────────────────────────────────────────
   size × orientation → [column span, row span] on the dashboard grid
   (6 tracks at full width; spans are clamped at narrower breakpoints —
   see useGridColumns + .widget-grid in globals.css) */
export const SPAN_MAP: Record<`${WidgetSize}-${Orientation}`, [cols: number, rows: number]> = {
  "S-h": [1, 1],
  "S-v": [1, 2],
  "M-h": [2, 1],
  "M-v": [2, 2],
  "L-h": [3, 2],
  "L-v": [2, 3],
};

const SIZE_LADDER: WidgetSize[] = ["S", "M", "L"];

/** one size tier up; "L" is the ceiling and maps to itself */
export function nextSize(size: WidgetSize): WidgetSize {
  return SIZE_LADDER[Math.min(SIZE_LADDER.indexOf(size) + 1, SIZE_LADDER.length - 1)];
}

/** one size tier down; "S" is the floor and maps to itself */
export function prevSize(size: WidgetSize): WidgetSize {
  return SIZE_LADDER[Math.max(SIZE_LADDER.indexOf(size) - 1, 0)];
}

export const WIDGETS = {
  clock: {
    id: "clock",
    title: "clock & date",
    icon: Clock,
    component: ClockWidget,
    sizes: ["S", "M"],
    orientations: ["h", "v"],
    expandModes: ["none"],
    defaults: { size: "S", orientation: "v", expand: "none" },
    settings: [
      { key: "showCalendar", label: "mini calendar", type: "toggle", default: true },
      { key: "showLofi", label: "lofi radio", type: "toggle", default: true },
    ],
  },
  quicklinks: {
    id: "quicklinks",
    title: "quicklinks",
    icon: Link2,
    component: QuickLinks,
    sizes: ["S", "M"],
    orientations: ["h", "v"],
    expandModes: ["none"],
    defaults: { size: "S", orientation: "h", expand: "none" },
    flags: { className: "quicklinks-compact" },
  },
  milestones: {
    id: "milestones",
    title: "uptime milestones",
    icon: Trophy,
    component: UptimeMilestones,
    sizes: ["S", "M"],
    orientations: ["v"],
    expandModes: ["none"],
    defaults: { size: "S", orientation: "v", expand: "none" },
  },
  homelab: {
    id: "homelab",
    title: "a very nutty home server",
    icon: Server,
    component: HomelabStatus,
    expandedComponent: HomelabStatusMore,
    sizes: ["S", "M"],
    orientations: ["h", "v"],
    expandModes: ["none", "hover", "overlay"],
    defaults: { size: "S", orientation: "h", expand: "hover" },
    settings: [
      {
        key: "pollSeconds",
        label: "refresh every",
        type: "select",
        default: "60",
        options: [
          { value: "30", label: "30s" },
          { value: "60", label: "60s" },
          { value: "120", label: "2m" },
        ],
      },
    ],
  },
  "server-stats": {
    id: "server-stats",
    title: "server stats",
    icon: Cpu,
    component: ServerStats,
    expandedComponent: ServerStatsMore,
    sizes: ["S", "M"],
    orientations: ["h", "v"],
    expandModes: ["none", "hover", "overlay"],
    defaults: { size: "S", orientation: "h", expand: "hover" },
  },
  "disk-storage": {
    id: "disk-storage",
    title: "disk storage",
    icon: HardDrive,
    component: DiskStorage,
    expandedComponent: DiskStorageMore,
    sizes: ["S", "M"],
    orientations: ["h", "v"],
    expandModes: ["none", "hover", "overlay"],
    defaults: { size: "S", orientation: "h", expand: "hover" },
  },
  "network-stats": {
    id: "network-stats",
    title: "network stats",
    icon: Network,
    component: NetworkStats,
    expandedComponent: NetworkStatsMore,
    sizes: ["S", "M"],
    orientations: ["h", "v"],
    expandModes: ["none", "hover", "overlay"],
    defaults: { size: "S", orientation: "h", expand: "hover" },
  },
  jellyfin: {
    id: "jellyfin",
    title: "jellyfin",
    icon: Tv,
    component: Jellyfin,
    expandedComponent: JellyfinMore,
    sizes: ["S", "M"],
    orientations: ["h", "v"],
    expandModes: ["none", "hover", "overlay"],
    defaults: { size: "S", orientation: "h", expand: "hover" },
    flags: { accent: true },
  },
  "arr-stack": {
    id: "arr-stack",
    title: "arr stack",
    icon: Download,
    component: ArrStack,
    expandedComponent: ArrStackMore,
    sizes: ["S", "M"],
    orientations: ["h", "v"],
    expandModes: ["none", "hover", "overlay"],
    defaults: { size: "S", orientation: "h", expand: "hover" },
  },
  "storage-apps": {
    id: "storage-apps",
    title: "storage apps",
    icon: Database,
    component: StorageApps,
    sizes: ["S", "M"],
    orientations: ["h", "v"],
    expandModes: ["none"],
    defaults: { size: "S", orientation: "h", expand: "none" },
  },
  nutbot: {
    id: "nutbot",
    title: "nutbot v1.4",
    icon: SquareTerminal,
    component: NutBotFaceWidget,
    expandedComponent: NutBotTerminal,
    sizes: ["S", "M"],
    orientations: ["h", "v"],
    expandModes: ["none", "overlay"],
    defaults: { size: "S", orientation: "h", expand: "overlay" },
  },
  identity: {
    id: "identity",
    title: "identity",
    icon: IdCard,
    component: IdentityBlock,
    sizes: ["M", "L"],
    orientations: ["h"],
    expandModes: ["none"],
    defaults: { size: "M", orientation: "h", expand: "none" },
    flags: { plainChrome: true },
  },
  "now-playing": {
    id: "now-playing",
    title: "now playing",
    icon: Music,
    component: NowPlaying,
    sizes: ["S", "M", "L"],
    orientations: ["h"],
    expandModes: ["none", "grow"],
    defaults: { size: "M", orientation: "h", expand: "grow" },
    flags: { customHeader: true, className: "spotify-capsule" },
  },
  "currently-playing": {
    id: "currently-playing",
    title: "currently playing",
    icon: Gamepad2,
    component: CurrentlyPlaying,
    sizes: ["S", "M", "L"],
    orientations: ["h", "v"],
    expandModes: ["none", "grow"],
    defaults: { size: "M", orientation: "v", expand: "grow" },
    flags: { customHeader: true, className: "steam-card" },
  },
  github: {
    id: "github",
    title: "github activity",
    icon: GitCommitHorizontal,
    component: GitHubActivity,
    expandedComponent: GitHubActivityMore,
    sizes: ["S", "M", "L"],
    orientations: ["h"],
    expandModes: ["none", "hover", "overlay"],
    defaults: { size: "M", orientation: "h", expand: "hover" },
    settings: [{ key: "flyoutCommits", label: "commits shown", type: "number", default: 5, min: 1, max: 15 }],
    flags: { customHeader: true, accent: true },
  },
  "hub-settings": {
    id: "hub-settings",
    title: "avn hub settings",
    icon: SlidersHorizontal,
    component: HubSettings,
    expandedComponent: HubSettingsMore,
    sizes: ["S", "M"],
    orientations: ["h", "v"],
    expandModes: ["overlay"],
    defaults: { size: "S", orientation: "h", expand: "overlay" },
  },
  tracker: {
    id: "tracker",
    title: "session tracker",
    icon: Gamepad2,
    component: SessionTracker,
    expandedComponent: SessionTrackerMore,
    sizes: ["S", "M"],
    orientations: ["h", "v"],
    expandModes: ["none", "hover", "overlay"],
    defaults: { size: "S", orientation: "v", expand: "hover" },
  },
  football: {
    id: "football",
    title: "football check-in",
    icon: Goal,
    component: FootballCheckin,
    expandedComponent: FootballCheckinMore,
    sizes: ["S", "M"],
    orientations: ["h", "v"],
    expandModes: ["none", "hover", "overlay"],
    defaults: { size: "S", orientation: "v", expand: "hover" },
    flags: { accent: true },
  },
  gym: {
    id: "gym",
    title: "gym tracker",
    icon: Dumbbell,
    component: GymTracker,
    expandedComponent: GymTrackerMore,
    sizes: ["S", "M"],
    orientations: ["h", "v"],
    expandModes: ["none", "hover", "overlay"],
    defaults: { size: "S", orientation: "v", expand: "hover" },
  },
} satisfies Record<string, WidgetManifest>;

export type WidgetId = keyof typeof WIDGETS;

/** default grid order — instances flow into the grid in this sequence
    (dense auto-placement back-fills gaps) */
export const DEFAULT_ORDER: WidgetId[] = [
  "identity",
  "clock",
  "nutbot",
  "now-playing",
  "currently-playing",
  "github",
  "server-stats",
  "disk-storage",
  "network-stats",
  "arr-stack",
  "storage-apps",
  "quicklinks",
  "milestones",
  "football",
  "gym",
  "tracker",
  "hub-settings",
];
