"use client";
import { useEffect, useState } from "react";
import { MOEDA } from "../config/prizes";

export default function Loja() {
  const [me, setMe] = useState(null);
  const [itens, setItens] = useState([]);
  const [aberto, setAberto] = useState(null);
  const fmt = (n) => Number(n || 0).toLocaleString("pt-BR");

  const carregar = () =>
    fetch("/api/me").then((r) => r.json()).then(setMe).catch(() => setMe({ logged: false }));
  useEffect(() => {
    carregar();
    fetch("/api/items").then((r) => r.json()).then((d) => setItens(d.itens || [])).catch(() => setItens([]));
  }, []);

  return (
    <div>
      <header className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-extrabold">Troque seus pontos por prêmios</h1>
          <p className="text-white/50">Acumule assistindo à live e resgate aqui, sem comando no chat.</p>
        </div>
        {me && me.logged ? (
          <div className="rounded-xl border border-kick-green/40 bg-kick-green/10 px-4 py-3 text-right">
            <div className="text-xs text-white/60">{me.user.name}</div>
            <div className="text-2xl font-extrabold text-kick-green">{fmt(me.points)} <span className="text-sm">{MOEDA}</span></div>
            {me.rank ? <div className="text-xs text-white/50">Ranking #{me.rank}</div> : null}
            <a href="/api/auth/logout" className="text-[11px] text-white/40 underline">sair</a>
          </div>
        ) : (
          <a href="/api/auth/login" className="rounded-xl bg-kick-green px-5 py-3 font-bold text-black hover:opacity-90">
            Entrar com o Kick
          </a>
        )}
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {itens.map((p) => {
          const podeResgatar = me && me.logged && me.points >= p.custo;
          return (
            <div key={p.id} className="flex flex-col rounded-2xl border border-white/10 bg-kick-panel p-4">
              {p.imagem ? (
                <img src={p.imagem} alt={p.nome} className="mb-3 h-36 w-full rounded-lg object-cover" />
              ) : (
                <div className="mb-3 flex h-36 w-full items-center justify-center rounded-lg bg-black/40 text-4xl">🎁</div>
              )}
              <div className="flex items-center gap-2">
                <h3 className="font-bold">{p.nome}</h3>
                <span className={`ml-auto rounded px-2 py-0.5 text-[10px] uppercase ${p.tipo === "fisico" ? "bg-amber-500/20 text-amber-300" : "bg-sky-500/20 text-sky-300"}`}>{p.tipo}</span>
              </div>
              <p className="mt-1 flex-1 text-sm text-white/50">{p.descricao}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-lg font-extrabold text-kick-green">{fmt(p.custo)} <span className="text-xs">{MOEDA}</span></span>
                <button
                  disabled={!me || !me.logged || !podeResgatar}
                  onClick={() => setAberto(p)}
                  className="rounded-lg bg-kick-green px-4 py-2 text-sm font-bold text-black disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40"
                >
                  {!me || !me.logged ? "Entre p/ resgatar" : podeResgatar ? "Resgatar" : "Sem pontos"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {aberto && (
        <ModalResgate
          item={aberto}
          usuarioKick={me?.user?.username || ""}
          onClose={() => setAberto(null)}
          onDone={() => { setAberto(null); carregar(); }}
        />
      )}
    </div>
  );
}

function ModalResgate({ item, usuarioKick, onClose, onDone }) {
  const [dados, setDados] = useState({
    nomeCompleto: "", telefone: "", email: "", endereco: "", usuarioKick,
  });
  const [carregando, setCarregando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const set = (k, v) => setDados((d) => ({ ...d, [k]: v }));

  async function confirmar() {
    setCarregando(true);
    const res = await fetch("/api/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: item.id, dados }),
    }).then((r) => r.json()).catch(() => ({ ok: false, erro: "Erro de conexão." }));
    setCarregando(false);
    setResultado(res);
  }

  const campo = (k, label, type = "text", opcional = false) => (
    <div>
      <label className="text-xs text-white/50">{label}{opcional ? " (opcional)" : ""}</label>
      <input
        type={type} value={dados[k]} onChange={(e) => set(k, e.target.value)}
        className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-kick-green"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-white/10 bg-kick-panel p-6" onClick={(e) => e.stopPropagation()}>
        {!resultado ? (
          <>
            <h3 className="text-xl font-bold">Resgatar: {item.nome}</h3>
            <p className="mt-1 text-sm text-white/50">Custo: {Number(item.custo).toLocaleString("pt-BR")} pontos</p>
            <div className="mt-4 space-y-2">
              {campo("nomeCompleto", "Nome completo")}
              {campo("telefone", "Telefone", "tel")}
              {campo("email", "Email", "email")}
              {campo("endereco", "Endereço", "text", true)}
              {campo("usuarioKick", "Usuário na Kick")}
              <p className="text-xs text-white/40">Seus dados são usados só para entregar/enviar o prêmio.</p>
            </div>
            <div className="mt-5 flex gap-2">
              <button onClick={onClose} className="flex-1 rounded-lg border border-white/15 py-2 text-sm">Cancelar</button>
              <button onClick={confirmar} disabled={carregando} className="flex-1 rounded-lg bg-kick-green py-2 text-sm font-bold text-black disabled:opacity-50">
                {carregando ? "Resgatando..." : "Confirmar"}
              </button>
            </div>
          </>
        ) : (
          <>
            <h3 className={`text-xl font-bold ${resultado.ok ? "text-kick-green" : "text-red-400"}`}>
              {resultado.ok ? "Tudo certo!" : "Ops..."}
            </h3>
            <p className="mt-2 text-sm text-white/70">{resultado.mensagem || resultado.erro}</p>
            {resultado.codigo && (
              <div className="mt-3 rounded-lg border border-kick-green/40 bg-black/40 p-3 text-center font-mono text-lg text-kick-green">
                {resultado.codigo}
              </div>
            )}
            <button onClick={onDone} className="mt-5 w-full rounded-lg bg-kick-green py-2 text-sm font-bold text-black">Fechar</button>
          </>
        )}
      </div>
    </div>
  );
}
