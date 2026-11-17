import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/access";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    await requireStaff(true);
    const origin = request.headers.get("origin");
    if (!origin || origin !== new URL(request.url).origin)
      return NextResponse.json({ error: "Origem inválida." }, { status: 403 });
    if (Number(request.headers.get("content-length")) > 21 * 1024 * 1024)
      return NextResponse.json({ error: "Arquivo muito grande (máximo 20 MB)." }, { status: 413 });
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size > 20 * 1024 * 1024 || file.size < 8)
      return NextResponse.json({ error: "Arquivo inválido ou maior que 20 MB." }, { status: 400 });
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
    else if (
      data.subarray(0, 3).toString() === "ID3" ||
      (data[0] === 255 && (data[1] & 224) === 224)
    )
      ext = "mp3";
    else if (data.subarray(0, 4).toString() === "OggS") ext = "ogg";
    else if (
      data.subarray(0, 4).toString() === "RIFF" &&
      data.subarray(8, 12).toString() === "WAVE"
    )
      ext = "wav";
    if (!ext)
      return NextResponse.json(
        { error: "Formato não permitido. Use PNG, JPEG, GIF, WebP, MP3, OGG ou WAV." },
        { status: 400 },
      );
    const dir = join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    const name = `${randomUUID()}.${ext}`;
    await writeFile(join(dir, name), data, { flag: "wx" });
    return NextResponse.json({ url: `/uploads/${name}` });
  } catch {
    return NextResponse.json({ error: "Envio não autorizado ou indisponível." }, { status: 403 });
  }
}
