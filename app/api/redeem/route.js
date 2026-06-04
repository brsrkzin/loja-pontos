import { NextResponse } from "next/server";
import { getSession } from "../../../lib/session";
import { getViewerPoints, removePoints, addPoints } from "../../../lib/kicklet";
import {
  getItem,
  popDigitalCode,
  logRedemption,
  decStock,
  getStockUsed,
  hasStorage,
} from "../../../lib/store";
import { notifyDiscord } from "../../../lib/notify";

export const dynamic = "force-dynamic";

function emailValido(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e || "");
}

export async function POST(req) {
  const user = await getSession();
  if (!user) return NextResponse.json({ ok: false, erro: "Você precisa entrar com o Kick." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const item = await getItem(body.itemId);
  if (!item) return NextResponse.json({ ok: false, erro: "Item inválido." }, { status: 400 });

  // ---- Dados obrigatórios em todo resgate ----
  const d = body.dados || {};
  const dados = {
    nomeCompleto: String(d.nomeCompleto || "").trim(),
    telefone: String(d.telefone || "").trim(),
    email: String(d.email || "").trim(),
    endereco: String(d.endereco || "").trim(), // opcional
    usuarioKick: String(d.usuarioKick || user.username || "").trim(),
  };
  const faltando = [];
  if (!dados.nomeCompleto) faltando.push("nome completo");
  if (!dados.telefone) faltando.push("telefone");
  if (!emailValido(dados.email)) faltando.push("email válido");
  if (!dados.usuarioKick) faltando.push("usuário na Kick");
  if (faltando.length)
    return NextResponse.json({ ok: false, erro: `Preencha: ${faltando.join(", ")}.` }, { status: 400 });

  // ---- Saldo ----
  let saldo;
  try {
    saldo = (await getViewerPoints(user.username)).points;
  } catch {
    return NextResponse.json({ ok: false, erro: "Não consegui ler seus pontos. Tente de novo." }, { status: 502 });
  }
  if (saldo < item.custo)
    return NextResponse.json({ ok: false, erro: "Pontos insuficientes." }, { status: 400 });

  // ---- Estoque ----
  if (item.estoque != null && hasStorage()) {
    const usados = await getStockUsed(item.id);
    if (usados >= item.estoque)
      return NextResponse.json({ ok: false, erro: "Item esgotado." }, { status: 400 });
  }

  // ---- Debita pontos ----
  try {
    await removePoints(user.username, item.custo);
  } catch {
    return NextResponse.json({ ok: false, erro: "Falha ao debitar pontos. Nada foi cobrado." }, { status: 502 });
  }

  // ---- Entrega ----
  let codigo = null;
  if (item.tipo === "digital" && hasStorage()) {
    codigo = await popDigitalCode(item.id);
    if (!codigo) {
      await addPoints(user.username, item.custo).catch(() => {});
      return NextResponse.json(
        { ok: false, erro: "Sem códigos disponíveis. Seus pontos foram devolvidos." },
        { status: 409 }
      );
    }
  }
  if (item.estoque != null && hasStorage()) await decStock(item.id);

  const entry = {
    username: user.username,
    itemId: item.id,
    premioNome: item.nome,
    custo: item.custo,
    tipo: item.tipo,
    codigo,
    dados,
    status: item.tipo === "fisico" ? "pendente_envio" : "entregue",
  };
  await logRedemption(entry).catch(() => {});
  await notifyDiscord(entry);

  return NextResponse.json({
    ok: true,
    tipo: item.tipo,
    codigo,
    mensagem:
      item.tipo === "digital"
        ? codigo
          ? "Resgate concluído! Seu código está abaixo."
          : "Resgate concluído! O streamer vai te entregar em breve."
        : "Resgate concluído! Seu prêmio será enviado.",
  });
}
