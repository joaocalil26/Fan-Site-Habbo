import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { currentMember } from "@/lib/access";
export default async function ArticleShell({
  children,
  section,
}: {
  children: React.ReactNode;
  section: string;
}) {
  const ranking = await prisma.user.findMany({
    where: { isBanned: false },
    orderBy: [{ xp: "desc" }, { id: "asc" }],
    take: 5,
    select: { id: true, username: true, level: true, xp: true },
  });
  const member = await currentMember();
  return (
    <div className="public-shell">
      <div className="breadcrumbs">
        <Link href="/">Início</Link>
        <span>›</span>
        <span>{section}</span>
      </div>
      <div className="article-layout">
        <aside className="article-sidebar">
          <div className="sidebar-title">Explore o IdBlet</div>
          <nav>
            {[
              ["/noticias", "Notícias"],
              ["/eventos", "Eventos"],
              ["/forum", "Fórum"],
              ["/galeria", "Galeria"],
              ["/podcasts", "Podcasts"],
              ["/equipe", "Equipe"],
            ].map(([href, label]) => (
              <Link key={href} href={href}>
                {label} →
              </Link>
            ))}
          </nav>
          <div className="sidebar-title">Ranking da comunidade</div>
          <div className="sidebar-ranking">
            {ranking.map((u, i) => (
              <Link key={u.id} href={`/perfil?u=${encodeURIComponent(u.username || "")}`}>
                <b>{i + 1}</b>
                <span>
                  {u.username}
                  <small>
                    Nível {u.level} · {u.xp} XP
                  </small>
                </span>
              </Link>
            ))}
          </div>
          <Link className="sidebar-cta" href={member ? "/forum/novo" : "/register"}>
            {member ? "Criar um tópico" : "Faça parte da comunidade"}
          </Link>
        </aside>
        <div className="article-main">{children}</div>
      </div>
    </div>
  );
}
