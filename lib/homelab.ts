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

export function averageUptime(services: ServiceStatus[]): string | null {
  const values = services.map((s) => parseFloat(s.uptime)).filter((n) => !Number.isNaN(n));
  if (values.length === 0) return null;

  const avg = values.reduce((sum, n) => sum + n, 0) / values.length;
  return `${avg.toFixed(1)}%`;
}

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
// When the aggregator is ready, point HOMELAB_STATUS_URL at it — v2 fields
// (overall/host/per-service id+telemetry) are parsed additively by
// getHomelabStatusV2() alongside the v1 fields parsed by getHomelabStatus().

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

// Host-level telemetry — not tied to any single service, describes the
// machine the stack runs on.
export type DriveInfo = {
  name: string;
  mount: string;
  used_bytes: number;
  total_bytes: number;
  used_pct: number;
};

export type HostTelemetry = {
  cpu: { used_pct: number; load_avg: [number, number, number] };
  memory: { used_bytes: number; total_bytes: number; used_pct: number };
  drives: DriveInfo[];
  network: {
    rx_bytes: number;
    tx_bytes: number;
    rx_rate_bps: number;
    tx_rate_bps: number;
  };
  uptime_seconds: number;
};

export type HomelabStatusV2 = {
  last_checked: string;
  overall: "healthy" | "degraded" | "down";
  host: HostTelemetry;
  services: ServiceStatusV2[];
};

type RawServiceV2 = {
  name: string;
  status: string;
  uptime: string;
  id?: string;
  telemetry?: Telemetry;
};

type RawResponse = {
  services?: RawServiceV2[];
  last_checked?: string;
  overall?: string;
  host?: HostTelemetry;
};

function isValidStatus(s: string): s is "up" | "down" {
  return s === "up" || s === "down";
}

function isOverall(s: string): s is HomelabStatusV2["overall"] {
  return s === "healthy" || s === "degraded" || s === "down";
}

// Realistic stand-in for the v2 aggregator response, used for local dev/
// testing on machines that can't reach the real homelab (e.g. a Mac with
// HOMELAB_STATUS_URL unset or unreachable). Enable with HOMELAB_MOCK_DATA=true.
function mockRawResponse(): RawResponse {
  return {
    last_checked: new Date().toISOString(),
    overall: "healthy",
    host: {
      cpu: { used_pct: 28, load_avg: [0.84, 0.91, 1.05] },
      memory: { used_bytes: 18_400_000_000, total_bytes: 34_359_738_368, used_pct: 53.6 },
      drives: [
        { name: "system (nvme0)", mount: "/", used_bytes: 182_000_000_000, total_bytes: 512_000_000_000, used_pct: 35.5 },
        { name: "media array", mount: "/mnt/media", used_bytes: 8_400_000_000_000, total_bytes: 16_000_000_000_000, used_pct: 52.5 },
      ],
      network: { rx_bytes: 1_280_000_000_000, tx_bytes: 340_000_000_000, rx_rate_bps: 4_500_000, tx_rate_bps: 850_000 },
      uptime_seconds: 1_036_800,
    },
    services: [
      {
        name: "immich",
        status: "up",
        uptime: "99.9%",
        id: "immich",
        telemetry: { type: "storage", used_bytes: 612_000_000_000, total_bytes: 2_000_000_000_000, used_pct: 30.6 },
      },
      {
        name: "jellyfin",
        status: "up",
        uptime: "99.8%",
        id: "jellyfin",
        telemetry: {
          type: "media_sessions",
          session_count: 2,
          active_sessions: [
            { user: "nutmag", title: "The Bear S03E04", progress_pct: 42, device: "Chrome" },
            { user: "guest", title: "Arcane S02E03", progress_pct: 78, device: "Apple TV" },
          ],
        },
      },
      {
        name: "jellyseerr",
        status: "up",
        uptime: "99.7%",
        id: "jellyseerr",
        telemetry: { type: "request_queue", pending_count: 3, approved_count: 12, available_count: 145 },
      },
      {
        name: "radarr",
        status: "up",
        uptime: "99.6%",
        id: "radarr",
        telemetry: {
          type: "download_queue",
          queue_size: 2,
          items: [
            { title: "Dune: Part Two (2024)", progress_pct: 64, eta_seconds: 1_800 },
            { title: "Oppenheimer (2023)", progress_pct: 12, eta_seconds: 5_400 },
          ],
        },
      },
      {
        name: "sonarr",
        status: "up",
        uptime: "99.9%",
        id: "sonarr",
        telemetry: {
          type: "download_queue",
          queue_size: 1,
          items: [{ title: "Severance S02E07", progress_pct: 88, eta_seconds: 300 }],
        },
      },
      {
        name: "jackett",
        status: "down",
        uptime: "94.2%",
        id: "jackett",
        telemetry: { type: "none" },
      },
      {
        name: "qbittorrent",
        status: "up",
        uptime: "99.4%",
        id: "qbittorrent",
        telemetry: {
          type: "download_queue",
          queue_size: 3,
          items: [
            { title: "ubuntu-24.04-desktop-amd64.iso", progress_pct: 95, eta_seconds: 120 },
            { title: "debian-12.6-amd64-netinst.iso", progress_pct: 41, eta_seconds: 2_700 },
            { title: "arch-linux-x86_64.iso", progress_pct: 6, eta_seconds: 9_600 },
          ],
        },
      },
      {
        name: "nextcloud",
        status: "up",
        uptime: "99.9%",
        id: "nextcloud",
        telemetry: { type: "storage", used_bytes: 145_000_000_000, total_bytes: 1_000_000_000_000, used_pct: 14.5 },
      },
    ],
  };
}

let rawCache: { data: RawResponse | null; expiresAt: number } | null = null;

async function fetchRaw(): Promise<RawResponse | null> {
  if (rawCache && rawCache.expiresAt > Date.now()) {
    return rawCache.data;
  }

  if (process.env.HOMELAB_MOCK_DATA === "true") {
    const data = mockRawResponse();
    rawCache = { data, expiresAt: Date.now() + CACHE_TTL_MS };
    return data;
  }

  const url = process.env.HOMELAB_STATUS_URL;
  if (!url) {
    rawCache = { data: null, expiresAt: Date.now() + CACHE_TTL_MS };
    return null;
  }

  let data: RawResponse | null = null;

  try {
    const response = await fetch(url, { cache: "no-store" });
    if (response.ok) {
      data = (await response.json()) as RawResponse;
    }
  } catch {
    // Return stale cache rather than crash if the homelab is unreachable
    if (rawCache) return rawCache.data;
  }

  rawCache = { data, expiresAt: Date.now() + CACHE_TTL_MS };
  return data;
}

export function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(exponent === 0 || value >= 10 ? 0 : 1)} ${units[exponent]}`;
}

export function formatRate(bytesPerSecond: number): string {
  return `${formatBytes(bytesPerSecond)}/s`;
}

export function formatEta(seconds: number): string {
  if (seconds <= 0) return "done";
  const hours = Math.floor(seconds / 3_600);
  const mins = Math.floor((seconds % 3_600) / 60);
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export async function getHomelabStatus(): Promise<HomelabStatus> {
  const raw = await fetchRaw();
  if (!raw || !raw.services || !raw.last_checked) return null;

  return {
    last_checked: raw.last_checked,
    services: raw.services
      .filter((s) => isValidStatus(s.status))
      .map((s) => ({ name: s.name, status: s.status as "up" | "down", uptime: s.uptime })),
  };
}

// Returns null until the v2 aggregator ships — `overall`, `host`, and
// per-service `id`/`telemetry` are all additive fields not present in the
// current v1 response.
export async function getHomelabStatusV2(): Promise<HomelabStatusV2 | null> {
  const raw = await fetchRaw();
  if (!raw || !raw.services || !raw.last_checked || !raw.host) return null;

  const overall = raw.overall;
  if (!overall || !isOverall(overall)) return null;

  const services: ServiceStatusV2[] = raw.services
    .filter((s): s is RawServiceV2 & { id: string; telemetry: Telemetry } =>
      isValidStatus(s.status) && !!s.id && !!s.telemetry,
    )
    .map((s) => ({
      name: s.name,
      status: s.status as "up" | "down",
      uptime: s.uptime,
      id: s.id,
      telemetry: s.telemetry,
    }));

  return {
    last_checked: raw.last_checked,
    overall,
    host: raw.host,
    services,
  };
}
