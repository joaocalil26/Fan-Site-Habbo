import { NextRequest, NextResponse } from "next/server";
import { fetchEmblemsPage } from "@/lib/data";
import { latestBadges } from "@/lib/external-badges";

const RARITIES = new Set(["COMUM", "RARO", "EPICO", "LENDARIO"]);

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const cursor = sp.get("cursor");
  const take = sp.get("take") ? Number(sp.get("take")) : 24;
  const rarityRaw = sp.get("rarity")?.toUpperCase();
  const rarity =
    rarityRaw && RARITIES.has(rarityRaw)
      ? (rarityRaw as "COMUM" | "RARO" | "EPICO" | "LENDARIO")
      : undefined;

  // Preserve local cursors and rarity filters used by the existing collection.
  if (sp.get("source") !== "local" && !rarity && (!cursor || /^ha:\d+$/.test(cursor))) {
    const result = await latestBadges({
      page: Number(cursor?.slice(3) || sp.get("page") || 1),
      take,
      query: sp.get("q") || "",
    });
    return NextResponse.json(result, {
      headers: {
        "Cache-Control":
          result.source === "habboassets"
            ? "public, s-maxage=300, stale-while-revalidate=600"
            : "no-store",
      },
    });
  }

  try {
    const page = await fetchEmblemsPage({ cursor, take, rarity });
    const items = page.items.map((e) => ({
      ...e,
      releasedAt: e.releasedAt instanceof Date ? e.releasedAt.toISOString() : String(e.releasedAt),
    }));
    return NextResponse.json(
      { items, nextCursor: page.nextCursor, hasMore: page.hasMore, source: "local" },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      },
    );
  } catch (e) {
    console.error("[api/emblemas]", e);
    return NextResponse.json({ error: "Falha ao carregar emblemas" }, { status: 500 });
  }
}
