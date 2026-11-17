import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ArticleShell from "@/components/ArticleShell";
export const dynamic = "force-dynamic";
export default async function Page() {
  const users = await prisma.user.findMany({
    where: { isBanned: false },
    orderBy: [{ xp: "desc" }, { id: "asc" }],
    take: 100,
    select: {
      id: true,
      username: true,
      level: true,
      xp: true,
      _count: { select: { posts: true } },
    },
  });
  return (
    <ArticleShell section="Ranking">
      <div className="paper">
        <span className="article-kicker">QUEM MOVIMENTA A COMUNIDADE</span>
        <h1>Ranking IdBlet</h1>
        <p className="muted">
          Os 100 membros com mais XP. Crie tópicos e participe das conversas para evoluir.
        </p>
        <div className="ranking-table">
          {users.map((u, i) => (
            <Link key={u.id} href={`/perfil?u=${encodeURIComponent(u.username || "")}`}>
              <b>{i + 1}º</b>
              <span>
                {u.username}
                <small>
                  Nível {u.level} · {u._count.posts} respostas
                </small>
              </span>
              <strong>{u.xp} XP</strong>
            </Link>
          ))}
        </div>
      </div>
    </ArticleShell>
  );
}
