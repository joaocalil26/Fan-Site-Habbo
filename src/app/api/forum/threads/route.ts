import { NextRequest, NextResponse } from "next/server";
import { fetchThreadsPage } from "@/lib/data";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const cursor = sp.get("cursor");
  const take = sp.get("take") ? Number(sp.get("take")) : 20;
  const categorySlug = sp.get("category") ?? undefined;

  try {
    const page = await fetchThreadsPage({ cursor, take, categorySlug });
    const items = page.items.map((t) => ({
      ...t,
      lastPostAt: t.lastPostAt instanceof Date ? t.lastPostAt.toISOString() : String(t.lastPostAt),
    }));
    return NextResponse.json(
      { items, nextCursor: page.nextCursor, hasMore: page.hasMore },
      {
        headers: {
          "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30",
        },
      },
    );
  } catch (e) {
    console.error("[api/forum/threads]", e);
    return NextResponse.json({ error: "Falha ao carregar tópicos" }, { status: 500 });
  }
}
