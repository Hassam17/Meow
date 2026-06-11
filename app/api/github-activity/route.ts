import { NextResponse } from "next/server";
import { getGitHubActivity } from "@/lib/github";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getGitHubActivity();
    return NextResponse.json(data);
  } catch (error) {
    console.error("github-activity route error:", error);
    return NextResponse.json({ error: "failed to fetch github activity" }, { status: 502 });
  }
}
