"use server";
import { prisma } from "@/lib/prisma";
import { currentMember } from "@/lib/access";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { signOut } from "@/auth";
import { profileImage } from "@/lib/profile";
export type CommunityState = { error?: string; success?: string };
async function publishedTarget(type: string, id: string) {
  if (type === "news")
    return !!(await prisma.news.findFirst({
      where: { id, published: true, publishedAt: { lte: new Date() } },
      select: { id: true },
    }));
  if (type === "entry")
    return !!(await prisma.contentEntry.findFirst({
      where: { id, published: true },
      select: { id: true },
    }));
  if (type === "thread")
    return !!(await prisma.forumThread.findUnique({ where: { id }, select: { id: true } }));
  return false;
}
export async function postComment(_prev: CommunityState, form: FormData): Promise<CommunityState> {
  const user = await currentMember();
  if (!user) return { error: "Entre na sua conta para comentar." };
  const type = String(form.get("type"));
  const id = String(form.get("id"));
  const content = String(form.get("content") || "").trim();
  if (!["news", "entry"].includes(type) || content.length < 2 || content.length > 3000)
    return { error: "Escreva entre 2 e 3.000 caracteres." };
  if (!(await publishedTarget(type, id))) return { error: "Publicação não encontrada." };
  const recent = await prisma.comment.findFirst({
    where: { authorId: user.id, createdAt: { gt: new Date(Date.now() - 15000) } },
  });
  if (recent) return { error: "Aguarde 15 segundos entre os comentários." };
  await prisma.comment.create({
    data: { content, authorId: user.id, ...(type === "news" ? { newsId: id } : { entryId: id }) },
  });
  revalidatePath("/", "layout");
  return { success: "Comentário publicado." };
}
export async function toggleReaction(
  _prev: CommunityState,
  form: FormData,
): Promise<CommunityState> {
  const user = await currentMember();
  if (!user) return { error: "Entre na sua conta para curtir." };
  const targetType = String(form.get("type"));
  const targetId = String(form.get("id"));
  if (!(await publishedTarget(targetType, targetId)))
    return { error: "Publicação não encontrada." };
  const where = { userId_targetType_targetId: { userId: user.id, targetType, targetId } };
  const existing = await prisma.reaction.findUnique({ where });
  if (existing) await prisma.reaction.deleteMany({ where: { id: existing.id, userId: user.id } });
  else
    await prisma.reaction.upsert({
      where,
      create: { userId: user.id, targetType, targetId },
      update: {},
    });
  revalidatePath("/", "layout");
  return { success: existing ? "Curtida removida." : "Você curtiu esta publicação." };
}
export async function updateProfile(
  _prev: CommunityState,
  form: FormData,
): Promise<CommunityState> {
  const user = await currentMember();
  if (!user) return { error: "Entre na sua conta." };
  const name = String(form.get("name") || "").trim();
  const bio = String(form.get("bio") || "").trim();
  if (name.length > 80 || bio.length > 1000)
    return { error: "Nome: máximo 80 caracteres. Biografia: máximo 1.000." };
  const signature = form.has("signature") ? String(form.get("signature") || "").trim() : undefined;
  if (signature && signature.length > 1000)
    return { error: "A assinatura deve ter até 1.000 caracteres." };
  const images: Record<string, string | null> = {};
  for (const key of ["avatar", "coverImage", "signatureImage"]) {
    if (!form.has(key)) continue;
    const value = String(form.get(key) || "").trim();
    if (value && !profileImage(value))
      return {
        error:
          "Use uma imagem PNG, JPEG, GIF ou WebP enviada pelo formulário, ou uma URL HTTPS de imagem.",
      };
    images[key] = value || null;
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { name, bio, ...(signature !== undefined ? { signature } : {}), ...images },
  });
  revalidatePath("/", "layout");
  return { success: "Perfil atualizado." };
}
export async function changePassword(
  _prev: CommunityState,
  form: FormData,
): Promise<CommunityState> {
  const user = await currentMember();
  if (!user) return { error: "Entre na sua conta." };
  const current = String(form.get("currentPassword") || "");
  const password = String(form.get("newPassword") || "");
  if (password.length < 10 || password.length > 72)
    return { error: "Use uma nova senha com 10 a 72 caracteres." };
  const row = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });
  if (!row?.passwordHash || !(await bcrypt.compare(current, row.passwordHash)))
    return { error: "Senha atual incorreta." };
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(password, 12), sessionVersion: { increment: 1 } },
  });
  await signOut({ redirectTo: "/login" });
  return { success: "Senha atualizada. Entre novamente." };
}
export async function reportContent(
  _prev: CommunityState,
  form: FormData,
): Promise<CommunityState> {
  const user = await currentMember();
  if (!user) return { error: "Entre para enviar uma denúncia." };
  const targetType = String(form.get("type"));
  const targetId = String(form.get("id"));
  const content = String(form.get("content") || "").trim();
  if (
    content.length < 10 ||
    content.length > 1500 ||
    !(await publishedTarget(targetType, targetId))
  )
    return { error: "Informe um motivo entre 10 e 1.500 caracteres para uma publicação válida." };
  if (
    await prisma.report.findFirst({
      where: { userId: user.id, targetId, status: { not: "Resolvida" } },
    })
  )
    return { error: "Sua denúncia desta publicação já está em análise." };
  await prisma.report.create({ data: { userId: user.id, targetType, targetId, content } });
  return { success: "A moderação recebeu sua denúncia." };
}
