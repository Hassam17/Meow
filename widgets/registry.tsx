"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import {
  Clock,
  Gamepad2,
  Github,
  Grid2x2,
  Link2,
  Music,
  Server,
  Sparkles,
  Trophy,
  Cpu,
  HardDrive,
  Network,
  Database,
  SquareTerminal,
  IdCard,
  Download,
  SlidersHorizontal,
  Dumbbell,
  Goal,
} from "lucide-react";

export type WidgetSizePreset = "small" | "medium" | "large" | "wide";

export type WidgetRegistryEntry = {
  id: string;
  title: string;
  size: WidgetSizePreset;
  enabled: boolean;
  component: ComponentType;
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
};

const placeholder = () => <div className="widget-placeholder" />;

const ClockWidget = dynamic(() => import("@/components/ClockWidget").then((m) => m.ClockWidget), { ssr: false, loading: placeholder });
const GithubWidget = dynamic(() => import("@/components/GitHubActivity").then((m) => m.GitHubActivity), {
  ssr: false,
  loading: placeholder,
});
const MusicWidget = dynamic(() => import("@/components/NowPlaying").then((m) => m.NowPlaying), { ssr: false, loading: placeholder });
const FootballWidget = dynamic(() => import("@/components/FootballCheckin").then((m) => m.FootballCheckin), {
  ssr: false,
  loading: placeholder,
});
const GymWidget = dynamic(() => import("@/components/GymTracker").then((m) => m.GymTracker), { ssr: false, loading: placeholder });
const SessionWidget = dynamic(() => import("@/components/SessionTracker").then((m) => m.SessionTracker), {
  ssr: false,
  loading: placeholder,
});
const QuickLinksWidget = dynamic(() => import("@/components/QuickLinks").then((m) => m.QuickLinks), {
  ssr: false,
  loading: placeholder,
});
const ServerStatsWidget = dynamic(() => import("@/components/ServerStats").then((m) => m.ServerStats), {
  ssr: false,
  loading: placeholder,
});
const HomelabWidget = dynamic(() => import("@/components/HomelabStatus").then((m) => m.HomelabStatus), {
  ssr: false,
  loading: placeholder,
});
const DiskStorageWidget = dynamic(() => import("@/components/DiskStorage").then((m) => m.DiskStorage), {
  ssr: false,
  loading: placeholder,
});
const NetworkStatsWidget = dynamic(() => import("@/components/NetworkStats").then((m) => m.NetworkStats), {
  ssr: false,
  loading: placeholder,
});
const StorageAppsWidget = dynamic(() => import("@/components/StorageApps").then((m) => m.StorageApps), {
  ssr: false,
  loading: placeholder,
});
const JellyfinWidget = dynamic(() => import("@/components/Jellyfin").then((m) => m.Jellyfin), { ssr: false, loading: placeholder });
const ArrStackWidget = dynamic(() => import("@/components/ArrStack").then((m) => m.ArrStack), { ssr: false, loading: placeholder });
const NutBotWidget = dynamic(() => import("@/components/widgets/NutBotFaceWidget").then((m) => m.NutBotFaceWidget), {
  ssr: false,
  loading: placeholder,
});
const IdentityWidget = dynamic(() => import("@/components/IdentityBlock").then((m) => m.IdentityBlock), {
  ssr: false,
  loading: placeholder,
});
const CurrentlyPlayingWidget = dynamic(() => import("@/components/CurrentlyPlaying").then((m) => m.CurrentlyPlaying), {
  ssr: false,
  loading: placeholder,
});
const HubSettingsWidget = dynamic(() => import("@/components/widgets/HubSettings").then((m) => m.HubSettings), {
  ssr: false,
  loading: placeholder,
});
const MilestonesWidget = dynamic(() => import("@/components/UptimeMilestones").then((m) => m.UptimeMilestones), {
  ssr: false,
  loading: placeholder,
});

export const widgetRegistry: WidgetRegistryEntry[] = [
  { id: "identity", title: "Profile", size: "wide", enabled: true, component: IdentityWidget, icon: IdCard },
  { id: "clock", title: "Clock", size: "medium", enabled: true, component: ClockWidget, icon: Clock },
  { id: "quicklinks", title: "Quick Links", size: "medium", enabled: true, component: QuickLinksWidget, icon: Link2 },
  { id: "milestones", title: "Uptime", size: "small", enabled: true, component: MilestonesWidget, icon: Trophy },
  { id: "homelab", title: "Homelab", size: "medium", enabled: true, component: HomelabWidget, icon: Server },
  { id: "server-stats", title: "Server Stats", size: "medium", enabled: true, component: ServerStatsWidget, icon: Cpu },
  { id: "disk-storage", title: "Storage", size: "medium", enabled: true, component: DiskStorageWidget, icon: HardDrive },
  { id: "network-stats", title: "Network", size: "medium", enabled: true, component: NetworkStatsWidget, icon: Network },
  { id: "jellyfin", title: "Jellyfin", size: "medium", enabled: true, component: JellyfinWidget, icon: Grid2x2 },
  { id: "arr-stack", title: "ARR Stack", size: "medium", enabled: true, component: ArrStackWidget, icon: Download },
  { id: "storage-apps", title: "Storage Apps", size: "medium", enabled: true, component: StorageAppsWidget, icon: Database },
  { id: "nutbot", title: "NutBot", size: "small", enabled: true, component: NutBotWidget, icon: SquareTerminal },
  { id: "now-playing", title: "Now Playing", size: "wide", enabled: true, component: MusicWidget, icon: Music },
  { id: "currently-playing", title: "Last Played", size: "wide", enabled: true, component: CurrentlyPlayingWidget, icon: Gamepad2 },
  { id: "github", title: "GitHub", size: "wide", enabled: true, component: GithubWidget, icon: Github },
  { id: "hub-settings", title: "Hub Settings", size: "medium", enabled: true, component: HubSettingsWidget, icon: SlidersHorizontal },
  { id: "tracker", title: "Session Tracker", size: "medium", enabled: true, component: SessionWidget, icon: Sparkles },
  { id: "football", title: "Football", size: "medium", enabled: true, component: FootballWidget, icon: Goal },
  { id: "gym", title: "Gym", size: "medium", enabled: true, component: GymWidget, icon: Dumbbell },
];

export function registryById() {
  return Object.fromEntries(widgetRegistry.map((entry) => [entry.id, entry])) as Record<string, WidgetRegistryEntry>;
}
