import { NextResponse } from "next/server";
import { getSession } from "../../../lib/session";
import { availablePoints } from "../../../lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ logged: false });
  let points = 0, rank = null;
  try {
    const p = await availablePoints(user.username);
    points = p.available;
    rank = p.rank;
  } catch {}
  return NextResponse.json({
    logged: true,
    user: { username: user.username, name: user.name, picture: user.picture },
    points,
    rank,
  });
}
