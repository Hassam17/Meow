import { IdentityBlock } from "@/components/IdentityBlock";
import { NowPlaying } from "@/components/NowPlaying";
import { CurrentlyPlaying } from "@/components/CurrentlyPlaying";
import { HomelabStatus } from "@/components/HomelabStatus";
import { CurrentlyBuilding } from "@/components/CurrentlyBuilding";
import { StackChips } from "@/components/StackChips";

export default function Home() {
  return (
    <main className="flex flex-col flex-1 gap-8 p-8 max-w-4xl mx-auto w-full">
      <IdentityBlock />
      <NowPlaying />
      <CurrentlyPlaying />
      <HomelabStatus />
      <CurrentlyBuilding />
      <StackChips />
    </main>
  );
}
