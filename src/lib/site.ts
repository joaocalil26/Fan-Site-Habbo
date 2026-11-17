import { prisma } from "@/lib/prisma";
export const defaults = {
  name: "IdBlet",
  tagline: "Seu lugar na comunidade.",
  description: "Notícias, eventos, arte e rádio. Um fã-site feito por quem vive a comunidade.",
  logo: "/idblet.svg",
  primaryColor: "#e9ad4b",
  darkColor: "#292f27",
  streamUrl: "",
  dj: "AutoDJ",
  show: "IdBlet no ar",
  listeners: 0,
  discord: "",
  hotelUrl: "",
  footer:
    "IdBlet é um fã-site independente. Não possuímos vínculo com o hotel ou com outros fã-sites.",
};
export type SiteConfig = typeof defaults;
export async function getSiteConfig(): Promise<SiteConfig> {
  const row = await prisma.siteSetting.findUnique({ where: { id: "site" } });
  return { ...defaults, ...(row?.data as Partial<SiteConfig> | undefined) };
}
export function mediaUrl(value: string | null | undefined) {
  if (!value) return "";
  if (/^\/(?!\/)/.test(value)) return value;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? value : "";
  } catch {
    return "";
  }
}
export const entryPaths = {
  EVENT: "eventos",
  ART: "galeria",
  PODCAST: "podcasts",
  PAGE: "pagina",
  TEAM: "equipe",
  BANNER: "banners",
} as const;
