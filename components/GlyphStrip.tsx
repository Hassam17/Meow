"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { HomelabStatus } from "@/lib/homelab";

export function GlyphStrip() {
  const [data, setData] = useState<HomelabStatus | null>(null);

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

  const allUp = data ? data.services.every((s) => s.status === "up") : true;
  const anyDown = data ? data.services.some((s) => s.status === "down") : false;
  const color = anyDown ? "var(--accent-orange)" : "var(--accent-cyan)";

  return (
    <div
      className="absolute left-0 top-0 bottom-0 w-[3px]"
      aria-hidden
    >
      <motion.div
        className="absolute inset-0"
        animate={
          anyDown
            ? { opacity: [1, 0.3, 1, 0.6, 1, 0.2, 1] }
            : { opacity: [0.6, 1, 0.6] }
        }
        transition={{
          duration: anyDown ? 1.2 : 2.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{ background: color }}
      />
    </div>
  );
}
