const OWNED_GAMES_URL = "https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/";
const RECENTLY_PLAYED_URL = "https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v1/";
const PLAYER_SUMMARIES_URL = "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/";

const CACHE_TTL_MS = 15_000;
const LIBRARY_CACHE_TTL_MS = 600_000; // owned-games list changes rarely

export type SteamStatus = "in-game" | "online" | "offline";

export type CurrentlyPlaying = {
  gameName: string;
  iconUrl: string | null;
  recentPlaytimeMinutes: number;
  hoursTotal: number;
  lastPlayedTimestamp: number;
  status: SteamStatus;
  avatarUrl: string | null;
  personaName: string | null;
  friendCode: string | null;
  recentlyPlayed: { gameName: string; hours2w: number; hoursTotal: number }[];
} | null;

export type LibraryGame = {
  appid: number;
  name: string;
  hoursTotal: number;
  lastPlayed: number; // unix ts, 0 = never
};

export type GameLibrary = {
  totalGames: number;
  totalHours: number;
  games: LibraryGame[];
} | null;

type SteamOwnedGame = {
  appid: number;
  name: string;
  playtime_2weeks?: number;
  playtime_forever: number;
  img_icon_url: string;
  rtime_last_played: number;
};

type SteamRecentGame = {
  appid: number;
  name: string;
  playtime_2weeks: number;
  playtime_forever: number;
};

type SteamPlayerSummary = {
  personaname?: string;
  personastate: number;
  avatarmedium?: string;
  avatarfull?: string;
  gameextrainfo?: string;
};

function iconUrl(appid: number, imgIconUrl: string): string | null {
  if (!imgIconUrl) return null;
  return `https://media.steampowered.com/steamcommunity/public/images/apps/${appid}/${imgIconUrl}.jpg`;
}

// SteamID64 minus the 76561197960265728 base offset gives the 32-bit
// account ID — the numeric "friend code" Steam shows for adding friends.
const STEAM_ID64_BASE = BigInt("76561197960265728");

function friendCodeFromSteamId(steamId: string): string | null {
  try {
    return (BigInt(steamId) - STEAM_ID64_BASE).toString();
  } catch {
    return null;
  }
}

function toHours(minutes: number): number {
  return Math.round((minutes / 60) * 10) / 10;
}

function getCredentials(): { apiKey: string; steamId: string } {
  const apiKey = process.env.STEAM_API_KEY;
  const steamId = process.env.STEAM_PROFILE_ID;
  if (!apiKey || !steamId) {
    throw new Error("Missing STEAM_API_KEY / STEAM_PROFILE_ID");
  }
  return { apiKey, steamId };
}

let cache: { data: CurrentlyPlaying; expiresAt: number } | null = null;

export async function getCurrentlyPlaying(): Promise<CurrentlyPlaying> {
  if (cache && cache.expiresAt > Date.now()) {
    return cache.data;
  }

  const { apiKey, steamId } = getCredentials();

  const [ownedRes, recentRes, summaryRes] = await Promise.all([
    fetch(`${OWNED_GAMES_URL}?key=${apiKey}&steamid=${steamId}&include_appinfo=1&format=json`, {
      cache: "no-store",
    }),
    fetch(`${RECENTLY_PLAYED_URL}?key=${apiKey}&steamid=${steamId}&format=json`, {
      cache: "no-store",
    }),
    fetch(`${PLAYER_SUMMARIES_URL}?key=${apiKey}&steamids=${steamId}&format=json`, {
      cache: "no-store",
    }),
  ]);

  if (!ownedRes.ok) throw new Error(`Steam GetOwnedGames failed: ${ownedRes.status}`);
  if (!recentRes.ok) throw new Error(`Steam GetRecentlyPlayedGames failed: ${recentRes.status}`);
  if (!summaryRes.ok) throw new Error(`Steam GetPlayerSummaries failed: ${summaryRes.status}`);

  const [ownedData, recentData, summaryData] = await Promise.all([
    ownedRes.json() as Promise<{ response: { games?: SteamOwnedGame[] } }>,
    recentRes.json() as Promise<{ response: { games?: SteamRecentGame[] } }>,
    summaryRes.json() as Promise<{ response: { players?: SteamPlayerSummary[] } }>,
  ]);

  const owned = ownedData.response.games ?? [];
  if (owned.length === 0) {
    cache = { data: null, expiresAt: Date.now() + CACHE_TTL_MS };
    return null;
  }

  const player = summaryData.response.players?.[0];
  const status: SteamStatus = player?.gameextrainfo
    ? "in-game"
    : player && player.personastate > 0
      ? "online"
      : "offline";

  // Build a playtime_2weeks lookup from the recent games list
  const recentMap = new Map<number, number>();
  for (const g of recentData.response.games ?? []) {
    recentMap.set(g.appid, g.playtime_2weeks);
  }

  // Sort by rtime_last_played descending — most recently played first
  const sorted = [...owned].sort((a, b) => b.rtime_last_played - a.rtime_last_played);
  const top = sorted[0];
  const activeGame = player?.gameextrainfo
    ? owned.find((game) => game.name === player.gameextrainfo) ?? top
    : top;

  const recentlyPlayed = (recentData.response.games ?? []).slice(0, 5).map((g) => ({
    gameName: g.name,
    hours2w: toHours(g.playtime_2weeks),
    hoursTotal: toHours(g.playtime_forever),
  }));

  const data: CurrentlyPlaying = {
    // If actually in a game right now, show that; otherwise most recent
    gameName: player?.gameextrainfo ?? top.name,
    iconUrl: iconUrl(activeGame.appid, activeGame.img_icon_url),
    recentPlaytimeMinutes: recentMap.get(activeGame.appid) ?? activeGame.playtime_2weeks ?? 0,
    hoursTotal: toHours(activeGame.playtime_forever),
    lastPlayedTimestamp: activeGame.rtime_last_played,
    status,
    avatarUrl: player?.avatarmedium ?? player?.avatarfull ?? null,
    personaName: player?.personaname ?? null,
    friendCode: friendCodeFromSteamId(steamId),
    recentlyPlayed,
  };

  cache = { data, expiresAt: Date.now() + CACHE_TTL_MS };
  return data;
}

let libraryCache: { data: GameLibrary; expiresAt: number } | null = null;

export async function getGameLibrary(): Promise<GameLibrary> {
  if (libraryCache && libraryCache.expiresAt > Date.now()) {
    return libraryCache.data;
  }

  const { apiKey, steamId } = getCredentials();

  const res = await fetch(`${OWNED_GAMES_URL}?key=${apiKey}&steamid=${steamId}&include_appinfo=1&format=json`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Steam GetOwnedGames failed: ${res.status}`);

  const json = (await res.json()) as { response: { game_count?: number; games?: SteamOwnedGame[] } };
  const owned = json.response.games ?? [];

  if (owned.length === 0) {
    libraryCache = { data: null, expiresAt: Date.now() + LIBRARY_CACHE_TTL_MS };
    return null;
  }

  const games: LibraryGame[] = owned
    .map((g) => ({
      appid: g.appid,
      name: g.name,
      hoursTotal: toHours(g.playtime_forever),
      lastPlayed: g.rtime_last_played ?? 0,
    }))
    .sort((a, b) => b.hoursTotal - a.hoursTotal);

  const data: GameLibrary = {
    totalGames: json.response.game_count ?? games.length,
    totalHours: Math.round(games.reduce((sum, g) => sum + g.hoursTotal, 0)),
    games,
  };

  libraryCache = { data, expiresAt: Date.now() + LIBRARY_CACHE_TTL_MS };
  return data;
}
