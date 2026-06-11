"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Github, GitCommitHorizontal } from "lucide-react";
import type { GitHubActivity as GitHubActivityData, GitHubRepos } from "@/lib/github";

/* eslint-disable @next/next/no-img-element -- github avatar is a tiny external image */

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

type Tab = "commits" | "repos";

export function GitHubActivity() {
  const [data, setData] = useState<GitHubActivityData>(null);
  const [repos, setRepos] = useState<GitHubRepos>(null);
  const [tab, setTab] = useState<Tab>("commits");
  const [copiedRepo, setCopiedRepo] = useState<string | null>(null);

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

  function loadRepos() {
    if (repos) return;
    fetch("/api/github-repos")
      .then((r) => r.json())
      .then(setRepos)
      .catch(() => {});
  }

  function copyClone(repo: { name: string; cloneUrl: string }) {
    navigator.clipboard.writeText(`git clone ${repo.cloneUrl}`).then(() => {
      setCopiedRepo(repo.name);
      setTimeout(() => setCopiedRepo(null), 1500);
    }).catch(() => {});
  }

  return (
    <div className="block accent-left" onMouseEnter={loadRepos}>
      <div className="github-head">
        {data?.user?.avatarUrl && <img src={data.user.avatarUrl} alt="" className="github-avatar" />}
        <div className="github-id">
          <div className="block-label github-label">
            <GitCommitHorizontal size={14} strokeWidth={1.75} />
            github activity
          </div>
          <div className="github-username">{data?.user?.login ?? "—"}</div>
        </div>
        {data?.user?.profileUrl && (
          <a
            href={data.user.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="github-link-btn"
            aria-label="open github profile"
          >
            <Github size={14} strokeWidth={1.75} />
          </a>
        )}
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

      <div className="more-panel">
        <div className="github-tabs">
          <button
            type="button"
            className={`github-tab${tab === "commits" ? " active" : ""}`}
            onClick={() => setTab("commits")}
          >
            commits
          </button>
          <button
            type="button"
            className={`github-tab${tab === "repos" ? " active" : ""}`}
            onClick={() => setTab("repos")}
          >
            repos
          </button>
        </div>

        {tab === "commits" ? (
          data && data.recent.length > 0 ? (
            data.recent.map((c, i) => (
              <div className="more-row" key={i}>
                <span>{c.message}</span>
                <span className="more-meta">
                  {c.repo} · {timeAgo(c.committedAt)}
                </span>
              </div>
            ))
          ) : (
            <div className="block-sub">no recent commits</div>
          )
        ) : (
          <div className="github-repo-list">
            {!repos ? (
              <div className="block-sub">loading repos...</div>
            ) : repos.repos.length === 0 ? (
              <div className="block-sub">no repos found</div>
            ) : (
              repos.repos.map((r) => (
                <div className="github-repo-row" key={r.name}>
                  <span>{r.name}</span>
                  <button
                    type="button"
                    className="github-copy-btn"
                    onClick={() => copyClone(r)}
                    aria-label={`copy clone command for ${r.name}`}
                    title={`git clone ${r.cloneUrl}`}
                  >
                    {copiedRepo === r.name ? <Check size={12} strokeWidth={2} /> : <Copy size={12} strokeWidth={1.75} />}
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
