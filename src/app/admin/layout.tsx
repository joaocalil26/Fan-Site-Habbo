import Link from "next/link";
import { redirect } from "next/navigation";
import { currentMember } from "@/lib/access";
import { resources } from "@/lib/admin-resources";
export const dynamic = "force-dynamic";
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await currentMember();
  if (!user) redirect("/login");
  if (!["ADMIN", "MODERATOR"].includes(user.role)) redirect("/acesso-restrito");
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link href="/admin" className="admin-brand">
          IdBlet <small>PAINEL</small>
        </Link>
        <p>
          {user.username || user.name} · {user.role}
        </p>
        <nav>
          <Link href="/admin">Visão geral</Link>
          {Object.entries(resources)
            .filter(
              ([key]) =>
                user.role === "ADMIN" ||
                ["topicos", "comentarios", "respostas", "denuncias"].includes(key),
            )
            .map(([key, config]) => (
              <Link href={`/admin/${key}`} key={key}>
                {config.label}
              </Link>
            ))}
          {user.role === "ADMIN" && (
            <>
              <Link href="/admin/radio">Rádio e AutoDJ</Link>
              <Link href="/admin/aparencia">Temas e efeitos</Link>
              <Link href="/admin/configuracoes">Configurações e rádio</Link>
              <Link href="/admin/auditoria">Histórico de alterações</Link>
            </>
          )}
          <Link href="/">↗ Abrir site</Link>
        </nav>
      </aside>
      <div className="admin-main">{children}</div>
    </div>
  );
}
