const CACHE_TTL_MS = 60_000;
const GITHUB_USERNAME = "Zohaib2244";
const MAX_COMMITS = 6;

export type CommitActivity = {
  repo: string;
  message: string;
  committedAt: string;
};

export type GitHubActivity = {
  latest: CommitActivity | null;
  recent: CommitActivity[];
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

    const response = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}/events/public`, {
      headers,
      cache: "no-store",
    });

    if (response.ok) {
      const events = (await response.json()) as GitHubEvent[];

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

      data = { latest: commits[0] ?? null, recent: commits.slice(1) };
    }
  } catch {
    if (cache) return cache.data;
  }

  cache = { data, expiresAt: Date.now() + CACHE_TTL_MS };
  return data;
}
