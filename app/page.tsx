import { IdentityBlock } from "@/components/IdentityBlock";
import { QuickLinks } from "@/components/QuickLinks";
import { NowPlaying } from "@/components/NowPlaying";
import { CurrentlyPlaying } from "@/components/CurrentlyPlaying";
import { GitHubActivity } from "@/components/GitHubActivity";
import { HomelabStatus } from "@/components/HomelabStatus";
import { ServerStats } from "@/components/ServerStats";
import { DiskStorage } from "@/components/DiskStorage";
import { NetworkStats } from "@/components/NetworkStats";
import { Jellyfin } from "@/components/Jellyfin";
import { ArrStack } from "@/components/ArrStack";
import { StorageApps } from "@/components/StorageApps";
import { NutBot } from "@/components/NutBot";
import { GlyphStrip } from "@/components/GlyphStrip";
import { BootSequence } from "@/components/BootSequence";
import { ClockWidget } from "@/components/ClockWidget";
import { UptimeMilestones } from "@/components/UptimeMilestones";
import { SessionTracker } from "@/components/SessionTracker";

export default function Home() {
  return (
    <main className="relative min-h-screen w-full">
      <BootSequence />
      <GlyphStrip />

      <div className="mx-auto max-w-[1480px] px-5 py-6">
        <div className="frame">
          <div className="frame-inner flex flex-col-reverse gap-5 lg:flex-row">
            <div className="frame-col flex w-full flex-col gap-2.5 lg:w-[280px] lg:shrink-0">
              <ClockWidget />
              <QuickLinks />
              <UptimeMilestones />
            </div>

            <div className="frame-col flex w-full flex-col gap-2.5 lg:w-[300px] lg:shrink-0">
              <HomelabStatus />
              <ServerStats />

              <div className="pair">
                <DiskStorage />
                <NetworkStats />
              </div>

              <Jellyfin />
              <ArrStack />
              <StorageApps />
            </div>

            <div className="frame-col flex min-w-0 flex-1 flex-col gap-2.5">
              <NutBot />

              <IdentityBlock />

              <div className="pair">
                <NowPlaying />
                <CurrentlyPlaying />
              </div>

              <GitHubActivity />
            </div>

            <div className="frame-col tracker-col flex w-full flex-col gap-2.5">
              <SessionTracker />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
