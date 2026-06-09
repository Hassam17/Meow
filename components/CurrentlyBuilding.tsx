import { currentlyBuilding } from "@/config/current";

export function CurrentlyBuilding() {
  return (
    <section className="panel-warm space-y-2">
      <p className="label" style={{ color: "var(--accent-warm)", opacity: 0.7 }}>
        ⌗ currently building
      </p>
      <p
        className="font-[family-name:var(--font-display)] text-sm tracking-wide leading-relaxed"
        style={{ color: "var(--accent-warm)" }}
      >
        {currentlyBuilding}
      </p>
    </section>
  );
}
