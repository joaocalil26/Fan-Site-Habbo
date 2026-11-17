import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { latestBadges } from "@/lib/external-badges";
import { mediaUrl } from "@/lib/site";
import ArticleShell from "@/components/ArticleShell";
export const dynamic = "force-dynamic";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; source?: string }>;
}) {
  const sp = await searchParams;
  const local = sp.source === "local";
  const page = Math.max(
    1,
    Math.min(10000, Number.isSafeInteger(Number(sp.page)) ? Number(sp.page) : 1),
  );
  const query = (sp.q || "").trim().slice(0, 100);
  const where = query ? { OR: [{ name: { contains: query } }, { code: { contains: query } }] } : {};
  const result = local
    ? await (async () => {
        const [items, total] = await Promise.all([
          prisma.emblem.findMany({
            where,
            orderBy: [{ releasedAt: "desc" }, { id: "desc" }],
            take: 24,
            skip: (page - 1) * 24,
          }),
          prisma.emblem.count({ where }),
        ]);
        return {
          items,
          total,
          page,
          hasMore: page * 24 < total,
          source: "local" as const,
          warning: undefined,
        };
      })()
    : await latestBadges({ page, take: 24, query });
  const qs = `q=${encodeURIComponent(query)}${local ? "&source=local" : ""}`;
  return (
    <ArticleShell section="Emblemas">
      <div className="listing-heading">
        <div>
          <span className="article-kicker">COLECIONE NOVAS HISTÓRIAS</span>
          <h1>Últimos emblemas</h1>
        </div>
        <form className="public-search">
          <input
            name="q"
            aria-label="Pesquisar emblemas"
            defaultValue={sp.q}
            placeholder="Nome ou código…"
          />
          {local && <input type="hidden" name="source" value="local" />}
          <button>Buscar</button>
        </form>
      </div>
      <nav className="badge-tabs">
        <Link href="/emblemas" aria-current={!local ? "page" : undefined}>
          Habbo Brasil
        </Link>
        <Link href="/emblemas?source=local" aria-current={local ? "page" : undefined}>
          Coleção IdBlet
        </Link>
      </nav>
      <p className="muted badge-attribution">
        {result.source === "habboassets" ? (
          <>
            Fonte:{" "}
            <a href="https://www.habboassets.com/api" target="_blank" rel="noopener noreferrer">
              HabboAssets
            </a>
            , hotel Habbo Brasil. Novidades do catálogo; não indica disponibilidade no Habblet nem
            emblemas grátis. Atualização da consulta a cada cinco minutos.
          </>
        ) : (
          result.warning || "Emblemas cadastrados pela administração do IdBlet."
        )}
      </p>
      <div className="catalog-grid">
        {result.items.map((e) => (
          <article className="paper catalog-card" key={e.id}>
            {mediaUrl(e.image) ? (
              <img src={mediaUrl(e.image)} alt={e.name} loading="lazy" />
            ) : (
              <span>{e.image}</span>
            )}
            <small>
              {e.code}
              {e.rarity ? ` · ${e.rarity}` : ""}
            </small>
            <h2>{e.name}</h2>
            <p>{e.description}</p>
          </article>
        ))}
      </div>
      {!result.items.length && <div className="paper">Nenhum emblema encontrado.</div>}
      <div className="pagination">
        {result.page > 1 && <Link href={`?page=${result.page - 1}&${qs}`}>← Anterior</Link>}
        {result.hasMore && <Link href={`?page=${result.page + 1}&${qs}`}>Próxima →</Link>}
      </div>
    </ArticleShell>
  );
}
