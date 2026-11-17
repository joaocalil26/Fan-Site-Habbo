import Link from "next/link";
import type { ContentKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { mediaUrl } from "@/lib/site";
import ArticleShell from "./ArticleShell";
import RichContent from "./RichContent";
export default async function EntryListing({
  kind,
  title,
  base,
  search,
}: {
  kind: ContentKind;
  title: string;
  base: string;
  search: { q?: string; page?: string };
}) {
  const page = Math.max(1, Math.min(10000, Number(search.page) || 1));
  const rows = await prisma.contentEntry.findMany({
    where: {
      kind,
      published: true,
      ...(search.q ? { title: { contains: search.q.slice(0, 100) } } : {}),
    },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    take: 13,
    skip: (page - 1) * 12,
  });
  return (
    <ArticleShell section={title}>
      <div className="listing-heading">
        <div>
          <span className="article-kicker">COMUNIDADE IDBLET</span>
          <h1>{title}</h1>
        </div>
        <form className="public-search">
          <input
            name="q"
            aria-label={`Pesquisar ${title}`}
            placeholder="Pesquisar…"
            defaultValue={search.q}
          />
          <button>Buscar</button>
        </form>
      </div>
      <div className="entry-grid">
        {rows.slice(0, 12).map((row) =>
          kind === "TEAM" ? (
            <article className="paper team-card" key={row.id}>
              {mediaUrl(row.image) && <img src={mediaUrl(row.image)} alt="" />}
              <h2>{row.title}</h2>
              <p className="muted">{row.excerpt}</p>
              <RichContent content={row.content} />
            </article>
          ) : (
            <Link href={`/${base}/${row.slug}`} className="paper entry-list-card" key={row.id}>
              {mediaUrl(row.image) ? (
                <img src={mediaUrl(row.image)} alt="" />
              ) : (
                <div className="entry-placeholder">IdBlet</div>
              )}
              <span className="article-kicker">{kind === "EVENT" ? row.status : title}</span>
              <h2>{row.title}</h2>
              <p>{row.excerpt}</p>
              <small>Ver publicação →</small>
            </Link>
          ),
        )}
      </div>
      {!rows.length && (
        <div className="paper empty-state">
          <h2>Ainda não há publicações por aqui.</h2>
          <p>Acompanhe as próximas novidades do IdBlet.</p>
        </div>
      )}
      <div className="pagination">
        {page > 1 && (
          <Link href={`?page=${page - 1}&q=${encodeURIComponent(search.q || "")}`}>← Anterior</Link>
        )}
        {rows.length > 12 && (
          <Link href={`?page=${page + 1}&q=${encodeURIComponent(search.q || "")}`}>Próxima →</Link>
        )}
      </div>
    </ArticleShell>
  );
}
