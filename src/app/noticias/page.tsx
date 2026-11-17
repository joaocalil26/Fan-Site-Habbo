import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { mediaUrl } from "@/lib/site";
import ArticleShell from "@/components/ArticleShell";
export const dynamic = "force-dynamic";
export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categoria?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Math.min(10000, Number(sp.page) || 1));
  const where = {
    published: true,
    publishedAt: { lte: new Date() },
    ...(sp.q ? { title: { contains: sp.q.slice(0, 100) } } : {}),
    ...(sp.categoria ? { category: sp.categoria } : {}),
  };
  const [news, categories] = await Promise.all([
    prisma.news.findMany({
      where,
      orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
      take: 13,
      skip: (page - 1) * 12,
    }),
    prisma.news.findMany({
      where: { published: true, publishedAt: { lte: new Date() } },
      distinct: ["category"],
      select: { category: true },
    }),
  ]);
  const qs = `q=${encodeURIComponent(sp.q || "")}&categoria=${encodeURIComponent(sp.categoria || "")}`;
  return (
    <ArticleShell section="Notícias">
      <div className="listing-heading">
        <div>
          <span className="article-kicker">FIQUE POR DENTRO</span>
          <h1>Notícias recentes</h1>
        </div>
      </div>
      <form className="paper filter-bar">
        <input
          name="q"
          aria-label="Pesquisar notícias"
          placeholder="Pesquisar notícias…"
          defaultValue={sp.q}
        />
        <select name="categoria" aria-label="Categoria" defaultValue={sp.categoria}>
          <option value="">Todas as categorias</option>
          {categories.map((c) => (
            <option key={c.category}>{c.category}</option>
          ))}
        </select>
        <button className="primary-button">Filtrar</button>
      </form>
      <div className="entry-grid">
        {news.slice(0, 12).map((n) => (
          <Link href={`/noticias/${n.slug}`} className="paper entry-list-card" key={n.id}>
            {mediaUrl(n.image) ? (
              <img src={mediaUrl(n.image)} alt="" />
            ) : (
              <div className="entry-placeholder">IdBlet</div>
            )}
            <span className="article-kicker">{n.category}</span>
            <h2>{n.title}</h2>
            <p>{n.excerpt}</p>
            <small>
              {n.publishedAt.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })} · Ler
              notícia →
            </small>
          </Link>
        ))}
      </div>
      {!news.length && <div className="paper">Nenhuma notícia encontrada.</div>}
      <div className="pagination">
        {page > 1 && <Link href={`?page=${page - 1}&${qs}`}>← Anterior</Link>}
        {news.length > 12 && <Link href={`?page=${page + 1}&${qs}`}>Próxima →</Link>}
      </div>
    </ArticleShell>
  );
}
