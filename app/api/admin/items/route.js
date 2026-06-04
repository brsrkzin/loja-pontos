import { NextResponse } from "next/server";
import { salvarItem, removerItem, getCatalogo } from "../../../../lib/store";

export const dynamic = "force-dynamic";

function auth(senha) {
  return senha && senha === process.env.ADMIN_PASSWORD;
}

// Criar ou editar um item
export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  if (!auth(body.senha)) return NextResponse.json({ ok: false }, { status: 401 });
  const i = body.item || {};
  if (!i.id || !i.nome || !Number.isFinite(Number(i.custo)))
    return NextResponse.json({ ok: false, erro: "Preencha id, nome e custo." }, { status: 400 });
  const item = {
    id: String(i.id).trim().toLowerCase().replace(/\s+/g, "-"),
    nome: String(i.nome).trim(),
    descricao: String(i.descricao || "").trim(),
    custo: Math.max(0, Math.round(Number(i.custo))),
    tipo: i.tipo === "fisico" ? "fisico" : "digital",
    estoque: i.estoque === "" || i.estoque == null ? null : Math.max(0, Math.round(Number(i.estoque))),
    imagem: String(i.imagem || "").trim(),
  };
  try {
    const lista = await salvarItem(item);
    return NextResponse.json({ ok: true, itens: lista });
  } catch (e) {
    return NextResponse.json({ ok: false, erro: e.message }, { status: 409 });
  }
}

// Remover um item
export async function DELETE(req) {
  const body = await req.json().catch(() => ({}));
  if (!auth(body.senha)) return NextResponse.json({ ok: false }, { status: 401 });
  try {
    const lista = await removerItem(body.id);
    return NextResponse.json({ ok: true, itens: lista });
  } catch (e) {
    return NextResponse.json({ ok: false, erro: e.message }, { status: 409 });
  }
}

// Listar itens (para o painel)
export async function GET() {
  return NextResponse.json({ itens: await getCatalogo() });
}
