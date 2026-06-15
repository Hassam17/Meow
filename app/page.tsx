import { GlyphStrip } from "@/components/GlyphStrip";
import { BootSequence } from "@/components/BootSequence";
import { BottomCompanion } from "@/components/BottomCompanion";
import { LayoutProvider } from "@/components/LayoutProvider";
import { Dashboard } from "@/components/Dashboard";

export default function Home() {
  return (
    <main className="relative min-h-screen w-full">
      <BootSequence />
      <GlyphStrip />

      {/* columns + widget arrangement render from layout state — defaults in
          config/widgets.tsx, user overrides in localStorage["nutmag-layout"] */}
      <LayoutProvider>
        <Dashboard />
        <BottomCompanion />
      </LayoutProvider>
    </main>
  );
}
