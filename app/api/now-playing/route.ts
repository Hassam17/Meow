import { NextResponse } from "next/server";

export const revalidate = 30;

export async function GET() {
  return NextResponse.json({ error: "not implemented yet — see Phase 2" }, { status: 501 });
}
