"use server";
import { requireStaff } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
export type RadioState = { error?: string; success?: string };
export async function saveRadio(_previous: RadioState, form: FormData): Promise<RadioState> {
  try {
    const actor = await requireStaff(true);
    const mode = String(form.get("mode") || "stream");
    if (mode !== "stream" && mode !== "off") return { error: "Modo de rádio inválido." };
    let streamUrl = "";
    if (mode === "stream") {
      const raw = String(form.get("streamUrl") || "").trim();
      if (!raw || raw.length > 2048 || /[\r\n]/.test(raw))
        return { error: "Informe a URL direta do seu streaming." };
      try {
        const url = new URL(raw);
        if (!["http:", "https:"].includes(url.protocol) || url.username || url.password)
          throw new Error();
        streamUrl = url.href;
      } catch {
        return { error: "Use um endereço HTTP ou HTTPS válido, sem usuário e senha na URL." };
      }
      if (process.env.AUTH_URL?.startsWith("https:") && streamUrl.startsWith("http:"))
        return {
          error:
            "O site usa HTTPS. Configure também um streaming HTTPS para o navegador permitir a reprodução.",
        };
    }
    const show = String(form.get("show") || "IdBlet no ar").trim();
    if (show.length > 120) return { error: "Use até 120 caracteres no nome do programa." };
    await prisma.$transaction(
      async (tx) => {
        const row = await tx.siteSetting.findUnique({ where: { id: "site" } });
        const previous =
          row?.data && typeof row.data === "object" && !Array.isArray(row.data) ? row.data : {};
        const data = {
          ...previous,
          streamUrl,
          ...(mode === "stream" ? { dj: "AutoDJ", show: show || "IdBlet no ar" } : {}),
        } as Prisma.InputJsonValue;
        await tx.siteSetting.upsert({
          where: { id: "site" },
          create: { id: "site", data },
          update: { data },
        });
        await tx.auditLog.create({
          data: {
            actorId: actor.id,
            resource: "radio",
            action: mode === "stream" ? "CONNECT" : "DISABLE",
            recordId: "site",
          },
        });
      },
      { isolationLevel: "Serializable" },
    );
    revalidatePath("/", "layout");
    return {
      success:
        mode === "off"
          ? "Rádio desativada no site."
          : "Streaming conectado ao AutoDJ. Abra o site e clique em play para ouvir.",
    };
  } catch {
    return {
      error: "Não foi possível atualizar a rádio. Verifique sua permissão de administrador.",
    };
  }
}
