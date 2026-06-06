import { getSession } from "../../lib/session";
import { listRedemptions, hasStorage } from "../../lib/store";

export const dynamic = "force-dynamic";

const LABEL = {
  processando: "Processando",
  entregue: "Entregue",
  pendente_envio: "Aguardando envio",
  cancelado: "Cancelado",
};

export default async function MinhasTrocas() {
  const user = await getSession();
  if (!user) {
    return (
      <div>
        <h1 className="mb-4 text-3xl font-extrabold">Minhas trocas</h1>
        <a href="/api/auth/login" className="rounded-xl bg-kick-green px-5 py-3 font-bold text-black">Entrar com o Kick</a>
      </div>
    );
  }
  let trocas = [];
  if (hasStorage()) {
    const todas = await listRedemptions();
    trocas = todas.filter((t) => (t.username || "").toLowerCase() === user.username.toLowerCase());
  }
  return (
    <div>
      <h1 className="mb-6 text-3xl font-extrabold">Minhas trocas</h1>
      {!hasStorage() ? (
        <p className="text-white/50">Histórico indisponível (banco de dados não configurado).</p>
      ) : trocas.length === 0 ? (
        <p className="text-white/50">Você ainda não fez nenhuma troca.</p>
      ) : (
        <div className="space-y-3">
          {trocas.map((t, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl border border-white/10 bg-kick-panel p-4">
              <div>
                <div className="font-bold">{t.premioNome}</div>
                <div className="text-xs text-white/40">{new Date(t.ts).toLocaleString("pt-BR")}</div>
                {t.codigo && t.status === "entregue" && (
                  <div className="mt-1 font-mono text-sm text-kick-green">{t.codigo}</div>
                )}
                {t.status === "processando" && (
                  <div className="mt-1 text-xs text-amber-300">Aguardando confirmação dos pontos…</div>
                )}
              </div>
              <span className="rounded px-2 py-1 text-xs uppercase text-white/60">{LABEL[t.status] || t.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
