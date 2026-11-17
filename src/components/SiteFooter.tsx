import Link from "next/link";
import type { SiteConfig } from "@/lib/site";
import Icon from "./Icon";
export default function SiteFooter({ site }: { site: SiteConfig }) {
  return (
    <footer className="site-footer brand-footer">
      <div className="footer-frame">
        <div className="footer-main">
          <div className="footer-about">
            <Link href="/" className="footer-brand">
              <span className="footer-monogram">iB</span>
              <strong>
                {site.name}
                <em>.</em>
              </strong>
            </Link>
            <p>
              Mais que um fã-site.
              <br />
              Um universo de boas conexões.
            </p>
            <span className="footer-tagline">
              <span />
              Feito de gente. Feito pra você.
            </span>
          </div>
          <div className="footer-nav-group">
            <span>EXPLORE</span>
            <Link href="/noticias">Notícias</Link>
            <Link href="/eventos">Eventos</Link>
            <Link href="/galeria">Galeria</Link>
            <Link href="/podcasts">Podcasts</Link>
          </div>
          <div className="footer-nav-group">
            <span>SE CONECTE</span>
            <Link href="/forum">Comunidade</Link>
            <Link href="/equipe">Nossa equipe</Link>
            <Link href="/ranking">Ranking</Link>
            {site.discord && (
              <a href={site.discord} rel="noopener noreferrer">
                Nosso Discord
                <Icon name="external" size={12} />
              </a>
            )}
          </div>
          <div className="footer-nav-group">
            <span>SEU IDBLET</span>
            <Link href="/pagina/sobre">Nossa história</Link>
            <Link href="/emblemas">Emblemas</Link>
            <Link href="/valores">Valores</Link>
            <Link href="/perfil">Meu perfil</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} {site.name}. {site.tagline}
          </span>
          <div>
            <Link href="/pagina/regras">Regras da casa</Link>
            <Link href="/pagina/privacidade">Privacidade</Link>
            <span className="developer-credit">
              Desenvolvido por{" "}
              <a href="https://joaocalildev.vercel.app/" target="_blank" rel="noopener noreferrer">
                João Calil
              </a>
            </span>
          </div>
        </div>
        <p className="footer-disclaimer">{site.footer}</p>
      </div>
    </footer>
  );
}
