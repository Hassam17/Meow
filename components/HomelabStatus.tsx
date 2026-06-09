"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { HomelabStatus as HomelabStatusData } from "@/lib/homelab";

export function HomelabStatus() {
  const [data, setData] = useState<HomelabStatusData | null>(null);

  useEffect(() => {
    const load = () =>
      fetch("/api/homelab")
        .then((r) => r.json())
        .then(setData)
        .catch(() => {});
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, []);

  const upCount = data?.services.filter((s) => s.status === "up").length ?? 0;
  const total = data?.services.length ?? 0;

  return (
    <section id="homelab" className="panel space-y-3">
      <div className="flex items-center justify-between">
        <p className="label">▣ homelab</p>
        {data && (
          <span
            className="text-[10px] font-[family-name:var(--font-display)] tracking-widest"
            style={{ color: upCount === total ? "var(--accent-cyan)" : "var(--accent-orange)" }}
          >
            {upCount}/{total} up
          </span>
        )}
      </div>

      {!data ? (
        <p className="text-[var(--text-muted)] text-xs">checking...</p>
      ) : (
        <ul className="space-y-1.5">
          {data.services.map((s, i) => (
            <motion.li
              key={s.name}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-2"
            >
              <span
                className="inline-block h-1.5 w-1.5 rounded-full shrink-0"
                style={{
                  background: s.status === "up" ? "var(--accent-cyan)" : "#ff4444",
                  boxShadow: s.status === "up"
                    ? "0 0 4px 1px var(--accent-cyan)"
                    : "0 0 4px 1px #ff4444",
                }}
              />
              <span className="text-[var(--text-primary)] text-xs font-[family-name:var(--font-display)] tracking-widest min-w-[5rem]">
                {s.name}
              </span>
              <span className="text-[var(--text-muted)] text-[10px]">{s.uptime}</span>
            </motion.li>
          ))}
        </ul>
      )}
    </section>
  );
}
