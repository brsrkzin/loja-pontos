// Integração com a API do Kicklet (o "banco de pontos").
// Docs: https://kicklet.app/docs/api-token.html
const BASE = "https://kicklet.app/api";

function headers() {
  // User-Agent de navegador para evitar bloqueio de bot (Cloudflare) ao
  // chamar a API do Kicklet a partir do servidor (Vercel).
  return {
    Authorization: `apitoken ${process.env.KICKLET_API_TOKEN}`,
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    Accept: "application/json",
  };
}

function channelId() {
  return process.env.KICKLET_CHANNEL_ID;
}

// Lê o saldo de pontos (e dados) de um viewer pelo username.
export async function getViewerPoints(username) {
  const url =
    `${BASE}/stats/${channelId()}/viewer/ranking` +
    `?page=1&pageSize=1&orderBy=watchtime&order=desc&search=${encodeURIComponent(username)}`;
  const res = await fetch(url, { headers: headers(), cache: "no-store" });
  if (!res.ok) throw new Error(`Kicklet ranking falhou: ${res.status}`);
  const json = await res.json();
  const match = (json.ranking || []).find(
    (v) => (v.viewerKickUsername || "").toLowerCase() === username.toLowerCase()
  );
  if (!match) return { points: 0, watchTime: 0, rank: null, found: false };
  return {
    points: match.points || 0,
    watchTime: match.watchTime || 0,
    rank: match.rank ?? null,
    found: true,
  };
}

// Remove pontos de um viewer (usado no resgate).
export async function removePoints(username, points) {
  const url = `${BASE}/stats/${channelId()}/points/${encodeURIComponent(username)}/remove/${points}`;
  const res = await fetch(url, { method: "PATCH", headers: headers() });
  if (!res.ok) throw new Error(`Kicklet remove pontos falhou: ${res.status}`);
  return true;
}

// Adiciona pontos (útil para devolver em caso de erro / estornos).
export async function addPoints(username, points) {
  const url = `${BASE}/stats/${channelId()}/points/${encodeURIComponent(username)}/add/${points}`;
  const res = await fetch(url, { method: "PATCH", headers: headers() });
  if (!res.ok) throw new Error(`Kicklet add pontos falhou: ${res.status}`);
  return true;
}

// Ranking (top viewers) para a página de ranking e o painel.
// Aceita uma busca opcional por nome de usuário.
export async function getRanking(pageSize = 20, busca = "") {
  let url =
    `${BASE}/stats/${channelId()}/viewer/ranking` +
    `?page=1&pageSize=${pageSize}&orderBy=points&order=desc`;
  if (busca) url += `&search=${encodeURIComponent(busca)}`;
  const res = await fetch(url, { headers: headers(), cache: "no-store" });
  if (!res.ok) throw new Error(`Kicklet ranking falhou: ${res.status}`);
  const json = await res.json();
  return json.ranking || [];
}
