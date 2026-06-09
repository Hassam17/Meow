import { IdentityBlock } from "@/components/IdentityBlock";
import { NowPlaying } from "@/components/NowPlaying";
import { CurrentlyPlaying } from "@/components/CurrentlyPlaying";
import { HomelabStatus } from "@/components/HomelabStatus";
import { CurrentlyBuilding } from "@/components/CurrentlyBuilding";
import { StackChips } from "@/components/StackChips";
import { GlyphStrip } from "@/components/GlyphStrip";
import { BootSequence } from "@/components/BootSequence";

export default function Home() {
  return (
    <main
      className="relative min-h-screen w-full"
      style={{ background: "var(--background)" }}
    >
      {/* Boot animation — fixed overlay, self-dismisses */}
      <BootSequence />

      {/* Left-edge glyph status strip */}
      <GlyphStrip />

      {/* HUD content — offset from glyph strip */}
      <div className="ml-4 max-w-5xl px-6 py-10 space-y-6">

        {/* Row 1 — Identity (wide) + Homelab (right column) */}
        <div className="grid grid-cols-12 gap-x-6 gap-y-6 items-start">
          <div className="col-span-8">
            <IdentityBlock />
          </div>
          <div className="col-span-4">
            <HomelabStatus />
          </div>
        </div>

        {/* Row 2 — Now Playing (slightly inset) + Currently Playing */}
        {/* The col-start-2 and gap leaves intentional dead-air between panels */}
        <div className="grid grid-cols-12 gap-x-6 gap-y-6 items-start">
          <div className="col-start-1 col-span-5">
            <NowPlaying />
          </div>
          <div className="col-start-7 col-span-6">
            <CurrentlyPlaying />
          </div>
        </div>

        {/* Row 3 — Currently Building (cream callout) + Stack Chips (offset right) */}
        <div className="grid grid-cols-12 gap-x-6 gap-y-6 items-start">
          <div className="col-span-7">
            <CurrentlyBuilding />
          </div>
          <div className="col-start-9 col-span-4 flex items-end pb-1">
            <StackChips />
          </div>
        </div>

      </div>
    </main>
  );
}
