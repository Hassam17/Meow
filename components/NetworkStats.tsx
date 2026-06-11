"use client";

import { useEffect, useState } from "react";
import { Network } from "lucide-react";
import { formatBytes, formatRate, type HomelabStatusV2 } from "@/lib/homelab";

export function NetworkStats() {
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

  const net = data?.host.network ?? null;

  return (
    <div className="block">
      <div className="block-label">
        <Network size={14} strokeWidth={1.75} />
        network stats
      </div>

      <div className="block-value">{net ? formatRate(net.rx_rate_bps + net.tx_rate_bps) : "—"}</div>
      <div className="block-sub">combined rx + tx</div>

      {net && (
        <div className="more-panel">
          <div className="more-head">interfaces</div>
          <div className="more-row">
            <span>download</span>
            <span className="more-meta">{formatRate(net.rx_rate_bps)}</span>
          </div>
          <div className="more-row">
            <span>upload</span>
            <span className="more-meta">{formatRate(net.tx_rate_bps)}</span>
          </div>
          <div className="more-row">
            <span>total received</span>
            <span className="more-meta">{formatBytes(net.rx_bytes)}</span>
          </div>
          <div className="more-row">
            <span>total sent</span>
            <span className="more-meta">{formatBytes(net.tx_bytes)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
