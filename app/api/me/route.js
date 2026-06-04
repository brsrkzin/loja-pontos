import { NextResponse } from "next/server";
import { getSession } from "../../../lib/session";
import { getViewerPoints } from "../../../lib/kicklet";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ logged: false });
  let points = 0,
    rank = null;
  try {
    const p = await getViewerPoints(user.username);
    points = p.points;
    rank = p.rank;
  } catch {
    // se o Kicklet falhar, retorna 0 sem quebrar a página
  }
  return NextResponse.json({
    logged: true,
    user: { username: user.username, name: user.name, picture: user.picture },
    points,
    rank,
  });
}
