const CACHE_TTL_MS = 60_000;
const REPOS_CACHE_TTL_MS = 600_000; // repo list changes rarely
const GITHUB_USERNAME = "Zohaib2244";
const MAX_COMMITS = 6;

export type GitHubUser = {
  login: string;
  avatarUrl: string;
  profileUrl: string;
};

export type CommitActivity = {
  repo: string;
  message: string;
  committedAt: string;
};

export type GitHubActivity = {
  user: GitHubUser | null;
  latest: CommitActivity | null;
  recent: CommitActivity[];
} | null;

export type GitHubRepo = {
  name: string;
  cloneUrl: string;
};

export type GitHubRepos = {
  repos: GitHubRepo[];
} | null;

type GitHubEvent = {
  type: string;
  repo: { name: string };
  created_at: string;
  payload?: {
    head?: string;
  };
};

type GitHubCommitResponse = {
  commit: { message: string };
};

type GitHubUserResponse = {
  login: string;
  avatar_url: string;
  html_url: string;
};

type GitHubRepoResponse = {
  name: string;
  clone_url: string;
  pushed_at: string;
};

async function fetchCommitMessage(
  repoFullName: string,
  sha: string,
  headers: Record<string, string>,
): Promise<string | null> {
  const response = await fetch(`https://api.github.com/repos/${repoFullName}/commits/${sha}`, {
    headers,
    cache: "no-store",
  });

  if (!response.ok) return null;

  const data = (await response.json()) as GitHubCommitResponse;
  return data.commit.message.split("\n")[0];
}

let cache: { data: GitHubActivity; expiresAt: number } | null = null;

export async function getGitHubActivity(): Promise<GitHubActivity> {
  if (cache && cache.expiresAt > Date.now()) {
    return cache.data;
  }

  let data: GitHubActivity = null;

  try {
    const headers: Record<string, string> = { Accept: "application/vnd.github+json" };
    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const [eventsRes, userRes] = await Promise.all([
      fetch(`https://api.github.com/users/${GITHUB_USERNAME}/events/public`, { headers, cache: "no-store" }),
      fetch(`https://api.github.com/users/${GITHUB_USERNAME}`, { headers, cache: "no-store" }),
    ]);

    const user: GitHubUser | null = userRes.ok
      ? await (async () => {
          const u = (await userRes.json()) as GitHubUserResponse;
          return { login: u.login, avatarUrl: u.avatar_url, profileUrl: u.html_url };
        })()
      : null;

    let latest: CommitActivity | null = null;
    let recent: CommitActivity[] = [];

    if (eventsRes.ok) {
      const events = (await eventsRes.json()) as GitHubEvent[];

      // GitHub's events API no longer includes commit messages in PushEvent
      // payloads (just `head`/`before` SHAs), so fetch each push's head
      // commit individually to get its message.
      const pushEvents = events
        .filter((e): e is GitHubEvent & { payload: { head: string } } => e.type === "PushEvent" && !!e.payload?.head)
        .slice(0, MAX_COMMITS);

      const commits = (
        await Promise.all(
          pushEvents.map(async (event): Promise<CommitActivity | null> => {
            const message = await fetchCommitMessage(event.repo.name, event.payload.head, headers);
            if (!message) return null;
            return {
              repo: event.repo.name.split("/")[1] ?? event.repo.name,
              message,
              committedAt: event.created_at,
            };
          }),
        )
      ).filter((c): c is CommitActivity => c !== null);

      latest = commits[0] ?? null;
      recent = commits.slice(1);
    }

    data = { user, latest, recent };
  } catch {
    if (cache) return cache.data;
  }

  cache = { data, expiresAt: Date.now() + CACHE_TTL_MS };
  return data;
}

let reposCache: { data: GitHubRepos; expiresAt: number } | null = null;

export async function getGitHubRepos(): Promise<GitHubRepos> {
  if (reposCache && reposCache.expiresAt > Date.now()) {
    return reposCache.data;
  }

  let data: GitHubRepos = null;

  try {
    const headers: Record<string, string> = { Accept: "application/vnd.github+json" };
    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const response = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100&sort=pushed`, {
      headers,
      cache: "no-store",
    });

    if (response.ok) {
      const repos = (await response.json()) as GitHubRepoResponse[];
      data = { repos: repos.map((r) => ({ name: r.name, cloneUrl: r.clone_url })) };
    }
  } catch {
    if (reposCache) return reposCache.data;
  }

  reposCache = { data, expiresAt: Date.now() + REPOS_CACHE_TTL_MS };
  return data;
}
