import { latestFurniture } from "@/lib/external-furniture";
import ArticleShell from "@/components/ArticleShell";
export const dynamic = "force-dynamic";
export default async function FurniturePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const result = await latestFurniture({ take: 50, query: sp.q });
  return (
    <ArticleShell section="Últimos mobis">
      <div className="listing-heading">
        <div>
          <span className="article-kicker">NOVIDADES DO HABBO BRASIL</span>
          <h1>Últimos mobis</h1>
        </div>
        <form className="public-search">
          <input
            name="q"
            defaultValue={sp.q}
            aria-label="Pesquisar mobis recentes"
            placeholder="Nome ou classe…"
          />
          <button>Buscar</button>
        </form>
      </div>
      <p className="muted values-attribution">
        {result.source === "habboassets" ? (
          <>
            Mobis adicionados recentemente ao Habbo Brasil, segundo o feed público da{" "}
            <a href="https://www.habboassets.com/api" target="_blank" rel="noopener noreferrer">
              HabboAssets
            </a>
            . A busca considera as novidades do feed, não o catálogo inteiro. Atualização a cada
            cinco minutos.
          </>
        ) : (
          result.warning
        )}
      </p>
      <div className="catalog-grid">
        {result.items.map((m) => (
          <article key={m.id} className="paper catalog-card">
            <img src={m.image} alt={m.name} loading="lazy" />
            <h2>{m.name}</h2>
            {m.classname && <small className="furni-classname">{m.classname}</small>}
          </article>
        ))}
      </div>
      {!result.items.length && (
        <div className="paper empty-state">Nenhum mobi recente encontrado.</div>
      )}
    </ArticleShell>
  );
}
