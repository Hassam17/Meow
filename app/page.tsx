import { IdentityBlock } from "@/components/IdentityBlock";
import { NowPlaying } from "@/components/NowPlaying";
import { CurrentlyPlaying } from "@/components/CurrentlyPlaying";
import { HomelabStatus } from "@/components/HomelabStatus";
import { GitHubActivity } from "@/components/GitHubActivity";
import { GlyphStrip } from "@/components/GlyphStrip";
import { BootSequence } from "@/components/BootSequence";

export default function Home() {
  return (
    <main className="relative min-h-screen w-full">
      <BootSequence />
      <GlyphStrip />

      <div className="mx-auto flex max-w-2xl flex-col gap-2.5 px-4 py-8">
        <IdentityBlock />

        <div className="pair">
          <NowPlaying />
          <CurrentlyPlaying />
        </div>

        <GitHubActivity />

        <HomelabStatus />
      </div>
    </main>
  );
}
