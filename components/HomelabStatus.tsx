"use client";

import { usePolling } from "@/lib/usePolling";
import { useWidget } from "@/components/framework/WidgetContext";
import { averageUptime, type HomelabStatus as HomelabStatusData } from "@/lib/homelab";

export function HomelabStatus() {
  const { settings } = useWidget();
  const { data } = usePolling<HomelabStatusData>("/api/homelab", Number(settings.pollSeconds ?? 60) * 1000);

  return (
    <>
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
    </>
  );
}

export function HomelabStatusMore() {
  const { data } = usePolling<HomelabStatusData>("/api/homelab", 60_000);

  if (!data || data.services.length === 0) return <div className="block-sub">no service data</div>;

  return (
    <>
      <div className="more-head">services</div>
      {data.services.map((s) => (
        <div className="more-row" key={s.name}>
          <span>{s.name}</span>
          <span className="more-meta">{s.uptime}</span>
        </div>
      ))}
    </>
  );
}
