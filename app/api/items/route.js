import { NextResponse } from "next/server";
import { getCatalogo } from "../../../lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ itens: await getCatalogo() });
  } catch {
    return NextResponse.json({ itens: [] });
  }
}
