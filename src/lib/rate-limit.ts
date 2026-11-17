import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
export async function allowAttempt(
  scope: string,
  identity: string,
  maximum: number,
  windowMs: number,
) {
  const key = createHash("sha256").update(`${scope}:${identity}`).digest("hex");
  const now = new Date();
  await prisma.authThrottle.deleteMany({
    where: { expiresAt: { lt: new Date(Date.now() - 24 * 3600000) } },
  });
  await prisma.authThrottle.updateMany({
    where: { key, expiresAt: { lte: now } },
    data: { count: 0, expiresAt: new Date(now.getTime() + windowMs) },
  });
  const row = await prisma.authThrottle.upsert({
    where: { key },
    create: { key, count: 1, expiresAt: new Date(now.getTime() + windowMs) },
    update: { count: { increment: 1 } },
  });
  return row.count <= maximum;
}
