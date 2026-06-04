import { NextResponse } from "next/server";
import { getRanking } from "../../../../lib/kicklet";

export const dynamic = "force-dynamic";

// Lista pontos por usuário (vindo do Kicklet). ?senha=...&busca=...
export async function GET(req) {
  const url = new URL(req.url);
  if (url.searchParams.get("senha") !== process.env.ADMIN_PASSWORD)
    return NextResponse.json({ ok: false }, { status: 401 });
  const busca = url.searchParams.get("busca") || "";
  try {
    let lista = await getRanking(100, busca);
    return NextResponse.json({ ok: true, usuarios: lista });
  } catch (e) {
    return NextResponse.json({ ok: false, erro: "Falha ao ler Kicklet." }, { status: 502 });
  }
}
