import { prisma } from "@/lib/prisma";
import { mediaUrl } from "@/lib/site";
export const FURNITURE_FEED =
  "https://www.habboassets.com/api/v2/feed?category=furniture&page=1&per_page=100";
export type CatalogFurniture = {
  id: string;
  name: string;
  classname: string;
  image: string;
  discoveredAt: string | null;
};
export function parseFurnitureFeed(payload: unknown): CatalogFurniture[] {
  if (
    !payload ||
    typeof payload !== "object" ||
    !("data" in payload) ||
    !Array.isArray(payload.data)
  )
    throw new Error("Feed de mobis inválido.");
  const seen = new Set<string>();
  return payload.data.flatMap((value: unknown): CatalogFurniture[] => {
    if (!value || typeof value !== "object") return [];
    const row = value as Record<string, unknown>;
    if (
      row.type !== "furni_added" ||
      row.hotel !== "habbo.com.br" ||
      typeof row.subject !== "string" ||
      !/^[a-z0-9_.*-]{1,140}$/i.test(row.subject) ||
      seen.has(row.subject)
    )
      return [];
    const detail =
      row.data && typeof row.data === "object" ? (row.data as Record<string, unknown>) : {};
    const name =
      typeof detail.name === "string" && detail.name !== `${row.subject} name`
        ? detail.name
        : row.subject;
    const image =
      mediaUrl(typeof row.image === "string" ? row.image : "") ||
      `https://www.habboassets.com/imaging/furniture/${encodeURIComponent(row.subject)}.png?size=64`;
    seen.add(row.subject);
    return [
      {
        id: `ha-furni-${row.subject}`,
        name,
        classname: row.subject,
        image,
        discoveredAt: typeof row.occurred_at === "string" ? row.occurred_at : null,
      },
    ];
  });
}
export async function latestFurniture({
  take = 6,
  query = "",
}: { take?: number; query?: string } = {}) {
  take = Number.isSafeInteger(take) ? Math.max(1, Math.min(50, take)) : 6;
  query = query.trim().slice(0, 100).toLocaleLowerCase("pt-BR");
  try {
    const response = await fetch(FURNITURE_FEED, {
      headers: { Accept: "application/json", "X-Hotel-ID": "2" },
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error("Feed indisponível.");
    const rows = parseFurnitureFeed(await response.json()).filter(
      (item) =>
        !query || `${item.name} ${item.classname}`.toLocaleLowerCase("pt-BR").includes(query),
    );
    return {
      items: rows.slice(0, take),
      total: rows.length,
      source: "habboassets" as const,
      scope: "recent-feed" as const,
      hotel: "com.br" as const,
    };
  } catch {
    const rows = await prisma.mobi.findMany({
      where: query ? { name: { contains: query } } : {},
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 50,
    });
    const items = rows
      .filter((row) => !!mediaUrl(row.image))
      .map((row) => ({
        id: row.id,
        name: row.name,
        classname: "",
        image: row.image,
        discoveredAt: null,
      }));
    return {
      items: items.slice(0, take),
      total: items.length,
      source: "local" as const,
      scope: "recent-feed" as const,
      hotel: "com.br" as const,
      warning: "O feed está indisponível. Exibindo apenas mobis locais com imagens válidas.",
    };
  }
}
