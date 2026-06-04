import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createPkce, buildAuthorizeUrl } from "../../../../lib/kick";

export const dynamic = "force-dynamic";

export async function GET() {
  const { verifier, challenge, state } = createPkce();
  const opts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  };
  cookies().set("kp_verifier", verifier, opts);
  cookies().set("kp_state", state, opts);
  return NextResponse.redirect(buildAuthorizeUrl(challenge, state));
}
