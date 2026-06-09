"use client";

import { useEffect, useState } from "react";
import type { HomelabStatus as HomelabStatusData } from "@/lib/homelab";

export function HomelabStatus() {
  const [data, setData] = useState<HomelabStatusData | null>(null);

  useEffect(() => {
    const load = () =>
      fetch("/api/homelab")
        .then((r) => r.json())
        .then(setData)
        .catch(() => setData(null));
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <section>
      <h2 className="font-[family-name:var(--font-display)] text-[var(--accent-cyan)]">Homelab</h2>
      {!data && <p className="text-[var(--text-muted)]">status unavailable</p>}
      {data && (
        <ul className="flex flex-wrap gap-3">
          {data.services.map((s) => (
            <li key={s.name} className="flex items-center gap-1.5 text-sm">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: s.status === "up" ? "var(--accent-cyan)" : "#ff4444" }}
              />
              <span className="text-[var(--text-primary)]">{s.name}</span>
              <span className="text-[var(--text-muted)]">{s.uptime}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
