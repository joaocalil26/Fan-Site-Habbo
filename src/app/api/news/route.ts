import { NextRequest, NextResponse } from "next/server";
import { fetchNewsPage } from "@/lib/data";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const cursor = sp.get("cursor");
  const take = sp.get("take") ? Number(sp.get("take")) : 12;
  const category = sp.get("category") ?? undefined;
  const orderBy = sp.get("orderBy") === "popular" ? "popular" : "recent";

  try {
    const page = await fetchNewsPage({ cursor, take, category, orderBy });
    const items = page.items.map((i) => ({
      ...i,
      publishedAt:
        i.publishedAt instanceof Date ? i.publishedAt.toISOString() : String(i.publishedAt),
    }));
    return NextResponse.json(
      { items, nextCursor: page.nextCursor, hasMore: page.hasMore },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      },
    );
  } catch (e) {
    console.error("[api/news]", e);
    return NextResponse.json({ error: "Falha ao carregar notícias" }, { status: 500 });
  }
}
