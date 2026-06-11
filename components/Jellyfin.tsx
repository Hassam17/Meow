"use client";

import { useEffect, useState } from "react";
import { Tv } from "lucide-react";
import type { HomelabStatusV2 } from "@/lib/homelab";

export function Jellyfin() {
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

  const service = data?.services.find((s) => s.id === "jellyfin");
  const telemetry = service && service.telemetry.type === "media_sessions" ? service.telemetry : null;

  return (
    <div className="block accent-left">
      <div className="block-label">
        <Tv size={14} strokeWidth={1.75} />
        jellyfin
      </div>

      <div className="block-value accent">
        {telemetry ? `${telemetry.session_count} active session${telemetry.session_count === 1 ? "" : "s"}` : "—"}
      </div>

      {telemetry && telemetry.active_sessions.length > 0 && (
        <div className="more-panel">
          <div className="more-head">now streaming</div>
          {telemetry.active_sessions.map((session, i) => (
            <div className="more-row" key={i}>
              <span>
                {session.user} · {session.title}
              </span>
              <span className="more-meta">
                {session.progress_pct.toFixed(0)}% · {session.device}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
