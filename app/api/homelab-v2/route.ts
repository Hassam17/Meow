import { NextResponse } from "next/server";
import { getHomelabStatusV2 } from "@/lib/homelab";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getHomelabStatusV2();
    return NextResponse.json(data);
  } catch (error) {
    console.error("homelab-v2 route error:", error);
    return NextResponse.json({ error: "failed to fetch homelab v2 status" }, { status: 502 });
  }
}
