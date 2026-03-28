import { NextRequest, NextResponse } from "next/server";
import { hasSession, clearSession } from "@/lib/session-store";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json({ active: false });
  }
  return NextResponse.json({ active: hasSession(sessionId) });
}

export async function DELETE(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (sessionId) {
    clearSession(sessionId);
  }
  return NextResponse.json({ success: true });
}
