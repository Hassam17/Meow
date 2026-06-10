const OWNED_GAMES_URL = "https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/";
const RECENTLY_PLAYED_URL = "https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v1/";

const CACHE_TTL_MS = 60_000;

export type CurrentlyPlaying = {
  gameName: string;
  iconUrl: string | null;
  recentPlaytimeMinutes: number;
  hoursTotal: number;
  lastPlayedTimestamp: number;
  recentlyPlayed: { gameName: string; hoursTotal: number }[];
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

function iconUrl(appid: number, imgIconUrl: string): string | null {
  if (!imgIconUrl) return null;
  return `https://media.steampowered.com/steamcommunity/public/images/apps/${appid}/${imgIconUrl}.jpg`;
}

let cache: { data: CurrentlyPlaying; expiresAt: number } | null = null;

export async function getCurrentlyPlaying(): Promise<CurrentlyPlaying> {
  if (cache && cache.expiresAt > Date.now()) {
    return cache.data;
  }

  const apiKey = process.env.STEAM_API_KEY;
  const steamId = process.env.STEAM_PROFILE_ID;

  if (!apiKey || !steamId) {
    throw new Error("Missing STEAM_API_KEY / STEAM_PROFILE_ID");
  }

  const [ownedRes, recentRes] = await Promise.all([
    fetch(`${OWNED_GAMES_URL}?key=${apiKey}&steamid=${steamId}&include_appinfo=1&format=json`, {
      cache: "no-store",
    }),
    fetch(`${RECENTLY_PLAYED_URL}?key=${apiKey}&steamid=${steamId}&format=json`, {
      cache: "no-store",
    }),
  ]);

  if (!ownedRes.ok) throw new Error(`Steam GetOwnedGames failed: ${ownedRes.status}`);
  if (!recentRes.ok) throw new Error(`Steam GetRecentlyPlayedGames failed: ${recentRes.status}`);

  const [ownedData, recentData] = await Promise.all([
    ownedRes.json() as Promise<{ response: { games?: SteamOwnedGame[] } }>,
    recentRes.json() as Promise<{ response: { games?: SteamRecentGame[] } }>,
  ]);

  const owned = ownedData.response.games ?? [];
  if (owned.length === 0) {
    cache = { data: null, expiresAt: Date.now() + CACHE_TTL_MS };
    return null;
  }

  // Build a playtime_2weeks lookup from the recent games list
  const recentMap = new Map<number, number>();
  for (const g of recentData.response.games ?? []) {
    recentMap.set(g.appid, g.playtime_2weeks);
  }

  // Sort by rtime_last_played descending — most recently played first
  const sorted = [...owned].sort((a, b) => b.rtime_last_played - a.rtime_last_played);
  const top = sorted[0];

  const recentlyPlayed = (recentData.response.games ?? [])
    .filter((g) => g.appid !== top.appid)
    .slice(0, 3)
    .map((g) => ({
      gameName: g.name,
      hoursTotal: Math.round((g.playtime_forever / 60) * 10) / 10,
    }));

  const data: CurrentlyPlaying = {
    gameName: top.name,
    iconUrl: iconUrl(top.appid, top.img_icon_url),
    recentPlaytimeMinutes: recentMap.get(top.appid) ?? top.playtime_2weeks ?? 0,
    hoursTotal: Math.round(top.playtime_forever / 60 * 10) / 10,
    lastPlayedTimestamp: top.rtime_last_played,
    recentlyPlayed,
  };

  cache = { data, expiresAt: Date.now() + CACHE_TTL_MS };
  return data;
}
