"use server";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/access";
import { resources } from "@/lib/admin-resources";
import { resourceDb, resourceWhere } from "@/lib/admin-db";
import { revalidatePath } from "next/cache";
import { defaults, mediaUrl } from "@/lib/site";
import type { Prisma } from "@prisma/client";
import { badgeCode, parseRewardCodes, resolveBadge } from "@/lib/badge-import";
export type AdminState = { error?: string; success?: string; id?: string };
function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}
export async function saveResource(_prev: AdminState, form: FormData): Promise<AdminState> {
  try {
    const resource = String(form.get("resource") || "");
    const config = resources[resource];
    if (!config) throw new Error("Seção inválida.");
    const actor = await requireStaff(
      config.adminOnly || !["topicos", "comentarios", "respostas", "denuncias"].includes(resource),
    );
    const id = String(form.get("id") || "");
    const db = resourceDb(resource);
    const existing = id ? await db.findFirst({ where: resourceWhere(resource, id) }) : null;
    if (id && !existing) throw new Error("Registro não encontrado.");
    if (!id && ["usuarios", "topicos", "comentarios", "respostas", "denuncias"].includes(resource))
      throw new Error("Use o formulário público para criar este registro.");
    const data: Record<string, unknown> = {};
    for (const field of config.fields) {
      if (field.name === "rewardCodes") continue;
      const raw = String(form.get(field.name) || "").trim();
      if (field.required && !raw && field.type !== "checkbox")
        throw new Error(`Preencha: ${field.label}.`);
      if (
        raw.length >
        (field.name === "content"
          ? 150000
          : ["title", "name", "code", "slug", "category"].includes(field.name)
            ? 180
            : 3000)
      )
        throw new Error(`Campo muito longo: ${field.label}.`);
      if (field.type === "checkbox") data[field.name] = form.has(field.name);
      else if (field.type === "number") {
        const value = Number(raw || 0);
        if (!Number.isSafeInteger(value) || value < 0 || value > 2000000000)
          throw new Error("Número inválido.");
        data[field.name] = value;
      } else if (field.type === "datetime-local") {
        if (raw) {
          const value = new Date(`${raw}:00-03:00`);
          if (!Number.isFinite(value.getTime())) throw new Error("Data inválida.");
          data[field.name] = value;
        } else if (field.name !== "publishedAt") data[field.name] = null;
      } else if (field.type === "select") {
        if (!field.options?.includes(raw)) throw new Error("Opção inválida.");
        data[field.name] = raw;
      } else if (field.type === "url") {
        if (raw && !mediaUrl(raw)) throw new Error("Use uma URL http/https ou um arquivo local.");
        data[field.name] = raw || null;
      } else data[field.name] = raw;
    }
    if (config.fields.some((f) => f.name === "slug")) {
      const raw = String(data.slug || data.title || data.name);
      data.slug = slugify(raw) || `publicacao-${Date.now()}`;
    }
    if (resource === "usuarios") {
      if (id === actor.id && (data.role !== "ADMIN" || data.isBanned))
        throw new Error("Você não pode remover seu próprio acesso administrativo.");
      if (
        existing?.role === "ADMIN" &&
        (data.role !== "ADMIN" || data.isBanned) &&
        (await prisma.user.count({ where: { role: "ADMIN", isBanned: false } })) <= 1
      )
        throw new Error("Mantenha ao menos um administrador ativo.");
    }
    if (!id && config.kind) {
      data.kind = config.kind;
      data.authorId = actor.id;
      if (resource === "equipe") data.content = "";
    }
    if (!id && resource === "noticias") data.authorId = actor.id;
    const rewardCodes =
      resource === "eventos" ? parseRewardCodes(String(form.get("rewardCodes") || "")) : [];
    if (resource === "eventos" && data.startsAt && data.endsAt && data.endsAt <= data.startsAt)
      throw new Error("O término deve ser posterior ao início.");
    if (resource === "eventos" && data.giftEnabled && !rewardCodes.length)
      throw new Error("Informe os códigos dos emblemas do presente.");
    const rewards = await Promise.all(rewardCodes.map(resolveBadge));
    const row = await prisma.$transaction(
      async (tx) => {
        if (resource === "eventos" && id) {
          const prior = await tx.eventReward.findMany({ where: { eventId: id } });
          const changed =
            prior.length !== rewards.length ||
            prior.some((r) => !rewards.some((e) => e.id === r.emblemId));
          if (changed && (await tx.giftClaim.count({ where: { eventId: id } })))
            throw new Error(
              "Este evento já recebeu resgates. Crie outro evento para alterar os emblemas.",
            );
        }
        const delegate = (
          tx as unknown as Record<
            string,
            {
              update(args: object): Promise<{ id: string }>;
              create(args: object): Promise<{ id: string }>;
            }
          >
        )[config.model];
        const saved = id
          ? await delegate.update({ where: { id }, data })
          : await delegate.create({ data });
        if (resource === "eventos") {
          await tx.eventReward.deleteMany({ where: { eventId: saved.id } });
          if (rewards.length)
            await tx.eventReward.createMany({
              data: rewards.map((e) => ({ eventId: saved.id, emblemId: e.id })),
            });
        }
        await tx.auditLog.create({
          data: {
            actorId: actor.id,
            action: id ? "UPDATE" : "CREATE",
            resource,
            recordId: saved.id,
          },
        });
        return saved;
      },
      { isolationLevel: "Serializable" },
    );
    revalidatePath("/", "layout");
    return { success: "Alterações salvas.", id: row.id };
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "P2002")
      return { error: "Já existe um registro com esse código ou endereço." };
    return {
      error:
        error instanceof Error && !error.message.includes("prisma")
          ? error.message
          : "Não foi possível salvar. Verifique os campos e tente novamente.",
    };
  }
}
export async function deleteResource(_prev: AdminState, form: FormData): Promise<AdminState> {
  try {
    const actor = await requireStaff(true);
    const resource = String(form.get("resource"));
    const id = String(form.get("id"));
    if (!resources[resource] || resource === "usuarios")
      throw new Error("Use a suspensão para desativar uma conta.");
    const row = await resourceDb(resource).findFirst({ where: resourceWhere(resource, id) });
    if (!row) throw new Error("Registro não encontrado.");
    await prisma.$transaction(async (tx) => {
      if (resource === "respostas")
        await tx.forumThread.update({
          where: { id: String(row.threadId) },
          data: { replyCount: { decrement: 1 } },
        });
      if (resource === "topicos")
        await tx.reaction.deleteMany({ where: { targetType: "thread", targetId: id } });
      const model = resources[resource].model;
      const delegate = (
        tx as unknown as Record<string, { delete(args: object): Promise<unknown> }>
      )[model];
      await delegate.delete({ where: { id } });
      await tx.reaction.deleteMany({
        where: { targetId: id, targetType: resource === "noticias" ? "news" : "entry" },
      });
      await tx.auditLog.create({
        data: { actorId: actor.id, action: "DELETE", resource, recordId: id },
      });
    });
    revalidatePath("/", "layout");
    return { success: "Registro excluído." };
  } catch {
    return { error: "Não foi possível excluir. Verifique se existem registros vinculados." };
  }
}
export async function saveSettings(_prev: AdminState, form: FormData): Promise<AdminState> {
  try {
    const actor = await requireStaff(true);
    const data: Record<string, string | number> = {};
    for (const key of Object.keys(defaults)) {
      const value = String(form.get(key) || "").trim();
      if (value.length > 3000) throw new Error("Campo muito longo.");
      if (["logo", "streamUrl", "discord", "hotelUrl"].includes(key) && value && !mediaUrl(value))
        throw new Error("URL inválida.");
      if (key.endsWith("Color") && !/^#[0-9a-f]{6}$/i.test(value)) throw new Error("Cor inválida.");
      data[key] = key === "listeners" ? Math.max(0, Math.min(1000000, Number(value) || 0)) : value;
    }
    if (!data.name) throw new Error("Informe o nome do site.");
    await prisma.$transaction(
      async (tx) => {
        const row = await tx.siteSetting.findUnique({ where: { id: "site" } });
        const previous =
          row?.data && typeof row.data === "object" && !Array.isArray(row.data) ? row.data : {};
        const merged = { ...previous, ...data } as Prisma.InputJsonValue;
        await tx.siteSetting.upsert({
          where: { id: "site" },
          create: { id: "site", data: merged },
          update: { data: merged },
        });
        await tx.auditLog.create({
          data: {
            actorId: actor.id,
            action: "UPDATE",
            resource: "configuracoes",
            recordId: "site",
          },
        });
      },
      { isolationLevel: "Serializable" },
    );
    revalidatePath("/", "layout");
    return { success: "Configurações atualizadas." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Falha ao salvar." };
  }
}
export async function manageUserEmblem(_prev: AdminState, form: FormData): Promise<AdminState> {
  try {
    const actor = await requireStaff(true);
    const userId = String(form.get("userId"));
    const code = String(form.get("badgeCode") || "").trim();
    const emblemId =
      code && form.get("operation") !== "revoke"
        ? (await resolveBadge(code)).id
        : String(form.get("emblemId"));
    const revoke = form.get("operation") === "revoke";
    if (
      !(await prisma.user.findUnique({ where: { id: userId } })) ||
      !(await prisma.emblem.findUnique({ where: { id: emblemId } }))
    )
      throw new Error("Usuário ou emblema não encontrado.");
    await prisma.$transaction(async (tx) => {
      if (revoke) await tx.userEmblem.deleteMany({ where: { userId, emblemId } });
      else
        await tx.userEmblem.upsert({
          where: { userId_emblemId: { userId, emblemId } },
          create: { userId, emblemId },
          update: {},
        });
      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          resource: "inventario",
          action: revoke ? "REVOKE" : "AWARD",
          recordId: `${userId}/${emblemId}`,
        },
      });
    });
    revalidatePath("/", "layout");
    return { success: revoke ? "Emblema removido do perfil." : "Emblema entregue ao membro." };
  } catch (e) {
    return {
      error:
        e instanceof Error && !e.message.includes("prisma")
          ? e.message
          : "Não foi possível alterar o inventário.",
    };
  }
}

export async function importEmblem(_prev: AdminState, form: FormData): Promise<AdminState> {
  try {
    const actor = await requireStaff(true);
    const code = badgeCode(String(form.get("code") || ""));
    const image = String(form.get("image") || "").trim();
    let emblem;
    if (image) {
      if (!/^\/uploads\/[a-f0-9-]+\.(png|jpg|gif|webp)$/i.test(image))
        throw new Error("Envie uma imagem PNG, JPEG, GIF ou WebP pelo campo de upload.");
      const name = String(form.get("name") || code)
        .trim()
        .slice(0, 180);
      emblem = await prisma.emblem.create({ data: { code, name, image } });
    } else emblem = await resolveBadge(code);
    await prisma.auditLog.create({
      data: { actorId: actor.id, action: "IMPORT", resource: "emblemas", recordId: emblem.id },
    });
    revalidatePath("/", "layout");
    return {
      success: "Emblema disponível no catálogo e para entrega aos usuários.",
      id: emblem.id,
    };
  } catch (e) {
    if (typeof e === "object" && e && "code" in e && e.code === "P2002")
      return { error: "Esse código já existe. Escolha outro código para sua imagem." };
    return {
      error:
        e instanceof Error && !e.message.includes("prisma")
          ? e.message
          : "Não foi possível cadastrar o emblema.",
    };
  }
}
