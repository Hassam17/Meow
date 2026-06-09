export function IdentityBlock() {
  return (
    <section>
      <h1 className="font-[family-name:var(--font-display)] text-2xl text-[var(--accent-orange)]">
        NutMag2469
      </h1>
      <p className="text-[var(--text-muted)]">building things at 2am</p>
      <div className="mt-2 flex gap-4 text-sm">
        <a
          href="https://github.com/NutMag2469"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--accent-cyan)] hover:underline"
        >
          github
        </a>
        <a
          href="#homelab"
          className="text-[var(--accent-cyan)] hover:underline"
        >
          homelab
        </a>
      </div>
    </section>
  );
}
