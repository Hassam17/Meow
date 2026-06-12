import type { ComponentType } from "react";
import { ClockWidget } from "@/components/ClockWidget";
import { QuickLinks } from "@/components/QuickLinks";
import { UptimeMilestones } from "@/components/UptimeMilestones";
import { HomelabStatus } from "@/components/HomelabStatus";
import { ServerStats } from "@/components/ServerStats";
import { DiskStorage } from "@/components/DiskStorage";
import { NetworkStats } from "@/components/NetworkStats";
import { Jellyfin } from "@/components/Jellyfin";
import { ArrStack } from "@/components/ArrStack";
import { StorageApps } from "@/components/StorageApps";
import { NutBot } from "@/components/NutBot";
import { IdentityBlock } from "@/components/IdentityBlock";
import { NowPlaying } from "@/components/NowPlaying";
import { CurrentlyPlaying } from "@/components/CurrentlyPlaying";
import { GitHubActivity } from "@/components/GitHubActivity";
import { SessionTracker } from "@/components/SessionTracker";

/* paired capsules move as one unit — the hover-to-expand interaction
   only makes sense with both siblings present */
function MediaPair() {
  return (
    <div className="pair pair-media">
      <NowPlaying />
      <CurrentlyPlaying />
    </div>
  );
}

function DiskNetworkPair() {
  return (
    <div className="pair">
      <DiskStorage />
      <NetworkStats />
    </div>
  );
}

export type WidgetDef = {
  component: ComponentType;
  /** narrowest column (px) this widget still formats correctly in;
      undefined = fits anywhere */
  minColWidth?: number;
};

export const WIDGETS = {
  clock: { component: ClockWidget },
  quicklinks: { component: QuickLinks },
  milestones: { component: UptimeMilestones },
  homelab: { component: HomelabStatus },
  "server-stats": { component: ServerStats },
  "disk-network": { component: DiskNetworkPair },
  jellyfin: { component: Jellyfin },
  "arr-stack": { component: ArrStack },
  "storage-apps": { component: StorageApps },
  nutbot: { component: NutBot, minColWidth: 340 },
  identity: { component: IdentityBlock, minColWidth: 340 },
  media: { component: MediaPair, minColWidth: 340 },
  github: { component: GitHubActivity },
  tracker: { component: SessionTracker },
} satisfies Record<string, WidgetDef>;

export type WidgetId = keyof typeof WIDGETS;

export type ColumnDef = {
  id: string;
  /** width-controlling classes appended to the shared frame-col classes */
  className: string;
  /** px width used for minColWidth checks; null = flexible (always wide enough) */
  width: number | null;
};

export const COLUMNS: ColumnDef[] = [
  { id: "left", className: "lg:w-[280px] lg:shrink-0", width: 280 },
  { id: "services", className: "lg:w-[300px] lg:shrink-0", width: 300 },
  { id: "center", className: "min-w-0 flex-1", width: null },
  { id: "tracker", className: "tracker-col", width: 290 },
];

/** column id → ordered widget ids */
export type LayoutState = Record<string, WidgetId[]>;

export const DEFAULT_LAYOUT: LayoutState = {
  left: ["clock", "quicklinks", "milestones"],
  services: ["homelab", "server-stats", "disk-network", "jellyfin", "arr-stack", "storage-apps"],
  center: ["nutbot", "identity", "media", "github"],
  tracker: ["tracker"],
};
