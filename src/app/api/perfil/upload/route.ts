import { NextResponse } from "next/server";
import { currentMember } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";
export async function POST(request: Request) {
  const member = await currentMember();
  if (!member)
    return NextResponse.json({ error: "Entre na sua conta para enviar imagens." }, { status: 401 });
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return NextResponse.json({ error: "Origem inválida." }, { status: 403 });
  if (Number(request.headers.get("content-length")) > 3 * 1024 * 1024)
    return NextResponse.json({ error: "Use uma imagem de até 2 MB." }, { status: 413 });
  try {
    const key = `profile-upload:${member.id}`;
    const now = new Date();
    await prisma.authThrottle.deleteMany({ where: { key, expiresAt: { lte: now } } });
    const quota = await prisma.authThrottle.upsert({
      where: { key },
      create: { key, count: 1, expiresAt: new Date(Date.now() + 60000) },
      update: { count: { increment: 1 } },
    });
    if (quota.count > 10)
      return NextResponse.json(
        { error: "Aguarde um minuto para enviar mais imagens." },
        { status: 429 },
      );
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size > 2 * 1024 * 1024 || file.size < 12)
      return NextResponse.json({ error: "Use uma imagem de até 2 MB." }, { status: 400 });
    const data = Buffer.from(await file.arrayBuffer());
    let ext = "";
    if (data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) ext = "png";
    else if (data[0] === 255 && data[1] === 216 && data[2] === 255) ext = "jpg";
    else if (["GIF87a", "GIF89a"].includes(data.subarray(0, 6).toString())) ext = "gif";
    else if (
      data.subarray(0, 4).toString() === "RIFF" &&
      data.subarray(8, 12).toString() === "WEBP"
    )
      ext = "webp";
    if (!ext)
      return NextResponse.json(
        { error: "Formato não permitido. Use PNG, JPEG, GIF ou WebP." },
        { status: 400 },
      );
    const dir = join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    const name = `${randomUUID()}.${ext}`;
    await writeFile(join(dir, name), data, { flag: "wx" });
    return NextResponse.json({ url: `/uploads/${name}` });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível enviar a imagem. Tente novamente." },
      { status: 400 },
    );
  }
}
