import type { Metadata } from "next";
import type { CSSProperties } from "react";
import "./globals.css";
import "./fonts.css";
import "./idblet.css";
import "./golden.css";
import "./seasonal.css";
import SeasonalDecor from "@/components/SeasonalDecor";
import { getSeasonalConfig } from "@/lib/seasonal";
import ActiveGifts from "@/components/ActiveGifts";
import "./community.css";
import Header from "@/components/Header";
import RadioPlayer from "@/components/RadioPlayer";
import SiteFooter from "@/components/SiteFooter";
import { getSiteConfig } from "@/lib/site";
export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteConfig();
  return {
    title: { default: `${site.name} • ${site.tagline}`, template: `%s • ${site.name}` },
    description: site.description,
    authors: [{ name: "João Calil", url: "https://joaocalildev.vercel.app/" }],
    creator: "João Calil",
    icons: { icon: "/icon.svg", shortcut: "/icon.svg" },
  };
}
export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [site, seasonal] = await Promise.all([getSiteConfig(), getSeasonalConfig()]);
  return (
    <html
      lang="pt-BR"
      style={
        { "--site-primary": site.primaryColor, "--site-dark": site.darkColor } as CSSProperties
      }
    >
      <body data-season={seasonal.theme} className="min-h-screen flex flex-col antialiased">
        <SeasonalDecor config={seasonal} />
        <Header />
        <main className="flex-1">{children}</main>
        <SiteFooter site={site} />
        <RadioPlayer site={site} />
        <ActiveGifts />
      </body>
    </html>
  );
}
