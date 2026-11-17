import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaffPage as requireStaff } from "@/lib/access";
import { resources } from "@/lib/admin-resources";
import { resourceDb, resourceWhere } from "@/lib/admin-db";
import { prisma } from "@/lib/prisma";
import AdminEditor, { AwardEmblemForm, ImportEmblemForm } from "@/components/AdminEditor";
export default async function ResourcePage({
  params,
  searchParams,
}: {
  params: Promise<{ resource: string }>;
  searchParams: Promise<{ edit?: string; novo?: string; q?: string; page?: string }>;
}) {
  const { resource } = await params;
  const config = resources[resource];
  if (!config) notFound();
  const user = await requireStaff(
    config.adminOnly || !["topicos", "comentarios", "respostas", "denuncias"].includes(resource),
  );
  const sp = await searchParams;
  const db = resourceDb(resource);
  const page = Math.max(1, Math.min(10000, Number(sp.page) || 1));
  const editable = sp.edit || sp.novo;
  const emblems =
    resource === "usuarios" && sp.edit
      ? await prisma.emblem.findMany({
          select: { id: true, name: true, code: true },
          orderBy: { name: "asc" },
        })
      : [];
  const row = sp.edit ? await db.findFirst({ where: resourceWhere(resource, sp.edit) }) : null;
  if (sp.edit && !row) notFound();
  const initial: Record<string, string | number | boolean | null> = {};
  if (row) {
    initial.id = row.id;
    for (const f of config.fields) {
      const v = row[f.name];
      initial[f.name] =
        v instanceof Date
          ? new Date(v.getTime() - 3 * 3600000).toISOString().slice(0, 16)
          : typeof v === "string" || typeof v === "number" || typeof v === "boolean"
            ? v
            : null;
    }
  }
  if (resource === "eventos" && row) {
    const rewards = await prisma.eventReward.findMany({
      where: { eventId: row.id },
      include: { emblem: true },
    });
    initial.rewardCodes = rewards.map((r) => r.emblem.code).join(", ");
  }
  const queryField =
    config.model === "user"
      ? "username"
      : ["comment", "forumPost", "report"].includes(config.model)
        ? "content"
        : ["emblem", "mobi", "forumCategory"].includes(config.model)
          ? "name"
          : "title";
  const rows = editable
    ? []
    : await db.findMany({
        where: {
          ...resourceWhere(resource),
          ...(sp.q ? { [queryField]: { contains: sp.q.slice(0, 100) } } : {}),
        },
        orderBy:
          config.model === "user" || config.model !== "siteSetting"
            ? { createdAt: "desc" }
            : { id: "desc" },
        take: 31,
        skip: (page - 1) * 30,
      });
  return (
    <>
      <div className="admin-page-title">
        <Link href={`/admin/${resource}`}>Conteúdo / {config.label}</Link>
        <h1>{editable ? (row ? "Editar registro" : "Novo registro") : config.label}</h1>
      </div>
      {resource === "emblemas" && !editable && (
        <div className="paper">
          <ImportEmblemForm />
        </div>
      )}
      {editable ? (
        <div className="paper">
          {row && (
            <p className="muted">
              ID: {row.id}
              {row.targetType
                ? ` · Publicação: ${String(row.targetType)} / ${String(row.targetId)}`
                : ""}
            </p>
          )}
          <AdminEditor
            resource={resource}
            fields={config.fields}
            initial={initial}
            canDelete={user.role === "ADMIN" && !!row && resource !== "usuarios"}
          />
          {resource === "usuarios" && row && (
            <div className="paper">
              <AwardEmblemForm userId={row.id} emblems={emblems} />
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="admin-list-toolbar">
            <form>
              <input
                name="q"
                placeholder="Pesquisar…"
                aria-label="Pesquisar registros"
                defaultValue={sp.q}
              />
              <button>Pesquisar</button>
            </form>
            {!["usuarios", "topicos", "comentarios", "respostas", "denuncias"].includes(
              resource,
            ) && (
              <Link className="primary-button" href={`/admin/${resource}?novo=1`}>
                + Novo registro
              </Link>
            )}
          </div>
          <div className="paper admin-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Registro</th>
                  <th>Estado</th>
                  <th>Ação</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 30).map((r) => (
                  <tr key={r.id}>
                    <td>
                      {String(r.title || r.name || r.username || r.content || r.id).slice(0, 110)}
                    </td>
                    <td>
                      {r.isBanned
                        ? "Suspenso"
                        : r.hidden
                          ? "Oculto"
                          : r.published === false
                            ? "Rascunho"
                            : r.role
                              ? String(r.role)
                              : "Ativo"}
                    </td>
                    <td>
                      <Link href={`/admin/${resource}?edit=${r.id}`}>Editar →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && <p>Nenhum registro encontrado.</p>}
          </div>
          <div className="pagination">
            {page > 1 && (
              <Link
                href={`/admin/${resource}?page=${page - 1}&q=${encodeURIComponent(sp.q || "")}`}
              >
                ← Anterior
              </Link>
            )}
            {rows.length > 30 && (
              <Link
                href={`/admin/${resource}?page=${page + 1}&q=${encodeURIComponent(sp.q || "")}`}
              >
                Próxima →
              </Link>
            )}
          </div>
        </>
      )}
    </>
  );
}
