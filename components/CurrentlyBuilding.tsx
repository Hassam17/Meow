import { currentlyBuilding } from "@/config/current";

export function CurrentlyBuilding() {
  return (
    <section>
      <h2 className="font-[family-name:var(--font-display)] text-[var(--accent-warm)]">Currently Building</h2>
      <p>{currentlyBuilding}</p>
    </section>
  );
}
