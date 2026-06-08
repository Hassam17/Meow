import { NextResponse } from "next/server";
import { getNowPlaying } from "@/lib/spotify";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getNowPlaying();
    return NextResponse.json(data);
  } catch (error) {
    console.error("now-playing route error:", error);
    return NextResponse.json({ error: "failed to fetch now playing" }, { status: 502 });
  }
}
