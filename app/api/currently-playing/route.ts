import { NextResponse } from "next/server";

export const revalidate = 60;

export async function GET() {
  return NextResponse.json({ error: "not implemented yet — see Phase 3" }, { status: 501 });
}
