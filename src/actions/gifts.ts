"use server";

import { prisma } from "@/lib/prisma";
import { currentMember } from "@/lib/access";
import { revalidatePath } from "next/cache";

export type GiftState = {
  error?: string;
  success?: string;
  badges?: { name: string; image: string }[];
};

export async function claimGift(_previous: GiftState, form: FormData): Promise<GiftState> {
  const member = await currentMember();
  if (!member) return { error: "Entre na sua conta para abrir o presente." };
  const eventId = String(form.get("eventId") || "").slice(0, 100);
  try {
    const badges = await prisma.$transaction(
      async (tx) => {
        const event = await tx.contentEntry.findUnique({
          where: { id: eventId },
          include: { rewards: { include: { emblem: true } } },
        });
        const now = new Date();
        if (
          !event ||
          event.kind !== "EVENT" ||
          !event.published ||
          !event.giftEnabled ||
          !event.rewards.length ||
          event.status === "Finalizado" ||
          (event.startsAt && event.startsAt > now) ||
          (event.endsAt && event.endsAt <= now)
        )
          throw new Error("Este presente não está disponível.");
        const user = await tx.user.findUnique({
          where: { id: member.id },
          select: { isBanned: true, sessionVersion: true },
        });
        if (!user || user.isBanned || user.sessionVersion !== member.sessionVersion)
          throw new Error("Sua sessão não está disponível.");
        await tx.giftClaim.create({ data: { eventId, userId: member.id } });
        await tx.userEmblem.createMany({
          data: event.rewards.map((r) => ({ userId: member.id, emblemId: r.emblemId })),
          skipDuplicates: true,
        });
        await tx.auditLog.create({
          data: { actorId: member.id, action: "CLAIM", resource: "presentes", recordId: eventId },
        });
        return event.rewards.map((r) => ({ name: r.emblem.name, image: r.emblem.image }));
      },
      { isolationLevel: "Serializable" },
    );
    revalidatePath("/", "layout");
    return { success: "Presente aberto! Os emblemas estão no seu perfil IdBlet.", badges };
  } catch (e) {
    if (typeof e === "object" && e && "code" in e && e.code === "P2002")
      return { error: "Você já resgatou este presente." };
    if (typeof e === "object" && e && "code" in e && e.code === "P2034")
      return { error: "Outro resgate está sendo processado. Tente novamente." };
    return {
      error:
        e instanceof Error && !e.message.includes("prisma")
          ? e.message
          : "Não foi possível resgatar. Tente novamente.",
    };
  }
}
