"use client";

import { useEffect, useState } from "react";

export function CurrentlyPlaying() {
  const [data, setData] = useState<unknown>(null);

  useEffect(() => {
    const load = () => fetch("/api/currently-playing").then((r) => r.json()).then(setData).catch(setData);
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <section>
      <h2 className="font-[family-name:var(--font-display)] text-[var(--accent-orange)]">Currently Playing</h2>
      <pre className="text-xs text-[var(--text-muted)]">{JSON.stringify(data, null, 2)}</pre>
    </section>
  );
}
