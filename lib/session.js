// Sessão do usuário guardada num cookie assinado (JWT via jose).
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE = "kp_session";
const secret = () =>
  new TextEncoder().encode(process.env.SESSION_SECRET || "dev-secret-troque-isto");

export async function createSession(user) {
  const token = await new SignJWT(user)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
  cookies().set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function getSession() {
  const c = cookies().get(COOKIE);
  if (!c) return null;
  try {
    const { payload } = await jwtVerify(c.value, secret());
    return payload; // { userId, username, name, picture }
  } catch {
    return null;
  }
}

export function clearSession() {
  cookies().set(COOKIE, "", { path: "/", maxAge: 0 });
}
