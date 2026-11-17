import { prisma } from "@/lib/prisma";
import { normalizeSeasonal } from "./seasonal-config";
export async function getSeasonalConfig() {
  const row = await prisma.siteSetting.findUnique({ where: { id: "site" } });
  const data = row?.data;
  return normalizeSeasonal(
    data && typeof data === "object" && !Array.isArray(data) ? data.seasonal : null,
  );
}
