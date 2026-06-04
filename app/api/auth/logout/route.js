import { NextResponse } from "next/server";
import { clearSession } from "../../../../lib/session";

export const dynamic = "force-dynamic";

export async function GET(req) {
  clearSession();
  return NextResponse.redirect(new URL("/", new URL(req.url).origin));
}
