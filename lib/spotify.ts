export type NowPlaying =
  | {
      isPlaying: true;
      trackName: string;
      artist: string;
      albumArtUrl: string | null;
      progressMs: number;
      durationMs: number;
    }
  | {
      isPlaying: false;
      trackName: string;
      artist: string;
      albumArtUrl: string | null;
      playedAt: string;
    }
  | null;

export async function getNowPlaying(): Promise<NowPlaying> {
  throw new Error("getNowPlaying not implemented yet — see Phase 2");
}
