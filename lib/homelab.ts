const CACHE_TTL_MS = 60_000;

// ─── v1 shape (current MVP) ───────────────────────────────────────────
// What HOMELAB_STATUS_URL returns today (simple dots + uptime %).

export type ServiceStatus = {
  name: string;
  status: "up" | "down";
  uptime: string;
};

export type HomelabStatus = {
  services: ServiceStatus[];
  last_checked: string;
} | null;

// ─── v2 shape (future homelab aggregator — design-only, not yet built) ─
// The aggregator is a separate project running ON the homelab that queries
// all 8 services internally and returns one unified blob.
//
// Key properties:
//   - `overall` rollup drives the GlyphStrip without client-side aggregation
//   - `telemetry` is a discriminated union so lib/homelab.ts can render
//     type-appropriate views without per-service hardcoding
//   - v1 fields (name/status/uptime/last_checked) are UNCHANGED so the
//     Phase 4 MVP component keeps working unmodified once v2 ships
//
// When the aggregator is ready:
//   1. Point HOMELAB_STATUS_URL at it
//   2. Parse v2 fields alongside v1 (additive — no breaking change)
//   3. Build telemetry-aware UI as a separate pass

export type TelemetryNone           = { type: "none" };
export type TelemetryStorage        = { type: "storage"; used_bytes: number; total_bytes: number; used_pct: number };
export type TelemetryMediaSessions  = { type: "media_sessions"; session_count: number; active_sessions: { user: string; title: string; progress_pct: number; device: string }[] };
export type TelemetryRequestQueue   = { type: "request_queue"; pending_count: number; approved_count: number; available_count: number };
export type TelemetryDownloadQueue  = { type: "download_queue"; queue_size: number; items: { title: string; progress_pct: number; eta_seconds: number }[] };

export type Telemetry =
  | TelemetryNone
  | TelemetryStorage
  | TelemetryMediaSessions
  | TelemetryRequestQueue
  | TelemetryDownloadQueue;

export type ServiceStatusV2 = ServiceStatus & {
  id: string;
  telemetry: Telemetry;
};

export type HomelabStatusV2 = {
  last_checked: string;
  overall: "healthy" | "degraded" | "down";
  services: ServiceStatusV2[];
};

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
