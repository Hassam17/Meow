"use client";

import { useEffect, useState } from "react";
import { GitCommitHorizontal } from "lucide-react";
import type { GitHubActivity as GitHubActivityData } from "@/lib/github";

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function GitHubActivity() {
  const [data, setData] = useState<GitHubActivityData>(null);

  useEffect(() => {
    const load = () =>
      fetch("/api/github-activity")
        .then((r) => r.json())
        .then(setData)
        .catch(() => {});
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="block accent-left">
      <div className="block-label">
        <GitCommitHorizontal size={14} strokeWidth={1.75} />
        github activity
      </div>

      {data?.latest ? (
        <>
          <div className="block-value accent">{data.latest.message}</div>
          <div className="block-sub">
            {data.latest.repo} · {timeAgo(data.latest.committedAt)}
          </div>
        </>
      ) : (
        <div className="block-value">—</div>
      )}

      {data && data.recent.length > 0 && (
        <div className="more-panel">
          <div className="more-head">recent commits</div>
          {data.recent.map((c, i) => (
            <div className="more-row" key={i}>
              <span>{c.message}</span>
              <span className="more-meta">
                {c.repo} · {timeAgo(c.committedAt)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
