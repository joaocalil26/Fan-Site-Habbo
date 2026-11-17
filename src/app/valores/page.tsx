import Link from "next/link";
import { latestValues } from "@/lib/values";
import { mediaUrl } from "@/lib/site";
import ArticleShell from "@/components/ArticleShell";
export const dynamic = "force-dynamic";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const result = await latestValues({ page: Number(sp.page || 1), take: 24, query: sp.q });
  return (
    <ArticleShell section="Valores">
      <div className="listing-heading">
        <div>
          <span className="article-kicker">CATÁLOGO IDBLET</span>
          <h1>Mobis e valores</h1>
        </div>
        <form className="public-search">
          <input
            name="q"
            aria-label="Pesquisar mobis"
            defaultValue={sp.q}
            placeholder="Pesquisar mobi…"
          />
          <button>Buscar</button>
        </form>
      </div>
      <p className="muted values-attribution">
        Valores cadastrados e mantidos pela equipe do IdBlet.
      </p>
      <div className="catalog-grid">
        {result.items.map((m) => (
          <article className="paper catalog-card" key={m.id}>
            {mediaUrl(m.image) ? <img src={mediaUrl(m.image)} alt={m.name} /> : <span>✦</span>}
            <h2>{m.name}</h2>
            <p>{m.price.toLocaleString("pt-BR")} moedas</p>
          </article>
        ))}
      </div>
      {!result.items.length && <div className="paper">Nenhum mobi encontrado.</div>}
      <div className="pagination">
        {result.page > 1 && (
          <Link href={`?page=${result.page - 1}&q=${encodeURIComponent(sp.q || "")}`}>
            ← Anterior
          </Link>
        )}
        {result.hasMore && (
          <Link href={`?page=${result.page + 1}&q=${encodeURIComponent(sp.q || "")}`}>
            Próxima →
          </Link>
        )}
      </div>
    </ArticleShell>
  );
}
