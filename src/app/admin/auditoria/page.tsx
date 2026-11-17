import { requireStaffPage as requireStaff } from "@/lib/access";
import { prisma } from "@/lib/prisma";
export default async function AuditPage() {
  await requireStaff(true);
  const rows = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return (
    <>
      <div className="admin-page-title">
        <h1>Histórico de alterações</h1>
        <p>Últimas 100 ações administrativas.</p>
      </div>
      <div className="paper admin-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Operador</th>
              <th>Ação</th>
              <th>Seção / registro</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.createdAt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</td>
                <td>{r.actorId}</td>
                <td>{r.action}</td>
                <td>
                  {r.resource} / {r.recordId}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
