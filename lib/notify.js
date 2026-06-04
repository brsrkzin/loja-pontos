// Aviso de resgate no Discord (opcional). Configure DISCORD_WEBHOOK_URL.
export async function notifyDiscord(entry) {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) return;
  const linhas = [
    `**Novo resgate!**`,
    `Viewer: \`${entry.username}\``,
    `Prêmio: **${entry.premioNome}** (${entry.custo} pts)`,
    `Tipo: ${entry.tipo}`,
  ];
  if (entry.codigo) linhas.push(`Código entregue: \`${entry.codigo}\``);
  if (entry.dados) {
    for (const [k, v] of Object.entries(entry.dados)) linhas.push(`${k}: ${v}`);
  }
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: linhas.join("\n") }),
    });
  } catch {
    // silencioso: não bloqueia o resgate se o Discord falhar
  }
}
