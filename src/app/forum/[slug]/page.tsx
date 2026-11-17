import ForumMemberCard, { forumMemberSelect } from "@/components/ForumMemberCard";
import QuoteReply from "@/components/QuoteReply";
import MemberSignature from "@/components/MemberSignature";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { currentMember } from "@/lib/access";
import ArticleShell from "@/components/ArticleShell";
import RichContent from "@/components/RichContent";
import ReplyForm from "@/components/ReplyForm";
import { ReactionButton, ReportForm } from "@/components/CommunityForms";
export const dynamic = "force-dynamic";
export default async function ThreadPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = Math.max(1, Math.min(10000, Number(sp.page) || 1));
  const thread = await prisma.forumThread.findUnique({
    where: { slug },
    include: {
      author: { select: forumMemberSelect },
      category: true,
    },
  });
  if (!thread) notFound();
  const [member, posts, likes] = await Promise.all([
    currentMember(),
    prisma.forumPost.findMany({
      where: { threadId: thread.id },
      include: { author: { select: forumMemberSelect } },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      skip: (page - 1) * 20,
      take: 21,
    }),
    prisma.reaction.count({ where: { targetType: "thread", targetId: thread.id } }),
  ]);
  const liked = member
    ? await prisma.reaction.findUnique({
        where: {
          userId_targetType_targetId: {
            userId: member.id,
            targetType: "thread",
            targetId: thread.id,
          },
        },
      })
    : null;
  return (
    <ArticleShell section="Fórum">
      <div className="paper topic-heading">
        <span className="article-kicker">Fórum / {thread.category.name}</span>
        <h1>{thread.title}</h1>
        <p className="muted">
          {thread.pinned ? "Fixado · " : ""}
          {thread.locked ? "Fechado · " : ""}
          {thread.createdAt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} ·{" "}
          {thread.replyCount} respostas
        </p>
      </div>
      <article className="paper topic-post forum-post-card">
        <ForumMemberCard user={thread.author} />
        <div className="forum-post-body">
          <RichContent content={thread.content} />
          {!thread.author.isBanned && (
            <MemberSignature text={thread.author.signature} image={thread.author.signatureImage} />
          )}
          <footer>
            <ReactionButton type="thread" id={thread.id} count={likes} liked={!!liked} />
            {member && !thread.locked && (
              <QuoteReply author={thread.author.username || "Membro"} content={thread.content} />
            )}
          </footer>
        </div>
      </article>
      <h2 className="responses-title">Respostas da comunidade</h2>
      {posts.slice(0, 20).map((post) => (
        <article key={post.id} className="paper topic-post forum-post-card">
          <ForumMemberCard user={post.author} />
          <div className="forum-post-body">
            <time>{post.createdAt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</time>
            <RichContent content={post.content} />
            {!post.author.isBanned && (
              <MemberSignature text={post.author.signature} image={post.author.signatureImage} />
            )}
            <footer>
              {member && !thread.locked && (
                <QuoteReply author={post.author.username || "Membro"} content={post.content} />
              )}
            </footer>
          </div>
        </article>
      ))}
      {!posts.length && (
        <div className="paper muted">Ainda não há respostas. Comece a conversa!</div>
      )}
      <div className="pagination">
        {page > 1 && <Link href={`?page=${page - 1}`}>← Anterior</Link>}
        {posts.length > 20 && <Link href={`?page=${page + 1}`}>Próxima →</Link>}
      </div>
      {member && (
        <div className="paper">
          <ReportForm type="thread" id={thread.id} />
        </div>
      )}
      <div className="paper reply-wrapper">
        <ReplyForm
          threadId={thread.id}
          threadSlug={thread.slug}
          locked={thread.locked}
          isLoggedIn={!!member}
        />
      </div>
    </ArticleShell>
  );
}
