const CACHE_TTL_MS = 60_000;

export type ServiceStatus = {
  name: string;
  status: "up" | "down";
  uptime: string;
};

export type HomelabStatus = {
  services: ServiceStatus[];
  last_checked: string;
} | null;

type RawResponse = {
  services?: { name: string; status: string; uptime: string }[];
  last_checked?: string;
};

function isValidStatus(s: string): s is "up" | "down" {
  return s === "up" || s === "down";
}

let cache: { data: HomelabStatus; expiresAt: number } | null = null;

export async function getHomelabStatus(): Promise<HomelabStatus> {
  if (cache && cache.expiresAt > Date.now()) {
    return cache.data;
  }

  const url = process.env.HOMELAB_STATUS_URL;
  if (!url) {
    cache = { data: null, expiresAt: Date.now() + CACHE_TTL_MS };
    return null;
  }

  let data: HomelabStatus = null;

  try {
    const response = await fetch(url, { cache: "no-store" });

    if (response.ok) {
      const raw = (await response.json()) as RawResponse;
      if (raw.services && raw.last_checked) {
        data = {
          last_checked: raw.last_checked,
          services: raw.services
            .filter((s) => isValidStatus(s.status))
            .map((s) => ({ name: s.name, status: s.status as "up" | "down", uptime: s.uptime })),
        };
      }
    }
  } catch {
    // Return stale cache rather than crash if the homelab is unreachable
    if (cache) return cache.data;
  }

  cache = { data, expiresAt: Date.now() + CACHE_TTL_MS };
  return data;
}
