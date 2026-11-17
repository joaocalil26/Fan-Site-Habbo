import { prisma } from "@/lib/prisma";

export function badgeCode(value: string) {
  const code = value.trim();
  if (!/^[A-Z0-9_]{2,40}$/i.test(code))
    throw new Error("Código inválido. Use letras, números ou sublinhado.");
  return code;
}

export async function resolveBadge(value: string) {
  const code = badgeCode(value);
  const existing = await prisma.emblem.findUnique({ where: { code } });
  if (existing) return existing;
  for (const ext of ["gif", "png"]) {
    const image = `https://images.habbo.com/c_images/album1584/${code}.${ext}`;
    let response: Response;
    try {
      response = await fetch(image, {
        signal: AbortSignal.timeout(6000),
        redirect: "error",
        cache: "no-store",
      });
    } catch {
      continue;
    }
    const valid =
      response.ok && /image\/(gif|png)/i.test(response.headers.get("content-type") || "");
    await response.body?.cancel();
    if (valid)
      return prisma.emblem.upsert({
        where: { code },
        create: { code, name: code, image },
        update: {},
      });
  }
  throw new Error(`Emblema ${code} não encontrado no Habbo. Confira o código ou envie uma imagem.`);
}

export function parseRewardCodes(value: string) {
  if (value.length > 2000) throw new Error("Lista de códigos muito longa.");
  const codes = [
    ...new Set(
      value
        .split(/[\s,;]+/)
        .filter(Boolean)
        .map(badgeCode),
    ),
  ];
  if (codes.length > 20) throw new Error("Use até 20 emblemas por evento.");
  return codes;
}
