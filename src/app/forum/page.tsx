import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ArticleShell from "@/components/ArticleShell";
export const dynamic = "force-dynamic";
export default async function ForumPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categoria?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Math.min(10000, Number(sp.page) || 1));
  const [categories, threads] = await Promise.all([
    prisma.forumCategory.findMany({ orderBy: { order: "asc" } }),
    prisma.forumThread.findMany({
      where: {
        ...(sp.q ? { title: { contains: sp.q.slice(0, 100) } } : {}),
        ...(sp.categoria ? { category: { slug: sp.categoria } } : {}),
      },
      include: { author: { select: { username: true } }, category: { select: { name: true } } },
      orderBy: [{ pinned: "desc" }, { lastPostAt: "desc" }, { id: "desc" }],
      take: 21,
      skip: (page - 1) * 20,
    }),
  ]);
  const qs = `q=${encodeURIComponent(sp.q || "")}&categoria=${encodeURIComponent(sp.categoria || "")}`;
  return (
    <ArticleShell section="Fórum">
      <div className="listing-heading">
        <div>
          <span className="article-kicker">CONVERSE, COMPARTILHE, PARTICIPE</span>
          <h1>Fórum da comunidade</h1>
        </div>
        <Link className="primary-button" href="/forum/novo">
          + Criar tópico
        </Link>
      </div>
      <form className="paper filter-bar">
        <input
          name="q"
          placeholder="Pesquisar tópicos…"
          aria-label="Pesquisar tópicos"
          defaultValue={sp.q}
        />
        <select name="categoria" aria-label="Categoria" defaultValue={sp.categoria}>
          <option value="">Todas as categorias</option>
          {categories.map((c) => (
            <option value={c.slug} key={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button className="primary-button">Filtrar</button>
      </form>
      <div className="thread-list">
        {threads.slice(0, 20).map((t) => (
          <Link href={`/forum/${t.slug}`} className="paper thread-row" key={t.id}>
            <div className="member-initial">{t.author.username?.slice(0, 1)}</div>
            <div>
              <small>
                {t.category.name} {t.pinned && "· Fixado"} {t.locked && "· Fechado"}
              </small>
              <h2>{t.title}</h2>
              <p>
                {t.author.username} ·{" "}
                {t.lastPostAt.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}
              </p>
            </div>
            <b>
              {t.replyCount}
              <small>respostas</small>
            </b>
          </Link>
        ))}
      </div>
      {!threads.length && <div className="paper">Nenhum tópico encontrado.</div>}
      <div className="pagination">
        {page > 1 && <Link href={`?page=${page - 1}&${qs}`}>← Anterior</Link>}
        {threads.length > 20 && <Link href={`?page=${page + 1}&${qs}`}>Próxima →</Link>}
      </div>
    </ArticleShell>
  );
}
