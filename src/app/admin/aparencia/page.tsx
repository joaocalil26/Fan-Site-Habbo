import { requireStaffPage } from "@/lib/access";
import { getSeasonalConfig } from "@/lib/seasonal";
import AppearanceForm from "@/components/AppearanceForm";
export default async function AppearancePage() {
  await requireStaffPage(true);
  const initial = await getSeasonalConfig();
  return (
    <>
      <div className="admin-page-title">
        <span>UM TOQUE ESPECIAL, SEM MUDAR SUA IDENTIDADE</span>
        <h1>Temas e efeitos</h1>
        <p>
          Ative Halloween, Natal, Páscoa ou Festa Junina quando quiser. Os enfeites não bloqueiam os
          cliques nem alteram o conteúdo do site.
        </p>
      </div>
      <div className="paper">
        <AppearanceForm initial={initial} />
      </div>
    </>
  );
}
