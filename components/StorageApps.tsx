"use client";

import { useEffect, useState } from "react";
import { Database } from "lucide-react";
import { formatBytes, type HomelabStatusV2 } from "@/lib/homelab";

const STORAGE_IDS = ["immich", "nextcloud"];

export function StorageApps() {
  const [data, setData] = useState<HomelabStatusV2 | null>(null);

  useEffect(() => {
    const load = () =>
      fetch("/api/homelab-v2")
        .then((r) => r.json())
        .then(setData)
        .catch(() => {});
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, []);

  const services = data?.services.filter((s) => STORAGE_IDS.includes(s.id)) ?? [];

  return (
    <div className="block">
      <div className="block-label">
        <Database size={14} strokeWidth={1.75} />
        storage apps
      </div>

      {services.length > 0 ? (
        <div className="sub-list">
          {services.map((s) =>
            s.telemetry.type === "storage" ? (
              <div className="sub-row" key={s.id}>
                <div className="sub-row-head">
                  <span className="sub-row-label">
                    <span className={`svc-dot${s.status === "down" ? " down" : ""}`} />
                    {s.name}
                  </span>
                  <span className="sub-row-meta">
                    {formatBytes(s.telemetry.used_bytes)} / {formatBytes(s.telemetry.total_bytes)}
                  </span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${s.telemetry.used_pct}%` }} />
                </div>
              </div>
            ) : null,
          )}
        </div>
      ) : (
        <div className="block-value">—</div>
      )}
    </div>
  );
}
