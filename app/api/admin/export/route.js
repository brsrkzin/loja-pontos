import { listRedemptions } from "../../../../lib/store";

export const dynamic = "force-dynamic";

function csvCell(v) {
  const s = String(v ?? "");
  return `"${s.replace(/"/g, '""')}"`;
}

// Exporta os resgates em CSV (abre no Excel/Google Sheets).
export async function GET(req) {
  const senha = new URL(req.url).searchParams.get("senha");
  if (senha !== process.env.ADMIN_PASSWORD)
    return new Response("Senha incorreta", { status: 401 });

  const resgates = await listRedemptions(5000);
  const cabecalho = [
    "data_hora", "usuario_kick", "item", "custo_pontos", "tipo", "status",
    "nome_completo", "telefone", "email", "endereco", "codigo_entregue",
  ];
  const linhas = resgates.map((r) => {
    const d = r.dados || {};
    return [
      new Date(r.ts).toLocaleString("pt-BR"),
      r.username,
      r.premioNome,
      r.custo,
      r.tipo,
      r.status,
      d.nomeCompleto,
      d.telefone,
      d.email,
      d.endereco,
      r.codigo || "",
    ].map(csvCell).join(",");
  });
  const csv = "﻿" + [cabecalho.map(csvCell).join(","), ...linhas].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="resgates.csv"`,
    },
  });
}
