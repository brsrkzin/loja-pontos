import { NextResponse } from "next/server";
import { getRankingCache } from "../../../../lib/store";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const url = new URL(req.url);
  if (url.searchParams.get("senha") !== process.env.ADMIN_PASSWORD)
    return NextResponse.json({ ok: false }, { status: 401 });
  const busca = (url.searchParams.get("busca") || "").toLowerCase();
  const { ranking } = await getRankingCache();
  let lista = ranking;
  if (busca) lista = ranking.filter((v) => (v.viewerKickUsername || "").toLowerCase().includes(busca));
  return NextResponse.json({ ok: true, usuarios: lista.slice(0, 100) });
}
