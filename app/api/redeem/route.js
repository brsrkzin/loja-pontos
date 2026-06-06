import { NextResponse } from "next/server";
import crypto from "crypto";
import { getSession } from "../../../lib/session";
import {
  getItem, availablePoints, popDigitalCode, saveRedemption, addPending, hasStorage,
} from "../../../lib/store";
import { notifyDiscord } from "../../../lib/notify";

export const dynamic = "force-dynamic";

const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e || "");

export async function POST(req) {
  const user = await getSession();
  if (!user) return NextResponse.json({ ok: false, erro: "Você precisa entrar com o Kick." }, { status: 401 });
  if (!hasStorage()) return NextResponse.json({ ok: false, erro: "Loja indisponível (banco não configurado)." }, { status: 503 });

  const body = await req.json().catch(() => ({}));
  const item = await getItem(body.itemId);
  if (!item) return NextResponse.json({ ok: false, erro: "Item inválido." }, { status: 400 });

  const d = body.dados || {};
  const dados = {
    nomeCompleto: String(d.nomeCompleto || "").trim(),
    telefone: String(d.telefone || "").trim(),
    email: String(d.email || "").trim(),
    endereco: String(d.endereco || "").trim(),
    usuarioKick: String(d.usuarioKick || user.username || "").trim(),
  };
  const faltando = [];
  if (!dados.nomeCompleto) faltando.push("nome completo");
  if (!dados.telefone) faltando.push("telefone");
  if (!emailOk(dados.email)) faltando.push("email válido");
  if (!dados.usuarioKick) faltando.push("usuário na Kick");
  if (faltando.length)
    return NextResponse.json({ ok: false, erro: `Preencha: ${faltando.join(", ")}.` }, { status: 400 });

  const saldo = await availablePoints(user.username);
  if (!saldo.found)
    return NextResponse.json({ ok: false, erro: "Ainda não encontramos seus pontos. Assista à live por alguns minutos e tente de novo." }, { status: 400 });
  if (saldo.available < item.custo)
    return NextResponse.json({ ok: false, erro: "Pontos insuficientes." }, { status: 400 });

  let codigo = null;
  if (item.tipo === "digital") {
    codigo = await popDigitalCode(item.id);
    if (!codigo)
      return NextResponse.json({ ok: false, erro: "Sem códigos disponíveis no momento." }, { status: 409 });
  }

  const id = crypto.randomUUID();
  const entry = {
    id,
    username: user.username,
    itemId: item.id,
    premioNome: item.nome,
    custo: item.custo,
    tipo: item.tipo,
    codigo,
    dados,
    status: "processando",
    ts: Date.now(),
  };
  await saveRedemption(entry);
  await addPending(id);
  await notifyDiscord(entry);

  return NextResponse.json({
    ok: true,
    status: "processando",
    mensagem:
      "Resgate recebido! Os pontos serão debitados e a entrega confirmada em instantes (durante a live). Acompanhe em “Minhas trocas”.",
  });
}
