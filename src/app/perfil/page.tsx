import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { currentMember } from "@/lib/access";
import { mediaUrl } from "@/lib/site";
import { profileImage } from "@/lib/profile";
import ArticleShell from "@/components/ArticleShell";
import MemberSignature from "@/components/MemberSignature";
export const dynamic = "force-dynamic";
export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ u?: string; emblemas?: string }>;
}) {
  const sp = await searchParams;
  const member = await currentMember();
  const username = sp.u || member?.username;
  if (!username)
    return (
      <ArticleShell section="Perfil">
        <div className="paper">
          <h1>Seu perfil no IdBlet</h1>
          <p>
            <Link href="/login">Entre</Link> ou <Link href="/register">crie sua conta</Link> para
            participar.
          </p>
        </div>
      </ArticleShell>
    );
  const rawPage = Number(sp.emblemas);
  const page = Number.isSafeInteger(rawPage) ? Math.max(1, Math.min(10000, rawPage)) : 1;
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      name: true,
      bio: true,
      avatar: true,
      image: true,
      coverImage: true,
      signature: true,
      signatureImage: true,
      rank: true,
      role: true,
      level: true,
      xp: true,
      createdAt: true,
      isBanned: true,
      _count: {
        select: {
          threads: true,
          posts: true,
          comments: { where: { hidden: false } },
          userEmblems: true,
        },
      },
      userEmblems: {
        include: { emblem: true },
        orderBy: [{ obtainedAt: "desc" }, { id: "asc" }],
        skip: (page - 1) * 30,
        take: 30,
      },
    },
  });
  if (!user) notFound();
  const [artCount, threads, arts] = await Promise.all([
    prisma.contentEntry.count({ where: { authorId: user.id, kind: "ART", published: true } }),
    prisma.forumThread.findMany({
      where: { authorId: user.id },
      select: {
        id: true,
        title: true,
        slug: true,
        replyCount: true,
        category: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.contentEntry.findMany({
      where: { authorId: user.id, kind: "ART", published: true },
      select: { id: true, title: true, slug: true, image: true },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
  ]);
  const name = user.username || user.name || "Membro";
  const avatar = mediaUrl(user.avatar) || mediaUrl(user.image);
  const cover = profileImage(user.coverImage);
  const own = member?.id === user.id;
  const badgeLink = (n: number) => `/perfil?u=${encodeURIComponent(name)}&emblemas=${n}`;
  return (
    <ArticleShell section="Perfil">
      <h1 className="member-profile-title">
        <span aria-hidden="true">♙</span> Perfil
      </h1>
      <article className="paper member-profile-hero">
        <div className="member-profile-cover">
          {cover && <img src={cover} alt={`Capa de ${name}`} />}
        </div>
        <div className="member-profile-identity">
          <div className="member-profile-avatar">
            {avatar ? (
              <img src={avatar} alt={`Foto de ${name}`} />
            ) : (
              <span>{name.slice(0, 1).toUpperCase()}</span>
            )}
          </div>
          <div className="member-profile-heading">
            <h2>
              {name}
              {!user.isBanned && user.role !== "USER" && (
                <span className="staff-check" title="Equipe IdBlet" aria-label="Equipe IdBlet">
                  ✓
                </span>
              )}
            </h2>
            <div className="member-profile-stats">
              <span>
                <b>{user._count.threads}</b> tópicos
              </span>
              <span>
                <b>{artCount}</b> artes
              </span>
              <span>
                <b>{user._count.posts + user._count.comments}</b> comentários
              </span>
            </div>
          </div>
          {own && (
            <Link className="profile-edit-link" href="/perfil/editar">
              Editar perfil ↗
            </Link>
          )}
        </div>
      </article>
      <section className="paper member-profile-badges">
        <h2>
          Emblemas <span className="profile-section-count">{user._count.userEmblems}</span>
        </h2>
        <div className="member-badge-grid">
          {user.userEmblems.map(({ emblem }) => (
            <div
              className="member-badge-tile"
              title={`${emblem.name} (${emblem.code})`}
              key={emblem.id}
            >
              {mediaUrl(emblem.image) ? (
                <img src={mediaUrl(emblem.image)} alt={emblem.name} loading="lazy" />
              ) : (
                <span>{emblem.image}</span>
              )}
            </div>
          ))}
          {!user.userEmblems.length && <p className="muted">Nenhum emblema conquistado ainda.</p>}
        </div>
        {user._count.userEmblems > 30 && (
          <nav className="pagination" aria-label="Páginas de emblemas">
            {page > 1 && <Link href={badgeLink(page - 1)}>← Anterior</Link>}
            {page * 30 < user._count.userEmblems && (
              <Link href={badgeLink(page + 1)}>Próxima →</Link>
            )}
          </nav>
        )}
      </section>
      <section className="paper member-profile-about">
        <h2>Sobre {name}</h2>
        <div className="profile-level-meta">
          <strong>Nível {user.level}</strong>
          <span>{user.rank}</span>
          <span>{user.xp} XP</span>
          {user.isBanned && <span>Conta suspensa</span>}
        </div>
        <p className="profile-biography">
          {user.bio || "Este membro ainda não escreveu sua biografia."}
        </p>
        <small className="muted">
          Membro desde{" "}
          {user.createdAt.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}
        </small>
        {(user.signature || user.signatureImage) && (
          <>
            <h3>Assinatura</h3>
            <MemberSignature text={user.signature} image={user.signatureImage} />
          </>
        )}
      </section>
      <section className="paper member-profile-topics">
        <h2>
          Tópicos <span className="profile-section-count">{user._count.threads}</span>
        </h2>
        {threads.length ? (
          threads.map((t) => (
            <Link key={t.id} href={`/forum/${t.slug}`} className="profile-topic-link">
              <div>
                <strong>{t.title}</strong>
                <small>{t.category.name}</small>
              </div>
              <span>{t.replyCount} respostas →</span>
            </Link>
          ))
        ) : (
          <p className="muted">Este membro ainda não criou tópicos.</p>
        )}
      </section>
      {arts.length > 0 && (
        <section className="paper member-profile-arts">
          <h2>
            Artes <span className="profile-section-count">{artCount}</span>
          </h2>
          <div className="profile-art-grid">
            {arts.map((a) => (
              <Link key={a.id} href={`/galeria/${a.slug}`}>
                {mediaUrl(a.image) && <img src={mediaUrl(a.image)} alt={a.title} loading="lazy" />}
                <strong>{a.title}</strong>
              </Link>
            ))}
          </div>
        </section>
      )}
    </ArticleShell>
  );
}
