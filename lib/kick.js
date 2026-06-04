// Login com a conta do Kick via OAuth 2.1 + PKCE.
// Docs: https://dev.kick.com  | OAuth em https://id.kick.com | API em https://api.kick.com
import crypto from "crypto";

const AUTH_URL = "https://id.kick.com/oauth/authorize";
const TOKEN_URL = "https://id.kick.com/oauth/token";
const USER_URL = "https://api.kick.com/public/v1/users";
const SCOPES = "user:read channel:read";

function base64url(buf) {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Gera code_verifier + code_challenge (PKCE) e um state anti-CSRF.
export function createPkce() {
  const verifier = base64url(crypto.randomBytes(32));
  const challenge = base64url(crypto.createHash("sha256").update(verifier).digest());
  const state = base64url(crypto.randomBytes(16));
  return { verifier, challenge, state };
}

export function buildAuthorizeUrl(challenge, state) {
  const p = new URLSearchParams({
    response_type: "code",
    client_id: process.env.KICK_CLIENT_ID,
    redirect_uri: process.env.KICK_REDIRECT_URI,
    scope: SCOPES,
    code_challenge: challenge,
    code_challenge_method: "S256",
    state,
  });
  return `${AUTH_URL}?${p.toString()}`;
}

export async function exchangeCodeForToken(code, verifier) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: process.env.KICK_CLIENT_ID,
    client_secret: process.env.KICK_CLIENT_SECRET,
    redirect_uri: process.env.KICK_REDIRECT_URI,
    code_verifier: verifier,
    code,
  });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`Token exchange falhou: ${res.status} ${await res.text()}`);
  return res.json(); // { access_token, refresh_token, ... }
}

export async function fetchKickUser(accessToken) {
  const res = await fetch(USER_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Falha ao buscar usuário: ${res.status} ${await res.text()}`);
  const json = await res.json();
  const u = (json.data && json.data[0]) || {};
  return {
    userId: u.user_id,
    username: u.name, // login/slug usado pelo Kicklet
    name: u.name,
    picture: u.profile_picture || "",
  };
}
