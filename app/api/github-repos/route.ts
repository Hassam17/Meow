import { NextResponse } from "next/server";
import { getGitHubRepos } from "@/lib/github";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getGitHubRepos();
    return NextResponse.json(data);
  } catch (error) {
    console.error("github-repos route error:", error);
    return NextResponse.json({ error: "failed to fetch github repos" }, { status: 502 });
  }
}
