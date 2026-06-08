export type CurrentlyPlaying = {
  gameName: string;
  iconUrl: string | null;
  recentPlaytimeMinutes: number;
  hoursTotal: number;
  lastPlayedTimestamp: number;
} | null;

export async function getCurrentlyPlaying(): Promise<CurrentlyPlaying> {
  throw new Error("getCurrentlyPlaying not implemented yet — see Phase 3");
}
