import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { mediaUrl } from "@/lib/site";
import ArticleShell from "@/components/ArticleShell";
import RichContent from "@/components/RichContent";
import Comments from "@/components/Comments";
export const dynamic = "force-dynamic";
export default async function NewsDetail({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ comentarios?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const news = await prisma.news.findFirst({
    where: { slug, published: true, publishedAt: { lte: new Date() } },
  });
  if (!news) notFound();
  const author = news.authorId
    ? await prisma.user.findUnique({ where: { id: news.authorId }, select: { username: true } })
    : null;
  const related = await prisma.news.findMany({
    where: { published: true, publishedAt: { lte: new Date() }, id: { not: news.id } },
    orderBy: { publishedAt: "desc" },
    take: 3,
    select: { slug: true, title: true },
  });
  return (
    <ArticleShell section="Notícias">
      <article className="paper article-card">
        <div className="article-kicker">{news.category}</div>
        <h1>{news.title}</h1>
        <div className="article-byline">
          Escrito por{" "}
          <Link href={`/perfil?u=${encodeURIComponent(author?.username || "")}`}>
            {author?.username || "Equipe IdBlet"}
          </Link>
          <span>·</span>
          <time>{news.publishedAt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</time>
        </div>
        {mediaUrl(news.image) && (
          <img className="article-cover" src={mediaUrl(news.image)} alt="" />
        )}
        {news.excerpt && <p className="article-lead">{news.excerpt}</p>}
        <RichContent content={news.content} />
        <div className="article-signature">
          As novidades da comunidade estão aqui.<strong>IdBlet — seu lugar na comunidade.</strong>
        </div>
      </article>
      <div id="comentarios">
        <Comments
          type="news"
          id={news.id}
          page={Math.max(1, Math.min(10000, Number(sp.comentarios) || 1))}
        />
      </div>
      <section className="paper">
        <h2>Continue lendo</h2>
        <div className="related-links">
          {related.map((n) => (
            <Link key={n.slug} href={`/noticias/${n.slug}`}>
              {n.title} →
            </Link>
          ))}
        </div>
      </section>
    </ArticleShell>
  );
}
