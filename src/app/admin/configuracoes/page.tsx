import { requireStaffPage as requireStaff } from "@/lib/access";
import { getSiteConfig } from "@/lib/site";
import AdminEditor, { UploadField } from "@/components/AdminEditor";
import type { Field } from "@/lib/admin-resources";
const fields: Field[] = [
  { name: "name", label: "Nome do site", required: true },
  { name: "tagline", label: "Slogan" },
  { name: "description", label: "Descrição", type: "textarea" },
  { name: "logo", label: "Logo (URL ou caminho local)" },
  { name: "primaryColor", label: "Cor principal (#e9ad4b)" },
  { name: "darkColor", label: "Cor dos painéis (#292f27)" },
  { name: "streamUrl", label: "URL HTTPS do streaming de áudio" },
  { name: "dj", label: "Locutor atual" },
  { name: "show", label: "Programa atual" },
  { name: "listeners", label: "Ouvintes (informação manual)", type: "number" },
  { name: "discord", label: "Link do Discord" },
  { name: "hotelUrl", label: "Link do hotel" },
  { name: "footer", label: "Texto do rodapé", type: "textarea" },
];
export default async function SettingsPage() {
  await requireStaff(true);
  const config = await getSiteConfig();
  return (
    <>
      <div className="admin-page-title">
        <h1>Identidade e rádio</h1>
        <p>
          As alterações são aplicadas em todo o site. O streaming precisa ser configurado para
          transmitir áudio.
        </p>
      </div>
      <div className="paper">
        <AdminEditor settings resource="configuracoes" fields={fields} initial={config} />
        <UploadField />
      </div>
    </>
  );
}
