"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logoutAction } from "@/actions/auth";
import type { SiteConfig } from "@/lib/site";
import Icon from "./Icon";
type UserProp = { id: string; name?: string | null; username?: string; role?: string } | null;
const links = [
  ["/", "Início"],
  ["/noticias", "Notícias"],
  ["/forum", "Comunidade"],
  ["/eventos", "Eventos"],
  ["/galeria", "Galeria"],
];
export default function HeaderClient({ user, site }: { user: UserProp; site: SiteConfig }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => {
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);
  const current = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  return (
    <header className="studio-header brand-header">
      <div className="brand-inner">
        <Link href="/" className="brand-logo" aria-label={`${site.name} — início`}>
          <img src={site.logo || "/idblet.svg"} alt={site.name} />
        </Link>
        <nav className="brand-nav" aria-label="Navegação principal">
          {links.map(([href, label]) => (
            <Link href={href} key={href} aria-current={current(href) ? "page" : undefined}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="brand-actions">
          <Link href="/podcasts" className="header-radio-link">
            <Icon name="headphones" size={18} />
            <span>Na frequência</span>
          </Link>
          {user && ["ADMIN", "MODERATOR"].includes(user.role || "") && (
            <Link href="/admin" className="brand-admin">
              Painel
            </Link>
          )}
          <Link className="brand-login" href={user ? "/perfil" : "/login"}>
            <Icon name="user" size={16} />
            <span>{user ? user.username || user.name : "Entrar"}</span>
            <Icon name="arrow" size={15} />
          </Link>
          {user && (
            <form action={logoutAction} className="desktop-logout">
              <button aria-label="Sair da conta" title="Sair da conta">
                <Icon name="external" size={16} />
              </button>
            </form>
          )}
          <button
            className="nav-toggle"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            onClick={() => setOpen(!open)}
          >
            <Icon name={open ? "close" : "menu"} />
          </button>
        </div>
      </div>
      {open && (
        <nav className="mobile-navigation" id="mobile-navigation" aria-label="Navegação móvel">
          {[
            ...links,
            ["/emblemas", "Emblemas"],
            ["/valores", "Valores"],
            ["/mobis", "Mobis"],
            ["/podcasts", "Podcasts"],
            ["/ranking", "Ranking"],
            ["/equipe", "Equipe"],
          ].map(([href, label]) => (
            <Link
              href={href}
              key={href}
              aria-current={current(href) ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              {label}
              <Icon name="arrow" size={16} />
            </Link>
          ))}
          {user && ["ADMIN", "MODERATOR"].includes(user.role || "") && (
            <Link href="/admin" onClick={() => setOpen(false)}>
              Painel administrativo
              <Icon name="arrow" size={16} />
            </Link>
          )}
          {user && (
            <form action={logoutAction}>
              <button>Sair da conta</button>
            </form>
          )}
        </nav>
      )}
    </header>
  );
}
