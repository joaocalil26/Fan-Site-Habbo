"use server";

import { currentMember } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addUserXp } from "@/lib/queries";

function slugify(text: string) {
  const base = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  return `${base}-${Date.now().toString(36)}`;
}

export type ForumActionState = {
  error?: string;
  success?: string;
};

export async function createThreadAction(
  _prev: ForumActionState,
  formData: FormData,
): Promise<ForumActionState> {
  const member = await currentMember();
  const session = member ? { user: member } : null;
  if (!session?.user?.id) {
    return { error: "Faça login para criar um tópico." };
  }

  const title = String(formData.get("title") || "").trim();
  const content = String(formData.get("content") || "").trim();
  const categoryId = String(formData.get("categoryId") || "").trim();

  if (title.length < 5 || title.length > 150) return { error: "Título muito curto (mín. 5)." };
  if (content.length < 10 || content.length > 30000)
    return { error: "Conteúdo muito curto (mín. 10)." };
  if (!categoryId) return { error: "Escolha uma categoria." };

  let slug: string;
  try {
    const recent = await prisma.forumThread.findFirst({
      where: { authorId: session.user.id, createdAt: { gt: new Date(Date.now() - 30000) } },
    });
    if (recent) return { error: "Aguarde 30 segundos entre os tópicos." };
    const category = await prisma.forumCategory.findUnique({
      where: { id: categoryId },
    });
    if (!category) return { error: "Categoria inválida." };

    slug = slugify(title);
    await prisma.forumThread.create({
      data: {
        title,
        slug,
        content,
        categoryId,
        authorId: session.user.id,
        replyCount: 0,
      },
    });

    try {
      await addUserXp(session.user.id, 25);
    } catch {
      /* XP opcional se rank thresholds falharem */
    }
  } catch (e) {
    console.error("[createThread]", e);
    return { error: "Erro ao criar tópico. Banco conectado?" };
  }

  revalidatePath("/");
  revalidatePath("/forum");
  redirect(`/forum/${slug}`);
}

export async function createReplyAction(
  _prev: ForumActionState,
  formData: FormData,
): Promise<ForumActionState> {
  const member = await currentMember();
  const session = member ? { user: member } : null;
  if (!session?.user?.id) {
    return { error: "Faça login para responder." };
  }

  const threadId = String(formData.get("threadId") || "");
  const content = String(formData.get("content") || "").trim();
  const threadSlug = String(formData.get("threadSlug") || "");

  if (!threadId || content.length < 2 || content.length > 10000) {
    return { error: "Escreva uma resposta." };
  }

  try {
    const recent = await prisma.forumPost.findFirst({
      where: { authorId: session.user.id, createdAt: { gt: new Date(Date.now() - 15000) } },
    });
    if (recent) return { error: "Aguarde 15 segundos entre as respostas." };
    const thread = await prisma.forumThread.findUnique({
      where: { id: threadId },
    });
    if (!thread) return { error: "Tópico não encontrado." };
    if (thread.locked) return { error: "Este tópico está fechado." };

    await prisma.$transaction(async (tx) => {
      await tx.forumPost.create({
        data: {
          threadId,
          authorId: session.user!.id,
          content,
        },
      });
      await tx.forumThread.update({
        where: { id: threadId },
        data: {
          replyCount: { increment: 1 },
          lastPostAt: new Date(),
        },
      });
    });

    try {
      await addUserXp(session.user.id, 10);
    } catch {
      /* ignore */
    }
  } catch (e) {
    console.error("[createReply]", e);
    return { error: "Erro ao enviar resposta." };
  }

  const savedThread = await prisma.forumThread.findUnique({
    where: { id: threadId },
    select: { slug: true },
  });
  const safeSlug = savedThread?.slug || encodeURIComponent(threadSlug);
  revalidatePath("/");
  revalidatePath(`/forum/${safeSlug}`);
  redirect(`/forum/${safeSlug}`);
}
