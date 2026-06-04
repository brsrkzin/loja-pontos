import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { exchangeCodeForToken, fetchKickUser } from "../../../../lib/kick";
import { createSession } from "../../../../lib/session";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const verifier = cookies().get("kp_verifier")?.value;
  const savedState = cookies().get("kp_state")?.value;

  const home = new URL("/", url.origin);

  if (!code || !verifier || !state || state !== savedState) {
    home.searchParams.set("erro", "login");
    return NextResponse.redirect(home);
  }

  try {
    const token = await exchangeCodeForToken(code, verifier);
    const user = await fetchKickUser(token.access_token);
    await createSession(user);
  } catch (e) {
    home.searchParams.set("erro", "login");
    return NextResponse.redirect(home);
  } finally {
    cookies().set("kp_verifier", "", { path: "/", maxAge: 0 });
    cookies().set("kp_state", "", { path: "/", maxAge: 0 });
  }
  return NextResponse.redirect(home);
}
