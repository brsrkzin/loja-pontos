import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Endpoint TEMPORÁRIO de diagnóstico. Remover depois.
export async function GET() {
  const channelId = process.env.KICKLET_CHANNEL_ID || "";
  const token = process.env.KICKLET_API_TOKEN || "";
  const url = `https://kicklet.app/api/stats/${channelId}/viewer/ranking?page=1&pageSize=3&orderBy=points&order=desc`;
  const out = {
    channelIdSet: channelId.length,
    tokenLen: token.length,
    upstash: !!process.env.UPSTASH_REDIS_REST_URL,
  };
  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `apitoken ${token}`,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "application/json",
      },
      cache: "no-store",
    });
    const text = await res.text();
    out.status = res.status;
    out.bodyStart = text.slice(0, 300);
  } catch (e) {
    out.fetchError = String(e);
  }
  return NextResponse.json(out);
}
