import { NextResponse } from "next/server";
import { getGameLibrary } from "@/lib/steam";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getGameLibrary();
    return NextResponse.json(data);
  } catch (error) {
    console.error("steam-library route error:", error);
    return NextResponse.json({ error: "failed to fetch game library" }, { status: 502 });
  }
}
