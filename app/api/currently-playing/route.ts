import { NextResponse } from "next/server";
import { getCurrentlyPlaying } from "@/lib/steam";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getCurrentlyPlaying();
    return NextResponse.json(data);
  } catch (error) {
    console.error("currently-playing route error:", error);
    return NextResponse.json({ error: "failed to fetch currently playing" }, { status: 502 });
  }
}
