"use client";

import { useEffect, useState } from "react";
import { HardDrive } from "lucide-react";
import { formatBytes, type HomelabStatusV2 } from "@/lib/homelab";

export function DiskStorage() {
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

  const drives = data?.host.drives ?? [];
  const usedBytes = drives.reduce((sum, d) => sum + d.used_bytes, 0);
  const totalBytes = drives.reduce((sum, d) => sum + d.total_bytes, 0);

  return (
    <div className="block">
      <div className="block-label">
        <HardDrive size={14} strokeWidth={1.75} />
        disk storage
      </div>

      <div className="block-value">{drives.length > 0 ? formatBytes(usedBytes) : "—"}</div>
      <div className="block-sub">{drives.length > 0 ? `of ${formatBytes(totalBytes)} total` : "no data"}</div>

      {drives.length > 0 && (
        <div className="more-panel">
          <div className="more-head">drives</div>
          <div className="sub-list">
            {drives.map((d) => (
              <div className="sub-row" key={d.name}>
                <div className="sub-row-head">
                  <span className="sub-row-label">{d.name}</span>
                  <span className="sub-row-meta">
                    {formatBytes(d.used_bytes)} / {formatBytes(d.total_bytes)}
                  </span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${d.used_pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
