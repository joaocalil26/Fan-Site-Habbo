import { redirect } from "next/navigation";
import { currentMember } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import NewThreadForm from "@/components/NewThreadForm";
import ArticleShell from "@/components/ArticleShell";
export const dynamic = "force-dynamic";
export default async function Page() {
  const user = await currentMember();
  if (!user) redirect("/login?callbackUrl=/forum/novo");
  const categories = await prisma.forumCategory.findMany({
    orderBy: { order: "asc" },
    select: { id: true, name: true },
  });
  return (
    <ArticleShell section="Novo tópico">
      <div className="paper">
        <h1>Comece uma conversa</h1>
        <p className="muted">Respeite os outros membros e compartilhe algo com a comunidade.</p>
        <NewThreadForm categories={categories} />
      </div>
    </ArticleShell>
  );
}
