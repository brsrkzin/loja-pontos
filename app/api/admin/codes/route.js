import { NextResponse } from "next/server";
import { pushDigitalCodes, countDigitalCodes } from "../../../../lib/store";

export const dynamic = "force-dynamic";

// Abastece o estoque de códigos digitais de um prêmio.
// Body: { senha, premioId, codigos: ["AAA","BBB"] }
export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  if (body.senha !== process.env.ADMIN_PASSWORD)
    return NextResponse.json({ ok: false }, { status: 401 });
  const codigos = (body.codigos || []).map((c) => String(c).trim()).filter(Boolean);
  const add = await pushDigitalCodes(body.premioId, codigos);
  const total = await countDigitalCodes(body.premioId);
  return NextResponse.json({ ok: true, adicionados: add, totalEmEstoque: total });
}
