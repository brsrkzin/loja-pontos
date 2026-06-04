// Persistência (Upstash Redis). Guarda catálogo, resgates e estoque de códigos.
// Sem Upstash, o site funciona em modo limitado: usa o catálogo padrão
// (config/prizes.js), não guarda histórico e não entrega códigos automáticos.
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
  try {
    return JSON.parse(v);
  } catch {
    return fallback;
  }
}

// ---------------- Catálogo de itens ----------------
// Item: { id, nome, descricao, custo, tipo: "digital"|"fisico", estoque, imagem }
export async function getCatalogo() {
  if (!redis) return CATALOGO_PADRAO;
  const v = await redis.get("catalogo");
  const lista = parse(v, null);
  if (!lista || !Array.isArray(lista) || lista.length === 0) {
    await redis.set("catalogo", JSON.stringify(CATALOGO_PADRAO));
    return CATALOGO_PADRAO;
  }
  return lista;
}

export async function getItem(id) {
  const lista = await getCatalogo();
  return lista.find((p) => p.id === id) || null;
}

export async function salvarItem(item) {
  if (!redis) throw new Error("Sem armazenamento: configure o Upstash para editar itens.");
  const lista = await getCatalogo();
  const idx = lista.findIndex((p) => p.id === item.id);
  if (idx >= 0) lista[idx] = { ...lista[idx], ...item };
  else lista.push(item);
  await redis.set("catalogo", JSON.stringify(lista));
  return lista;
}

export async function removerItem(id) {
  if (!redis) throw new Error("Sem armazenamento: configure o Upstash para remover itens.");
  const lista = (await getCatalogo()).filter((p) => p.id !== id);
  await redis.set("catalogo", JSON.stringify(lista));
  return lista;
}

// ---------------- Estoque de códigos digitais ----------------
export async function popDigitalCode(itemId) {
  if (!redis) return null;
  const code = await redis.lpop(`codes:${itemId}`);
  return code || null;
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

// ---------------- Log de resgates ----------------
export async function logRedemption(entry) {
  if (!redis) return;
  await redis.lpush("redemptions", JSON.stringify({ ...entry, ts: Date.now() }));
  await redis.ltrim("redemptions", 0, 4999);
}
export async function listRedemptions(limit = 1000) {
  if (!redis) return [];
  const raw = await redis.lrange("redemptions", 0, limit - 1);
  return raw.map((r) => parse(r, {}));
}

// ---------------- Estoque (contador) por item ----------------
export async function decStock(itemId) {
  if (!redis) return null;
  return await redis.incrby(`stock:${itemId}`, -1);
}
export async function getStockUsed(itemId) {
  if (!redis) return 0;
  const v = await redis.get(`stock:${itemId}`);
  return v ? Math.abs(Number(v)) : 0;
}
