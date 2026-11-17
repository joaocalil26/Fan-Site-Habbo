"use server";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/access";
import { seasons, type Season } from "@/lib/seasonal-config";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
export type AppearanceState = { error?: string; success?: string };
export async function saveAppearance(
  _previous: AppearanceState,
  form: FormData,
): Promise<AppearanceState> {
  try {
    const actor = await requireStaff(true);
    const theme = String(form.get("theme") || "");
    if (!Object.prototype.hasOwnProperty.call(seasons, theme))
      return { error: "Escolha um tema válido." };
    const seasonal = { theme: theme as Season, motion: form.get("motion") === "on" };
    await prisma.$transaction(
      async (tx) => {
        const row = await tx.siteSetting.findUnique({ where: { id: "site" } });
        const previous =
          row?.data && typeof row.data === "object" && !Array.isArray(row.data) ? row.data : {};
        const data = { ...previous, seasonal } as Prisma.InputJsonValue;
        await tx.siteSetting.upsert({
          where: { id: "site" },
          create: { id: "site", data },
          update: { data },
        });
        await tx.auditLog.create({
          data: { actorId: actor.id, action: "UPDATE", resource: "aparencia", recordId: theme },
        });
      },
      { isolationLevel: "Serializable" },
    );
    revalidatePath("/", "layout");
    return {
      success:
        theme === "none"
          ? "Efeitos sazonais desligados."
          : `Tema ${seasons[theme as Season].label} ativado no site.`,
    };
  } catch {
    return { error: "Não foi possível aplicar o tema. Verifique sua permissão de administrador." };
  }
}
