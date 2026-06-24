import { GlyphStrip } from "@/components/GlyphStrip";
import { BootSequence } from "@/components/BootSequence";
import { LayoutProvider } from "@/components/LayoutProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Dashboard } from "@/components/Dashboard";

export default function Home() {
  return (
    <main className="relative min-h-screen w-full">
      <BootSequence />
      <GlyphStrip />

      {/* columns + widget arrangement render from layout state — defaults in
          config/widgets.tsx, user overrides in localStorage["nutmag-layout"] */}
      <ThemeProvider>
        <LayoutProvider>
          <Dashboard />
        </LayoutProvider>
      </ThemeProvider>
    </main>
  );
}
