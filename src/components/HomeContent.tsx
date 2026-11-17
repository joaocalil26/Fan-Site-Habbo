"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { SiteConfig } from "@/lib/site";
import Icon from "./Icon";

type Entry = {
  id: string;
  kind: string;
  slug: string;
  title: string;
  excerpt: string | null;
  image: string | null;
  mediaUrl: string | null;
  status: string;
  author: string;
};
type Props = {
  site: SiteConfig;
  mobiSource: "habboassets" | "local";
  emblemSource: "habboassets" | "local";
  values: { id: string; name: string; image: string; price: number }[];
  news: {
    id: string;
    slug: string;
    title: string;
    excerpt: string | null;
    image: string | null;
    comments: number;
    publishedAt: string;
  }[];
  threads: { id: string; slug: string; title: string; author: string; replies: number }[];
  entries: Entry[];
  mobis: { id: string; name: string; image: string; classname: string }[];
  emblems: { id: string; name: string; image: string; code: string }[];
  ranking: { id: string; name: string; xp: number; level: number; comments: number }[];
};
function validMedia(s: string | null) {
  return !!s && (/^\/(?!\/)/.test(s) || /^https?:\/\//.test(s));
}
function Picture({
  src,
  alt = "",
  className = "",
}: {
  src: string | null;
  alt?: string;
  className?: string;
}) {
  return validMedia(src) ? (
    <img src={src!} alt={alt} loading="lazy" className={className} />
  ) : (
    <span className={`asset-placeholder ${className}`}>
      <Icon name="sparkle" size={30} />
    </span>
  );
}
function SectionTitle({
  eyebrow,
  title,
  href,
  label = "Explorar",
  children,
}: {
  eyebrow: string;
  title: string;
  href?: string;
  label?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="section-intro">
      <div>
        <span className="overline">{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      <div className="section-intro-actions">
        {children}
        {href && (
          <Link className="text-link" href={href}>
            {label}
            <Icon name="arrow" size={17} />
          </Link>
        )}
      </div>
    </div>
  );
}
function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="gold-empty">
      <Icon name="sparkle" />
      <p>{children}</p>
    </div>
  );
}
export default function HomeContent({
  site,
  news,
  threads,
  entries,
  mobis,
  emblems,
  ranking,
  values,
  emblemSource,
  mobiSource,
}: Props) {
  const [search, setSearch] = useState("");
  const [forumSearch, setForumSearch] = useState("");
  const [catalog, setCatalog] = useState<"badges" | "furni">("badges");
  const [gallery, setGallery] = useState(0);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    const listen = (event: Event) => setPlaying(!!(event as CustomEvent<boolean>).detail);
    window.addEventListener("idblet:radio-state", listen);
    window.dispatchEvent(new Event("idblet:request-radio-state"));
    return () => window.removeEventListener("idblet:radio-state", listen);
  }, []);
  const events = entries.filter((e) => e.kind === "EVENT").slice(0, 3);
  const arts = entries.filter((e) => e.kind === "ART");
  const podcast = entries.find((e) => e.kind === "PODCAST");
  const banner = entries.find((e) => e.kind === "BANNER");
  const visibleArts = arts.length
    ? [...arts.slice(gallery), ...arts.slice(0, gallery)].slice(0, 3)
    : [];
  const filteredNews = news.filter((n) =>
    `${n.title} ${n.excerpt}`
      .toLocaleLowerCase("pt-BR")
      .includes(search.toLocaleLowerCase("pt-BR")),
  );
  const featured = filteredNews[0];
  const filteredThreads = threads.filter((t) =>
    `${t.title} ${t.author}`
      .toLocaleLowerCase("pt-BR")
      .includes(forumSearch.toLocaleLowerCase("pt-BR")),
  );
  const toggleRadio = () => window.dispatchEvent(new Event("idblet:toggle-radio"));
  return (
    <div className="idblet-home">
      <div className="content-frame">
        <div className="home-topline">
          <span>
            <i />
            Um ponto de encontro. Infinitas possibilidades.
          </span>
          <Link href="/equipe">
            Feito por gente como você
            <Icon name="external" size={13} />
          </Link>
        </div>
        <section className="hero-grid" aria-label="Bem-vindo ao IdBlet">
          <div className="sunset-hero">
            <div className="hero-grain" />
            <div className="hero-copy">
              <span className="hero-eyebrow">
                <span />
                BEM-VINDO AO SEU UNIVERSO
              </span>
              <h1>
                A sua vibe.
                <br />O seu <em>universo.</em>
              </h1>
              <p>
                Notícias que conectam. Música que acompanha.
                <br className="desktop-break" /> E uma comunidade que tem a sua cara.
              </p>
              <div className="hero-buttons">
                <Link href="/forum" className="gold-button">
                  Encontre sua comunidade
                  <Icon name="arrow" size={18} />
                </Link>
                <Link href="/noticias" className="hero-secondary">
                  Fique por dentro
                  <Icon name="external" size={15} />
                </Link>
              </div>
              <div className="hero-signature">
                <span className="signature-mark">iB</span>
                <span>
                  Mais que um fã-site.
                  <br />
                  <strong>Um lugar pra chamar de seu.</strong>
                </span>
              </div>
            </div>
            <div className="hero-visual">
              <img
                src="/idblet-studio.svg"
                alt="Ilustração de um estúdio com toca-discos, microfone e um sol dourado"
              />
              <div className="vinyl-label">
                <span className="vinyl-mini" />
                <span>
                  Boas vibes.
                  <br />
                  <strong>Boas conexões.</strong>
                </span>
                <Icon name="sparkle" size={19} />
              </div>
            </div>
            <span className="hero-edition">IDBLET / COMMUNITY & CULTURE</span>
          </div>
          <aside className="hero-aside">
            <div className="radio-lounge">
              <div className="lounge-top">
                <span className="overline">NA NOSSA FREQUÊNCIA</span>
                <Icon name="radio" size={23} />
              </div>
              <h2>
                A trilha sonora
                <br />
                do seu momento.
              </h2>
              <div className={`sound-bars ${playing ? "is-playing" : ""}`} aria-hidden="true">
                {Array.from({ length: 28 }, (_, i) => (
                  <i
                    key={i}
                    style={{
                      height: `${[18, 34, 22, 48, 65, 35, 76, 48, 90, 56, 72, 38, 58, 96, 64, 43, 78, 52, 69, 42, 86, 60, 38, 70, 46, 28, 40, 20][i]}%`,
                      animationDelay: `${i * 0.07}s`,
                    }}
                  />
                ))}
              </div>
              <div className="lounge-program">
                <span className="host-avatar">{site.dj.slice(0, 1)}</span>
                <div>
                  <strong>{site.dj}</strong>
                  <small>{site.show}</small>
                </div>
                <span className="lounge-status">
                  <i />
                  {playing ? "TOCANDO" : site.streamUrl ? "SINTONIZE" : "EM PREPARAÇÃO"}
                </span>
              </div>
              <button className="lounge-play" onClick={toggleRadio} disabled={!site.streamUrl}>
                <span className="lounge-play-icon">
                  <Icon name={playing ? "pause" : "play"} size={17} />
                </span>
                {playing
                  ? "Pausar transmissão"
                  : site.streamUrl
                    ? "Dê o play e fique à vontade"
                    : "Rádio em preparação"}
                <Icon name="headphones" size={18} />
              </button>
            </div>
            <Link
              className="hero-note"
              href={banner && validMedia(banner.mediaUrl) ? banner.mediaUrl! : "/forum"}
            >
              <span className="note-icon">
                <Icon name="bolt" size={23} />
              </span>
              <div>
                <strong>{banner?.title || "O próximo capítulo é com você."}</strong>
                <p>{banner?.excerpt || site.tagline}</p>
              </div>
              <Icon name="arrow" size={18} />
            </Link>
          </aside>
        </section>
        <nav className="discovery-rail" aria-label="Explore o IdBlet">
          {[
            ["/emblemas", "badge", "Pequenas conquistas", "Emblemas"],
            ["/valores", "coin", "De olho no catálogo", "Valores"],
            ["/eventos", "calendar", "Bora se encontrar?", "Eventos"],
            ["/galeria", "image", "Criatividade sem limite", "Galeria"],
            ["/ranking", "trophy", "Quem faz acontecer", "Ranking"],
          ].map(([href, icon, caption, title]) => (
            <Link key={href} href={href}>
              <span className="discovery-icon">
                <Icon name={icon} size={22} />
              </span>
              <span>
                <small>{caption}</small>
                <strong>{title}</strong>
              </span>
              <Icon name="arrow" size={16} />
            </Link>
          ))}
        </nav>
        <section className="home-editorial">
          <SectionTitle
            eyebrow="NO RADAR DA COMUNIDADE"
            title="O que tá rolando"
            href="/noticias"
            label="Todas as notícias"
          >
            <label className="gold-search">
              <Icon name="search" size={16} />
              <input
                aria-label="Pesquisar notícias"
                placeholder="O que você procura?"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
          </SectionTitle>
          {featured ? (
            <div className="editorial-layout">
              <Link className="featured-story" href={`/noticias/${featured.slug}`}>
                <div className="featured-story-image">
                  <Picture src={featured.image} />
                  <span className="story-label">
                    <Icon name="bolt" size={12} />
                    EM DESTAQUE
                  </span>
                  <span className="story-open">
                    <Icon name="external" size={22} />
                  </span>
                </div>
                <div className="featured-story-copy">
                  <div className="story-meta">
                    <span>Comunidade</span>
                    <time>
                      {new Date(featured.publishedAt).toLocaleDateString("pt-BR", {
                        timeZone: "America/Sao_Paulo",
                      })}
                    </time>
                  </div>
                  <h3>{featured.title}</h3>
                  <p>{featured.excerpt}</p>
                  <div className="story-bottom">
                    <span>
                      Ler a história
                      <Icon name="arrow" size={16} />
                    </span>
                    <small>
                      <Icon name="chat" size={14} />
                      {featured.comments}
                    </small>
                  </div>
                </div>
              </Link>
              <div className="story-list">
                {filteredNews.slice(1).map((n, i) => (
                  <Link href={`/noticias/${n.slug}`} className="compact-story" key={n.id}>
                    <span className="story-number">{String(i + 2).padStart(2, "0")}</span>
                    <div>
                      <div className="story-meta">
                        <span>Novidades</span>
                        <time>
                          {new Date(n.publishedAt).toLocaleDateString("pt-BR", {
                            timeZone: "America/Sao_Paulo",
                          })}
                        </time>
                      </div>
                      <h3>{n.title}</h3>
                      <small>
                        <Icon name="chat" size={12} />
                        {n.comments} comentários
                      </small>
                    </div>
                    <Picture src={n.image} />
                  </Link>
                ))}
                {filteredNews.length === 1 && (
                  <div className="editorial-invitation">
                    <Icon name="news" size={32} />
                    <h3>
                      A próxima história
                      <br />
                      pode ser sua.
                    </h3>
                    <p>Compartilhe ideias, descobertas e tudo que faz parte do seu universo.</p>
                    <Link href="/forum/novo" className="text-link">
                      Puxe uma conversa
                      <Icon name="arrow" size={17} />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Empty>
              {search
                ? "Nenhuma notícia por aqui com essa busca."
                : "Estamos preparando as primeiras histórias."}
            </Empty>
          )}
        </section>
        <div className="home-catalog-grid">
          <section className="discovery-card badge-discovery">
            <div className="card-intro">
              <span className="card-icon">
                <Icon name="badge" size={22} />
              </span>
              <div>
                <span className="overline">ACHADOS DO CATÁLOGO</span>
                <h2>Detalhes que colecionam histórias.</h2>
              </div>
              <Link
                href={catalog === "badges" ? "/emblemas" : "/mobis"}
                className="round-link"
                aria-label="Explorar catálogo"
              >
                <Icon name="external" size={18} />
              </Link>
            </div>
            <div className="catalog-tabs" role="group" aria-label="Tipo de catálogo">
              <button aria-pressed={catalog === "badges"} onClick={() => setCatalog("badges")}>
                Últimos emblemas
              </button>
              <button aria-pressed={catalog === "furni"} onClick={() => setCatalog("furni")}>
                Últimos mobis
              </button>
              <span>
                {catalog === "badges"
                  ? emblemSource === "habboassets"
                    ? "Habbo Brasil · HabboAssets"
                    : "Coleção IdBlet"
                  : mobiSource === "habboassets"
                    ? "Habbo Brasil · HabboAssets"
                    : "Coleção IdBlet"}
              </span>
            </div>
            <div className="badge-display">
              {(catalog === "badges" ? emblems : mobis).map((item) => (
                <Link
                  href={catalog === "badges" ? "/emblemas" : "/mobis"}
                  className="badge-pod"
                  key={item.id}
                  title={item.name}
                >
                  <span>
                    <Picture src={item.image} alt={item.name} />
                  </span>
                  <small>{"code" in item ? item.code : item.name}</small>
                </Link>
              ))}
            </div>
            {!(catalog === "badges" ? emblems : mobis).length && (
              <Empty>Novas descobertas em breve.</Empty>
            )}
          </section>
          <section className="discovery-card value-discovery">
            <div className="card-intro">
              <span className="card-icon">
                <Icon name="coin" size={22} />
              </span>
              <div>
                <span className="overline">BOM SABER</span>
                <h2>De olho nos valores</h2>
              </div>
              <Link href="/valores" className="round-link" aria-label="Ver todos os valores">
                <Icon name="external" size={18} />
              </Link>
            </div>
            <div className="value-list">
              {values.slice(0, 6).map((m) => (
                <Link href={`/valores?q=${encodeURIComponent(m.name)}`} key={m.id}>
                  <span className="value-image">
                    <Picture src={m.image} />
                  </span>
                  <span>{m.name}</span>
                  <b>
                    <Icon name="coin" size={13} />
                    {m.price.toLocaleString("pt-BR")}
                  </b>
                </Link>
              ))}
            </div>
            <div className="card-source">
              <span className="source-dot" />
              Valores mantidos pela equipe IdBlet
            </div>
          </section>
        </div>
        <div className="home-social-grid">
          <section className="conversation-section">
            <SectionTitle
              eyebrow="PUXE UMA CADEIRA"
              title="A conversa já começou"
              href="/forum"
              label="Ir ao fórum"
            />
            <div className="conversation-board">
              <div className="conversation-toolbar">
                <span>
                  <Icon name="chat" size={17} />O seu próximo assunto favorito
                </span>
                <label className="gold-search">
                  <Icon name="search" size={15} />
                  <input
                    aria-label="Pesquisar tópicos"
                    placeholder="Buscar uma conversa"
                    value={forumSearch}
                    onChange={(e) => setForumSearch(e.target.value)}
                  />
                </label>
              </div>
              {filteredThreads.slice(0, 6).map((t, i) => (
                <Link className="conversation-row" href={`/forum/${t.slug}`} key={t.id}>
                  <span className={`conversation-avatar avatar-${i % 4}`}>
                    {t.author.slice(0, 1)}
                  </span>
                  <div>
                    <h3>{t.title}</h3>
                    <small>
                      por <strong>{t.author}</strong>
                    </small>
                  </div>
                  <span className="reply-count">
                    <Icon name="chat" size={15} />
                    {t.replies}
                  </span>
                  <Icon name="chevron" size={15} />
                </Link>
              ))}
              {!filteredThreads.length && (
                <Empty>
                  {forumSearch
                    ? "Nenhuma conversa encontrada."
                    : "Que tal começar a primeira conversa?"}
                </Empty>
              )}
              <Link className="conversation-create" href="/forum/novo">
                <Icon name="sparkle" size={17} />
                Tem algo pra contar?
                <strong>
                  Crie um tópico
                  <Icon name="arrow" size={16} />
                </strong>
              </Link>
            </div>
          </section>
          <aside className="happenings-section">
            <SectionTitle
              eyebrow="SAVE THE DATE"
              title="Bora participar?"
              href="/eventos"
              label="Agenda"
            />
            <div className="happenings-list">
              {events.length ? (
                events.map((e, i) => (
                  <Link href={`/eventos/${e.slug}`} className="happening-card" key={e.id}>
                    <div className={`event-cover event-color-${i}`}>
                      <Picture src={e.image} />
                      <span className="event-state">{e.status}</span>
                    </div>
                    <div>
                      <small>ENCONTROS DA COMUNIDADE</small>
                      <h3>{e.title}</h3>
                      <span>
                        Ver os detalhes
                        <Icon name="arrow" size={15} />
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="agenda-empty">
                  <Icon name="calendar" size={35} />
                  <h3>
                    As melhores histórias
                    <br />
                    acontecem juntas.
                  </h3>
                  <p>Fique de olho na agenda para os próximos encontros da comunidade.</p>
                  <Link href="/eventos" className="text-link">
                    Explorar agenda
                    <Icon name="arrow" size={17} />
                  </Link>
                </div>
              )}
            </div>
          </aside>
        </div>
        <section className="creative-space">
          <div className="creative-heading">
            <div>
              <span className="overline">UM POUCO DE INSPIRAÇÃO</span>
              <h2>
                Talento daqui.
                <br />
                <em>Criatividade sem fim.</em>
              </h2>
              <p>
                Ideias que ganham forma.
                <br />
                Conheça o lado criativo da nossa comunidade.
              </p>
              <Link href="/galeria" className="gold-button">
                Explore a galeria
                <Icon name="arrow" size={17} />
              </Link>
            </div>
            <div className="creative-navigation">
              <button
                aria-label="Arte anterior"
                disabled={!arts.length}
                onClick={() => setGallery((gallery + arts.length - 1) % arts.length)}
              >
                <Icon name="chevron" style={{ transform: "rotate(180deg)" }} />
              </button>
              <button
                aria-label="Próxima arte"
                disabled={!arts.length}
                onClick={() => setGallery((gallery + 1) % arts.length)}
              >
                <Icon name="chevron" />
              </button>
            </div>
          </div>
          <div className={`creative-gallery ${visibleArts.length === 1 ? "single-art" : ""}`}>
            {visibleArts.map((a) => (
              <Link className="creative-art" href={`/galeria/${a.slug}`} key={a.id}>
                <Picture src={a.image} alt={a.title} />
                <div>
                  <span>DA NOSSA COMUNIDADE</span>
                  <h3>{a.title}</h3>
                  <small>
                    {a.author}
                    <Icon name="external" size={15} />
                  </small>
                </div>
              </Link>
            ))}
            {!arts.length && (
              <div className="creative-empty">
                <Icon name="image" size={60} />
                <h3>
                  Um espaço aberto
                  <br />
                  para novas ideias.
                </h3>
                <Link href="/galeria">
                  Conheça a galeria
                  <Icon name="arrow" size={17} />
                </Link>
              </div>
            )}
          </div>
        </section>
        <div className="home-bottom-grid">
          <section className="community-people">
            <SectionTitle
              eyebrow="GENTE QUE FAZ A DIFERENÇA"
              title="A comunidade acontece aqui"
              href="/ranking"
              label="Ranking completo"
            />
            <div className="people-list">
              {ranking.map((u, i) => (
                <Link href={`/perfil?u=${encodeURIComponent(u.name)}`} key={u.id}>
                  <span className="people-position">
                    {i === 0 ? <Icon name="trophy" size={20} /> : String(i + 1).padStart(2, "0")}
                  </span>
                  <span className={`conversation-avatar avatar-${i % 4}`}>
                    {u.name.slice(0, 1)}
                  </span>
                  <div>
                    <strong>{u.name}</strong>
                    <small>
                      Nível {u.level} · {u.comments} respostas
                    </small>
                  </div>
                  <b>
                    {u.xp.toLocaleString("pt-BR")}
                    <small>XP</small>
                  </b>
                </Link>
              ))}
              {!ranking.length && <Empty>O primeiro capítulo dessa história pode ser seu.</Empty>}
            </div>
          </section>
          <section className="audio-corner">
            <span className="overline">APERTE O PLAY NA CONVERSA</span>
            <span className="podcast-symbol">
              <Icon name="headphones" size={30} />
            </span>
            <h2>{podcast ? podcast.title : "Boas histórias merecem ser ouvidas."}</h2>
            <p>
              {podcast?.excerpt ||
                "Entre na frequência do IdBlet. Música, boas ideias e companhia para deixar seu dia mais leve."}
            </p>
            {podcast && validMedia(podcast.mediaUrl) ? (
              <audio controls preload="none" src={podcast.mediaUrl!} />
            ) : (
              <div className="audio-decoration" aria-hidden="true">
                {Array.from({ length: 20 }, (_, i) => (
                  <span
                    key={i}
                    style={{
                      height: `${[12, 24, 18, 32, 45, 23, 37, 50, 29, 41, 22, 48, 35, 19, 42, 28, 38, 20, 30, 12][i]}px`,
                    }}
                  />
                ))}
              </div>
            )}
            <Link href={podcast ? `/podcasts/${podcast.slug}` : "/podcasts"} className="text-link">
              {podcast ? "Ouvir o episódio" : "Conheça os podcasts"}
              <Icon name="arrow" size={17} />
            </Link>
          </section>
        </div>
        <section className="join-community">
          <span className="join-spark">
            <Icon name="sparkle" size={36} />
          </span>
          <div>
            <span className="overline">O PRÓXIMO CAPÍTULO É NOSSO.</span>
            <h2>Tem um lugar pra você aqui.</h2>
            <p>Entre, participe e deixe a sua marca no {site.name}.</p>
          </div>
          <Link href="/forum" className="dark-button">
            Faça parte da conversa
            <Icon name="arrow" size={18} />
          </Link>
        </section>
      </div>
    </div>
  );
}
