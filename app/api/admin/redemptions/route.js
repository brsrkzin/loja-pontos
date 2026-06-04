import { NextResponse } from "next/server";
import { listRedemptions } from "../../../../lib/store";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const senha = new URL(req.url).searchParams.get("senha");
  if (senha !== process.env.ADMIN_PASSWORD)
    return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true, resgates: await listRedemptions() });
}
