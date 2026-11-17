import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { currentMember } from "@/lib/access";
import { CommentForm, ReactionButton, ReportForm } from "./CommunityForms";
export default async function Comments({
  type,
  id,
  page = 1,
}: {
  type: "news" | "entry";
  id: string;
  page?: number;
}) {
  const member = await currentMember();
  const where = { hidden: false, ...(type === "news" ? { newsId: id } : { entryId: id }) };
  const [comments, count, reactions, liked] = await Promise.all([
    prisma.comment.findMany({
      where,
      include: { author: { select: { username: true, isBanned: true } } },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * 20,
      take: 20,
    }),
    prisma.comment.count({ where }),
    prisma.reaction.count({ where: { targetType: type, targetId: id } }),
    member
      ? prisma.reaction.findUnique({
          where: {
            userId_targetType_targetId: { userId: member.id, targetType: type, targetId: id },
          },
        })
      : null,
  ]);
  return (
    <section className="paper comments">
      <ReactionButton type={type} id={id} count={reactions} liked={!!liked} />
      <h2>
        Comentários <span>{count}</span>
      </h2>
      {comments.length ? (
        comments.map((c) => (
          <div className="comment" key={c.id}>
            <div className="comment-avatar">
              {c.author.username?.slice(0, 1).toUpperCase() || "I"}
            </div>
            <div>
              <Link href={`/perfil?u=${encodeURIComponent(c.author.username || "")}`}>
                {c.author.isBanned ? "Usuário suspenso" : c.author.username}
              </Link>
              <time>{c.createdAt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</time>
              <p>{c.content}</p>
            </div>
          </div>
        ))
      ) : (
        <p className="muted">Seja a primeira pessoa a comentar.</p>
      )}
      <div className="pagination">
        {page > 1 && <Link href={`?comentarios=${page - 1}#comentarios`}>← Anteriores</Link>}
        {page * 20 < count && (
          <Link href={`?comentarios=${page + 1}#comentarios`}>Mais comentários →</Link>
        )}
      </div>
      {member ? (
        <>
          <CommentForm type={type} id={id} />
          <ReportForm type={type} id={id} />
        </>
      ) : (
        <div className="login-prompt">
          <Link href="/login">Entre</Link> ou <Link href="/register">crie sua conta</Link> para
          comentar.
        </div>
      )}
    </section>
  );
}
