const TOKEN_URL = "https://accounts.spotify.com/api/token";
const CURRENTLY_PLAYING_URL = "https://api.spotify.com/v1/me/player/currently-playing";
const RECENTLY_PLAYED_URL = "https://api.spotify.com/v1/me/player/recently-played?limit=6";

const ACCESS_TOKEN_SAFETY_MARGIN_MS = 60_000;
const NOW_PLAYING_CACHE_TTL_MS = 30_000;

export type NowPlaying = {
  trackName: string;
  artist: string;
  albumArtUrl: string | null;
  isPlaying: boolean;
  progressMs: number | null;
  durationMs: number | null;
  playedAt: string | null;
  recentTracks: { trackName: string; artist: string }[];
} | null;

type SpotifyArtist = { name: string };
type SpotifyImage = { url: string };
type SpotifyTrack = {
  name: string;
  artists: SpotifyArtist[];
  album: { images?: SpotifyImage[] };
  duration_ms: number;
};

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now()) {
    return cachedAccessToken.token;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Missing SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET / SPOTIFY_REFRESH_TOKEN");
  }

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Spotify token refresh failed: ${response.status}`);
  }

  const data = (await response.json()) as { access_token: string; expires_in: number };
  cachedAccessToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000 - ACCESS_TOKEN_SAFETY_MARGIN_MS,
  };

  return cachedAccessToken.token;
}

function normalizeTrack(track: SpotifyTrack): { trackName: string; artist: string; albumArtUrl: string | null } {
  return {
    trackName: track.name,
    artist: track.artists.map((a) => a.name).join(", "),
    albumArtUrl: track.album.images?.[0]?.url ?? null,
  };
}

async function fetchRecentTracks(
  accessToken: string,
): Promise<{ trackName: string; artist: string; albumArtUrl: string | null; playedAt: string }[]> {
  const response = await fetch(RECENTLY_PLAYED_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Spotify recently-played request failed: ${response.status}`);
  }

  const data = (await response.json()) as { items?: { track: SpotifyTrack; played_at: string }[] };
  return (data.items ?? []).map((item) => ({
    ...normalizeTrack(item.track),
    playedAt: item.played_at,
  }));
}

async function fetchCurrentlyPlayingRaw(
  accessToken: string,
): Promise<{ trackName: string; artist: string; albumArtUrl: string | null; isPlaying: boolean; progressMs: number | null; durationMs: number | null } | null> {
  const response = await fetch(CURRENTLY_PLAYING_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (response.status === 204) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Spotify currently-playing request failed: ${response.status}`);
  }

  const data = (await response.json()) as {
    item: SpotifyTrack | null;
    is_playing: boolean;
    progress_ms: number | null;
  };

  if (!data.item) {
    return null;
  }

  return {
    ...normalizeTrack(data.item),
    isPlaying: data.is_playing,
    progressMs: data.progress_ms,
    durationMs: data.item.duration_ms,
  };
}

let cachedNowPlaying: { data: NowPlaying; expiresAt: number } | null = null;

async function fetchNowPlaying(): Promise<NowPlaying> {
  const accessToken = await getAccessToken();
  const [current, recent] = await Promise.all([
    fetchCurrentlyPlayingRaw(accessToken),
    fetchRecentTracks(accessToken),
  ]);

  if (current) {
    return {
      ...current,
      playedAt: null,
      recentTracks: recent.slice(0, 4).map(({ trackName, artist }) => ({ trackName, artist })),
    };
  }

  const last = recent[0];
  if (!last) return null;

  return {
    trackName: last.trackName,
    artist: last.artist,
    albumArtUrl: last.albumArtUrl,
    isPlaying: false,
    progressMs: null,
    durationMs: null,
    playedAt: last.playedAt,
    recentTracks: recent.slice(1, 4).map(({ trackName, artist }) => ({ trackName, artist })),
  };
}

export async function getNowPlaying(): Promise<NowPlaying> {
  if (cachedNowPlaying && cachedNowPlaying.expiresAt > Date.now()) {
    return cachedNowPlaying.data;
  }

  const data = await fetchNowPlaying();

  cachedNowPlaying = { data, expiresAt: Date.now() + NOW_PLAYING_CACHE_TTL_MS };
  return data;
}
