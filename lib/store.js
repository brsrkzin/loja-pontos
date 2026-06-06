import { Redis } from "@upstash/redis";
import { PREMIOS as CATALOGO_PADRAO } from "../config/prizes";

let redis = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}
export const hasStorage = () => redis !== null;

function parse(v, fallback) {
  if (v == null) return fallback;
  if (typeof v === "object") return v;
  try { return JSON.parse(v); } catch { return fallback; }
}

// ---------------- Catálogo ----------------
export async function getCatalogo() {
  if (!redis) return CATALOGO_PADRAO;
  const lista = parse(await redis.get("catalogo"), null);
  if (!lista || !Array.isArray(lista) || lista.length === 0) {
    await redis.set("catalogo", JSON.stringify(CATALOGO_PADRAO));
    return CATALOGO_PADRAO;
  }
  return lista;
}
export async function getItem(id) {
  return (await getCatalogo()).find((p) => p.id === id) || null;
}
export async function salvarItem(item) {
  if (!redis) throw new Error("Configure o Upstash para editar itens.");
  const lista = await getCatalogo();
  const i = lista.findIndex((p) => p.id === item.id);
  if (i >= 0) lista[i] = { ...lista[i], ...item }; else lista.push(item);
  await redis.set("catalogo", JSON.stringify(lista));
  return lista;
}
export async function removerItem(id) {
  if (!redis) throw new Error("Configure o Upstash para remover itens.");
  const lista = (await getCatalogo()).filter((p) => p.id !== id);
  await redis.set("catalogo", JSON.stringify(lista));
  return lista;
}

// ---------------- Códigos digitais ----------------
export async function popDigitalCode(itemId) {
  if (!redis) return null;
  return (await redis.lpop(`codes:${itemId}`)) || null;
}
export async function returnDigitalCode(itemId, code) {
  if (redis && code) await redis.rpush(`codes:${itemId}`, code);
}
export async function pushDigitalCodes(itemId, codes) {
  if (!redis || !codes.length) return 0;
  await redis.rpush(`codes:${itemId}`, ...codes);
  return codes.length;
}
export async function countDigitalCodes(itemId) {
  if (!redis) return 0;
  return (await redis.llen(`codes:${itemId}`)) || 0;
}

// ---------------- Cache de pontos (escrito pelo relay) ----------------
export async function setRankingCache(ranking) {
  if (!redis) return;
  await redis.set("rankingCache", JSON.stringify(ranking || []));
  await redis.set("rankingSyncedAt", Date.now());
}
export async function getRankingCache() {
  if (!redis) return { ranking: [], syncedAt: 0 };
  return {
    ranking: parse(await redis.get("rankingCache"), []),
    syncedAt: Number(await redis.get("rankingSyncedAt")) || 0,
  };
}
export async function findCachedViewer(username) {
  const { ranking } = await getRankingCache();
  const u = (username || "").toLowerCase();
  return ranking.find((v) => (v.viewerKickUsername || "").toLowerCase() === u) || null;
}
export async function availablePoints(username) {
  const v = await findCachedViewer(username);
  const base = v ? v.points || 0 : 0;
  const reserved = await sumPendingForUser(username);
  return { points: base, available: base - reserved, found: !!v, rank: v ? v.rank : null };
}

// ---------------- Resgates (hash) ----------------
export async function saveRedemption(entry) {
  if (!redis) return entry;
  await redis.hset("redemptions", { [entry.id]: JSON.stringify(entry) });
  return entry;
}
export async function getRedemption(id) {
  if (!redis) return null;
  return parse(await redis.hget("redemptions", id), null);
}
export async function updateRedemption(id, patch) {
  if (!redis) return null;
  const cur = await getRedemption(id);
  if (!cur) return null;
  const next = { ...cur, ...patch };
  await redis.hset("redemptions", { [id]: JSON.stringify(next) });
  return next;
}
export async function listRedemptions() {
  if (!redis) return [];
  const all = await redis.hgetall("redemptions");
  if (!all) return [];
  return Object.values(all).map((r) => parse(r, {})).sort((a, b) => (b.ts || 0) - (a.ts || 0));
}

// ---------------- Fila pendente (processada pelo relay) ----------------
export async function addPending(id) {
  if (redis) await redis.rpush("pending", id);
}
export async function listPendingIds() {
  if (!redis) return [];
  return (await redis.lrange("pending", 0, 199)) || [];
}
export async function removePending(id) {
  if (redis) await redis.lrem("pending", 0, id);
}
export async function sumPendingForUser(username) {
  if (!redis) return 0;
  const ids = await listPendingIds();
  if (!ids.length) return 0;
  const u = (username || "").toLowerCase();
  let total = 0;
  for (const id of ids) {
    const r = await getRedemption(id);
    if (r && (r.username || "").toLowerCase() === u && r.status === "processando")
      total += r.custo || 0;
  }
  return total;
}
