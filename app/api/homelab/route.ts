import { NextResponse } from "next/server";
import { getHomelabStatus } from "@/lib/homelab";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getHomelabStatus();
    return NextResponse.json(data);
  } catch (error) {
    console.error("homelab route error:", error);
    return NextResponse.json({ error: "failed to fetch homelab status" }, { status: 502 });
  }
}
