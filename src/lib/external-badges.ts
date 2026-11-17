import { prisma } from "@/lib/prisma";
import { mediaUrl } from "@/lib/site";

export const BADGES_ENDPOINT = "https://www.habboassets.com/api/v2/badges";
export type CatalogBadge = {
  id: string;
  code: string;
  name: string;
  description: string;
  image: string;
  rarity: string | null;
  releasedAt: string | null;
  discoveredAt: string | null;
};
export type BadgesPage = {
  items: CatalogBadge[];
  total: number;
  page: number;
  hasMore: boolean;
  nextCursor: string | null;
  source: "habboassets" | "local";
  hotel: "com.br";
  warning?: string;
};
export function parseBadges(payload: unknown): { items: CatalogBadge[]; total: number } {
  if (
    !payload ||
    typeof payload !== "object" ||
    !("data" in payload) ||
    !Array.isArray(payload.data)
  )
    throw new Error("Resposta inválida do catálogo de emblemas.");
  const items = payload.data.flatMap((value: unknown): CatalogBadge[] => {
    if (!value || typeof value !== "object") return [];
    const row = value as Record<string, unknown>;
    if (typeof row.code !== "string" || !/^[a-z0-9_-]{1,80}$/i.test(row.code)) return [];
    const image =
      mediaUrl(typeof row.image_png === "string" ? row.image_png : "") ||
      mediaUrl(typeof row.image === "string" ? row.image : "");
    if (!image) return [];
    return [
      {
        id: `ha-br-${row.code}`,
        code: row.code,
        name: typeof row.name === "string" && row.name ? row.name : row.code,
        description: typeof row.description === "string" ? row.description : "",
        image,
        rarity: null,
        releasedAt: null,
        discoveredAt: typeof row.found === "string" ? row.found : null,
      },
    ];
  });
  const meta =
    "meta" in payload && payload.meta && typeof payload.meta === "object"
      ? (payload.meta as Record<string, unknown>)
      : {};
  const total = Number(meta.total ?? items.length);
  return { items, total: Number.isSafeInteger(total) && total >= 0 ? total : items.length };
}
export async function latestBadges({
  page = 1,
  take = 6,
  query = "",
}: { page?: number; take?: number; query?: string } = {}): Promise<BadgesPage> {
  page = Number.isSafeInteger(page) ? Math.max(1, Math.min(10000, page)) : 1;
  take = Number.isSafeInteger(take) ? Math.max(1, Math.min(50, take)) : 6;
  query = query.trim().slice(0, 100);
  try {
    const url = new URL(BADGES_ENDPOINT);
    url.searchParams.set("hotel", "com.br");
    url.searchParams.set("limit", String(take));
    url.searchParams.set("offset", String((page - 1) * take));
    url.searchParams.set("order", "desc");
    if (query) url.searchParams.set("term", query);
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error("Catálogo indisponível.");
    const result = parseBadges(await response.json());
    const hasMore = page * take < result.total;
    return {
      ...result,
      page,
      hasMore,
      nextCursor: hasMore ? `ha:${page + 1}` : null,
      source: "habboassets",
      hotel: "com.br",
    };
  } catch {
    const where = query
      ? { OR: [{ name: { contains: query } }, { code: { contains: query } }] }
      : {};
    const [rows, total] = await Promise.all([
      prisma.emblem.findMany({
        where,
        orderBy: [{ releasedAt: "desc" }, { id: "desc" }],
        take,
        skip: (page - 1) * take,
      }),
      prisma.emblem.count({ where }),
    ]);
    const hasMore = page * take < total;
    return {
      items: rows.map((row) => ({
        id: row.id,
        code: row.code,
        name: row.name,
        description: row.description || "",
        image: row.image,
        rarity: row.rarity,
        releasedAt: row.releasedAt.toISOString(),
        discoveredAt: null,
      })),
      total,
      page,
      hasMore,
      nextCursor: hasMore ? `ha:${page + 1}` : null,
      source: "local",
      hotel: "com.br",
      warning: "HabboAssets indisponível. Exibindo os emblemas cadastrados no IdBlet.",
    };
  }
}
