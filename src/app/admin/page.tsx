import Link from "next/link";
import { requireStaffPage as requireStaff } from "@/lib/access";
import { prisma } from "@/lib/prisma";
export default async function AdminPage() {
  await requireStaff();
  const counts = await Promise.all([
    prisma.user.count(),
    prisma.news.count(),
    prisma.forumThread.count(),
    prisma.contentEntry.count(),
  ]);
  return (
    <>
      <div className="admin-page-title">
        <span>SEU FÃ-SITE, DO SEU JEITO</span>
        <h1>Bem-vindo ao IdBlet</h1>
        <p>Publique conteúdo, cuide da comunidade e acompanhe o que acontece.</p>
      </div>
      <div className="admin-stats">
        {["Membros", "Notícias", "Tópicos", "Publicações"].map((label, i) => (
          <div key={label}>
            <strong>{counts[i]}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <div className="paper">
        <h2>Comece por aqui</h2>
        <div className="admin-shortcuts">
          <Link href="/admin/noticias?novo=1">Escrever notícia →</Link>
          <Link href="/admin/eventos?novo=1">Criar evento →</Link>
          <Link href="/admin/galeria?novo=1">Publicar arte →</Link>
          <Link href="/admin/configuracoes">Configurar rádio e identidade →</Link>
        </div>
      </div>
      <div className="paper">
        <h2>Como publicar</h2>
        <p>
          Escolha uma seção, crie seu conteúdo e marque “Publicado no site”. Desmarque essa opção
          para guardar um rascunho. O campo de conteúdo aceita Markdown e nunca executa HTML ou
          scripts.
        </p>
      </div>
    </>
  );
}
