"use client";
import { useState, useEffect } from "react";

const ITEM_VAZIO = { id: "", nome: "", descricao: "", custo: 0, tipo: "digital", estoque: "", imagem: "" };

export default function Admin() {
  const [senha, setSenha] = useState("");
  const [entrou, setEntrou] = useState(false);
  const [aba, setAba] = useState("resgates");
  const [msg, setMsg] = useState("");

  async function entrar() {
    const r = await fetch(`/api/admin/redemptions?senha=${encodeURIComponent(senha)}`).then((x) => x.json());
    if (!r.ok) return setMsg("Senha incorreta.");
    setEntrou(true);
    setMsg("");
  }

  if (!entrou) {
    return (
      <div className="mx-auto max-w-sm">
        <h1 className="mb-4 text-2xl font-extrabold">Painel do streamer</h1>
        <input
          type="password" placeholder="Senha do admin" value={senha}
          onChange={(e) => setSenha(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && entrar()}
          className="mb-2 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none"
        />
        <button onClick={entrar} className="w-full rounded-lg bg-kick-green py-2 text-sm font-bold text-black">Entrar</button>
        {msg && <p className="mt-3 text-sm text-red-400">{msg}</p>}
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-4 text-3xl font-extrabold">Painel do streamer</h1>
      <div className="mb-6 flex gap-2 border-b border-white/10 text-sm">
        {[["resgates", "Resgates"], ["itens", "Itens"], ["usuarios", "Pontos por usuário"]].map(([k, t]) => (
          <button
            key={k} onClick={() => setAba(k)}
            className={`px-4 py-2 ${aba === k ? "border-b-2 border-kick-green font-bold text-kick-green" : "text-white/50"}`}
          >{t}</button>
        ))}
      </div>
      {aba === "resgates" && <Resgates senha={senha} />}
      {aba === "itens" && <Itens senha={senha} />}
      {aba === "usuarios" && <Usuarios senha={senha} />}
    </div>
  );
}

function Resgates({ senha }) {
  const [lista, setLista] = useState(null);
  async function carregar() {
    const r = await fetch(`/api/admin/redemptions?senha=${encodeURIComponent(senha)}`).then((x) => x.json());
    setLista(r.resgates || []);
  }
  useEffect(() => { carregar(); }, []);
  return (
    <div>
      <div className="mb-4 flex gap-2">
        <button onClick={carregar} className="rounded-lg border border-white/15 px-4 py-2 text-sm">Atualizar</button>
        <a href={`/api/admin/export?senha=${encodeURIComponent(senha)}`}
           className="rounded-lg bg-kick-green px-4 py-2 text-sm font-bold text-black">Exportar CSV / planilha</a>
      </div>
      {!lista || lista.length === 0 ? (
        <p className="text-white/50">Nenhum resgate ainda (ou Upstash não configurado).</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-left text-xs">
            <thead className="bg-kick-panel text-white/60">
              <tr>
                {["Data", "Usuário Kick", "Item", "Pts", "Tipo", "Status", "Nome", "Telefone", "Email", "Endereço", "Código"].map((h) => (
                  <th key={h} className="px-3 py-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lista.map((t, i) => {
                const d = t.dados || {};
                return (
                  <tr key={i} className="border-t border-white/5">
                    <td className="px-3 py-2 whitespace-nowrap">{new Date(t.ts).toLocaleString("pt-BR")}</td>
                    <td className="px-3 py-2">{t.username}</td>
                    <td className="px-3 py-2">{t.premioNome}</td>
                    <td className="px-3 py-2">{t.custo}</td>
                    <td className="px-3 py-2">{t.tipo}</td>
                    <td className="px-3 py-2">{t.status}</td>
                    <td className="px-3 py-2">{d.nomeCompleto}</td>
                    <td className="px-3 py-2">{d.telefone}</td>
                    <td className="px-3 py-2">{d.email}</td>
                    <td className="px-3 py-2">{d.endereco}</td>
                    <td className="px-3 py-2 font-mono text-kick-green">{t.codigo || ""}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Itens({ senha }) {
  const [itens, setItens] = useState(null);
  const [form, setForm] = useState(ITEM_VAZIO);
  const [codItem, setCodItem] = useState("");
  const [codigos, setCodigos] = useState("");
  const [msg, setMsg] = useState("");

  async function carregar() {
    const r = await fetch("/api/admin/items").then((x) => x.json());
    setItens(r.itens || []);
  }
  useEffect(() => { carregar(); }, []);

  async function salvar() {
    const r = await fetch("/api/admin/items", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senha, item: form }),
    }).then((x) => x.json());
    if (!r.ok) return setMsg(r.erro || "Erro ao salvar.");
    setItens(r.itens); setForm(ITEM_VAZIO); setMsg("Item salvo.");
  }
  async function remover(id) {
    const r = await fetch("/api/admin/items", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senha, id }),
    }).then((x) => x.json());
    if (r.ok) setItens(r.itens);
  }
  async function abastecer() {
    const lista = codigos.split("\n").map((c) => c.trim()).filter(Boolean);
    const r = await fetch("/api/admin/codes", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senha, premioId: codItem, codigos: lista }),
    }).then((x) => x.json());
    if (!r.ok) return setMsg("Erro ao abastecer (Upstash configurado?).");
    setMsg(`Adicionados ${r.adicionados} código(s). Estoque: ${r.totalEmEstoque}.`);
    setCodigos("");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <h2 className="mb-3 font-bold">Itens da loja</h2>
        <div className="space-y-2">
          {(itens || []).map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-kick-panel p-3 text-sm">
              <div>
                <div className="font-bold">{p.nome} <span className="text-white/40">· {Number(p.custo).toLocaleString("pt-BR")} pts</span></div>
                <div className="text-xs text-white/50">{p.tipo} · estoque: {p.estoque == null ? "∞" : p.estoque} · id: {p.id}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setForm({ ...ITEM_VAZIO, ...p, estoque: p.estoque == null ? "" : p.estoque })}
                        className="rounded border border-white/15 px-2 py-1 text-xs">Editar</button>
                <button onClick={() => remover(p.id)} className="rounded bg-red-500/20 px-2 py-1 text-xs text-red-300">Remover</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-bold">Criar / editar item</h2>
        <div className="space-y-2 rounded-xl border border-white/10 bg-kick-panel p-4 text-sm">
          <Inp label="ID (sem espaços)" v={form.id} on={(v) => setForm({ ...form, id: v })} />
          <Inp label="Nome" v={form.nome} on={(v) => setForm({ ...form, nome: v })} />
          <Inp label="Descrição" v={form.descricao} on={(v) => setForm({ ...form, descricao: v })} />
          <Inp label="Custo (pontos)" type="number" v={form.custo} on={(v) => setForm({ ...form, custo: v })} />
          <div>
            <label className="text-xs text-white/50">Tipo</label>
            <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                    className="w-full rounded-lg bg-black/40 px-3 py-2">
              <option value="digital">digital (entrega código)</option>
              <option value="fisico">fisico (envio)</option>
            </select>
          </div>
          <Inp label="Estoque (vazio = ilimitado)" type="number" v={form.estoque} on={(v) => setForm({ ...form, estoque: v })} />
          <Inp label="URL da imagem (opcional)" v={form.imagem} on={(v) => setForm({ ...form, imagem: v })} />
          <button onClick={salvar} className="w-full rounded-lg bg-kick-green py-2 font-bold text-black">Salvar item</button>
          {msg && <p className="text-xs text-kick-green">{msg}</p>}
        </div>

        <h2 className="mb-2 mt-6 font-bold">Abastecer códigos (itens digitais)</h2>
        <div className="space-y-2 rounded-xl border border-white/10 bg-kick-panel p-4 text-sm">
          <select value={codItem} onChange={(e) => setCodItem(e.target.value)} className="w-full rounded-lg bg-black/40 px-3 py-2">
            <option value="">Escolha o item...</option>
            {(itens || []).filter((p) => p.tipo === "digital").map((p) => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
          <textarea rows={4} placeholder="Um código por linha" value={codigos}
                    onChange={(e) => setCodigos(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2" />
          <button onClick={abastecer} disabled={!codItem} className="rounded-lg bg-kick-green px-4 py-2 font-bold text-black disabled:opacity-50">Adicionar ao estoque</button>
        </div>
      </div>
    </div>
  );
}

function Usuarios({ senha }) {
  const [lista, setLista] = useState([]);
  const [busca, setBusca] = useState("");
  async function carregar() {
    const r = await fetch(`/api/admin/users?senha=${encodeURIComponent(senha)}&busca=${encodeURIComponent(busca)}`).then((x) => x.json());
    setLista(r.usuarios || []);
  }
  return (
    <div>
      <div className="mb-4 flex gap-2">
        <input placeholder="Buscar usuário..." value={busca} onChange={(e) => setBusca(e.target.value)}
               onKeyDown={(e) => e.key === "Enter" && carregar()}
               className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none" />
        <button onClick={carregar} className="rounded-lg bg-kick-green px-4 py-2 text-sm font-bold text-black">Buscar</button>
      </div>
      <div className="overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-kick-panel text-white/60">
            <tr><th className="px-4 py-2">#</th><th className="px-4 py-2">Usuário</th><th className="px-4 py-2 text-right">Pontos</th><th className="px-4 py-2 text-right">Mensagens</th></tr>
          </thead>
          <tbody>
            {lista.map((v, i) => (
              <tr key={i} className="border-t border-white/5">
                <td className="px-4 py-2 text-white/40">{v.rank ?? i + 1}</td>
                <td className="px-4 py-2 font-medium">{v.viewerKickUsername}</td>
                <td className="px-4 py-2 text-right font-bold text-kick-green">{(v.points || 0).toLocaleString("pt-BR")}</td>
                <td className="px-4 py-2 text-right text-white/50">{v.messagesSent ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {lista.length === 0 && <p className="mt-3 text-sm text-white/50">Clique em Buscar para listar (deixe vazio para o top geral).</p>}
    </div>
  );
}

function Inp({ label, v, on, type = "text" }) {
  return (
    <div>
      <label className="text-xs text-white/50">{label}</label>
      <input type={type} value={v} onChange={(e) => on(e.target.value)}
             className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 outline-none focus:border-kick-green" />
    </div>
  );
}
