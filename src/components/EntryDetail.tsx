import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { ContentKind } from "@prisma/client";
import { mediaUrl } from "@/lib/site";
import ArticleShell from "./ArticleShell";
import RichContent from "./RichContent";
import Comments from "./Comments";
const labels: Record<ContentKind, string> = {
  ART: "Galeria",
  EVENT: "Eventos",
  PODCAST: "Podcasts",
  PAGE: "Páginas",
  TEAM: "Equipe",
  BANNER: "Destaques",
};
export default async function EntryDetail({
  slug,
  kind,
  commentPage = 1,
}: {
  slug: string;
  kind: ContentKind;
  commentPage?: number;
}) {
  const entry = await prisma.contentEntry.findFirst({
    where: { slug, kind, published: true },
    include: { author: { select: { username: true } }, rewards: { include: { emblem: true } } },
  });
  if (!entry) notFound();
  return (
    <ArticleShell section={labels[kind]}>
      <article className={`paper article-card entry-${kind.toLowerCase()}`}>
        <div className="article-kicker">
          {labels[kind]} {kind === "EVENT" && <b className="status-badge">{entry.status}</b>}
        </div>
        <h1>{entry.title}</h1>
        <div className="article-byline">
          Por{" "}
          <Link href={`/perfil?u=${encodeURIComponent(entry.author.username || "")}`}>
            {entry.author.username}
          </Link>
          <span>·</span>
          <time>{entry.createdAt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</time>
        </div>
        {entry.image && mediaUrl(entry.image) && (
          <a
            href={mediaUrl(entry.image)}
            target="_blank"
            rel="noopener noreferrer"
            className="entry-image"
          >
            <img src={mediaUrl(entry.image)} alt={entry.title} />
          </a>
        )}
        {entry.excerpt && <p className="article-lead">{entry.excerpt}</p>}
        {kind === "EVENT" && entry.startsAt && (
          <div className="event-schedule">
            <strong>Quando acontece</strong>
            <p>
              {entry.startsAt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} (horário
              de Brasília)
            </p>
            {entry.endsAt && (
              <p>Até {entry.endsAt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</p>
            )}
          </div>
        )}
        {kind === "PODCAST" && mediaUrl(entry.mediaUrl) && (
          <audio
            controls
            preload="metadata"
            src={mediaUrl(entry.mediaUrl)}
            className="podcast-audio"
          />
        )}
        <RichContent content={entry.content} />
        {kind === "EVENT" && entry.giftEnabled && entry.rewards.length > 0 && (
          <section className="event-rewards">
            <h2>Emblemas deste evento</h2>
            <div className="gift-badges">
              {entry.rewards.map(({ emblem }) => (
                <img
                  key={emblem.id}
                  src={emblem.image}
                  alt={emblem.name}
                  title={`${emblem.name} (${emblem.code})`}
                />
              ))}
            </div>
            <p>
              Entre na sua conta e abra o presente durante o evento para receber estes emblemas no
              seu perfil IdBlet. Um resgate por conta; emblemas que você já possui não são
              duplicados.
            </p>
          </section>
        )}
        <div className="article-signature">
          Feito pela comunidade.<strong>IdBlet — seu lugar na comunidade.</strong>
        </div>
      </article>
      <div id="comentarios">
        <Comments type="entry" id={entry.id} page={commentPage} />
      </div>
    </ArticleShell>
  );
}
