"use client";

import { useEffect, useState } from "react";
import { Server } from "lucide-react";
import { averageUptime, type HomelabStatus as HomelabStatusData } from "@/lib/homelab";

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

  return (
    <div id="homelab" className="block">
      <div className="block-label">
        <Server size={14} strokeWidth={1.75} />
        a very nutty home server
      </div>

      <div className="block-stat">{data ? (averageUptime(data.services) ?? "—") : "—"}</div>

      {data && (
        <div className="svc-row">
          {data.services.map((s) => (
            <div className="svc" key={s.name}>
              <span className={`svc-dot${s.status === "down" ? " down" : ""}`} />
              {s.name}
            </div>
          ))}
        </div>
      )}

      {data && data.services.length > 0 && (
        <div className="more-panel">
          <div className="more-head">services</div>
          {data.services.map((s) => (
            <div className="more-row" key={s.name}>
              <span>{s.name}</span>
              <span className="more-meta">{s.uptime}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
