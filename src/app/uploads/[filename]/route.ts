import { readFile } from "node:fs/promises";
import { join } from "node:path";
export const runtime = "nodejs";
const types: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  mp3: "audio/mpeg",
  ogg: "audio/ogg",
  wav: "audio/wav",
};
export async function GET(request: Request, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params;
  const match = filename.match(
    /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.(png|jpg|gif|webp|mp3|ogg|wav)$/i,
  );
  if (!match) return new Response("Arquivo não encontrado.", { status: 404 });
  try {
    const data = await readFile(join(process.cwd(), "public", "uploads", filename));
    const headers: Record<string, string> = {
      "Content-Type": types[match[1].toLowerCase()],
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Accept-Ranges": "bytes",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    };
    const range = request.headers.get("range");
    if (range) {
      const parsed = range.match(/^bytes=(\d*)-(\d*)$/);
      let start = 0;
      let end = data.length - 1;
      if (parsed?.[1]) {
        start = Number(parsed[1]);
        if (parsed[2]) end = Math.min(Number(parsed[2]), end);
      } else if (parsed?.[2]) start = Math.max(0, data.length - Number(parsed[2]));
      if (
        !parsed ||
        !Number.isSafeInteger(start) ||
        !Number.isSafeInteger(end) ||
        start > end ||
        start >= data.length
      )
        return new Response(null, {
          status: 416,
          headers: { "Content-Range": `bytes */${data.length}` },
        });
      headers["Content-Range"] = `bytes ${start}-${end}/${data.length}`;
      headers["Content-Length"] = String(end - start + 1);
      return new Response(new Uint8Array(data.subarray(start, end + 1)), { status: 206, headers });
    }
    headers["Content-Length"] = String(data.length);
    return new Response(new Uint8Array(data), { headers });
  } catch {
    return new Response("Arquivo não encontrado.", { status: 404 });
  }
}
