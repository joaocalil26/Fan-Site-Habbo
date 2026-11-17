import { requireStaffPage } from "@/lib/access";
import { getSiteConfig } from "@/lib/site";
import RadioSettingsForm from "@/components/RadioSettingsForm";
export default async function RadioPage() {
  await requireStaffPage(true);
  const site = await getSiteConfig();
  return (
    <>
      <div className="admin-page-title">
        <span>NA FREQUÊNCIA DA COMUNIDADE</span>
        <h1>Rádio e AutoDJ</h1>
        <p>
          Conecte seu streaming ao player do IdBlet. Depois do primeiro play, o player tenta
          reconectar automaticamente em caso de interrupção.
        </p>
      </div>
      <div className="paper">
        <RadioSettingsForm streamUrl={site.streamUrl} show={site.show} />
      </div>
    </>
  );
}
