"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import {
  saveResource,
  deleteResource,
  saveSettings,
  manageUserEmblem,
  importEmblem,
} from "@/actions/admin";
import type { Field } from "@/lib/admin-resources";
export function UploadField({
  onUploaded,
  imageOnly = false,
}: { onUploaded?: (url: string) => void; imageOnly?: boolean } = {}) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="upload-box">
      <label>
        Enviar imagem ou áudio
        <input
          type="file"
          accept={
            imageOnly
              ? "image/png,image/jpeg,image/webp,image/gif"
              : "image/png,image/jpeg,image/webp,image/gif,audio/mpeg,audio/ogg,audio/wav"
          }
          disabled={busy}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setBusy(true);
            setMessage("Enviando…");
            try {
              const body = new FormData();
              body.set("file", file);
              const response = await fetch("/api/admin/upload", { method: "POST", body });
              const result = await response.json();
              if (!response.ok) throw new Error(result.error);
              setMessage(result.url);
              onUploaded?.(result.url);
            } catch (e) {
              setMessage(e instanceof Error ? e.message : "Falha no envio.");
            } finally {
              setBusy(false);
            }
          }}
        />
      </label>
      <p>
        {message.startsWith("/") ? (
          <>
            Arquivo enviado. Cole este caminho no campo de imagem ou áudio: <code>{message}</code>
          </>
        ) : (
          message
        )}
      </p>
    </div>
  );
}
export function AwardEmblemForm({
  userId,
  emblems,
}: {
  userId: string;
  emblems: { id: string; name: string; code: string }[];
}) {
  const [state, action, pending] = useActionState(manageUserEmblem, {});
  return (
    <form action={action} className="admin-form">
      <h2>Inventário de emblemas</h2>
      <p>
        Para enviar uma imagem do seu computador,{" "}
        <Link href="/admin/emblemas">cadastre o emblema aqui</Link> e depois selecione-o abaixo.
      </p>
      <input type="hidden" name="userId" value={userId} />
      <p>
        Digite um código Habbo para importar e entregar, ou escolha um emblema do catálogo. A
        entrega aparece no perfil IdBlet.
      </p>
      <label>
        Código Habbo (opcional)
        <input name="badgeCode" placeholder="Ex.: ACH_BasicClub1" maxLength={40} />
      </label>
      <label>
        Emblema
        <select name="emblemId">
          <option value="">Escolha um emblema ou digite o código acima</option>
          {emblems.map((e) => (
            <option value={e.id} key={e.id}>
              {e.code} — {e.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Ação
        <select name="operation">
          <option value="award">Entregar ao membro</option>
          <option value="revoke">Remover do perfil</option>
        </select>
      </label>
      <button className="primary-button" disabled={pending}>
        Atualizar inventário
      </button>
      <p role="status">{state.error || state.success}</p>
    </form>
  );
}

export function ImportEmblemForm() {
  const [state, action, pending] = useActionState(importEmblem, {});
  const [image, setImage] = useState("");
  return (
    <section>
      <h2>Adicionar emblema por código ou arquivo</h2>
      <p>
        Informe o código para buscar a imagem no Habbo. Para uma arte própria, envie o arquivo e
        escolha um código exclusivo.
      </p>
      <UploadField imageOnly onUploaded={setImage} />
      <form action={action} className="admin-form">
        <label>
          Código
          <input name="code" required maxLength={40} placeholder="Ex.: ACH_BasicClub1" />
        </label>
        <label>
          Nome (opcional para imagem própria)
          <input name="name" maxLength={180} />
        </label>
        <input name="image" type="hidden" value={image} />
        {image && (
          <div className="badge-import-preview">
            <img src={image} alt="Prévia do emblema enviado" />
            <button type="button" onClick={() => setImage("")}>
              Remover imagem e usar código Habbo
            </button>
          </div>
        )}
        <button disabled={pending} className="primary-button">
          {pending ? "Buscando…" : image ? "Cadastrar minha imagem" : "Importar do Habbo"}
        </button>
        <p role="status">{state.error || state.success}</p>
      </form>
    </section>
  );
}
export default function AdminEditor({
  resource,
  fields,
  initial = {},
  settings = false,
  canDelete = false,
}: {
  resource: string;
  fields: Field[];
  initial?: Record<string, string | number | boolean | null>;
  settings?: boolean;
  canDelete?: boolean;
}) {
  const [state, action, pending] = useActionState(settings ? saveSettings : saveResource, {});
  const [deletion, remove, deleting] = useActionState(deleteResource, {});
  const id = state.id || String(initial.id || "");
  return (
    <div>
      <form action={action} className="admin-form">
        <input type="hidden" name="resource" value={resource} />
        <input type="hidden" name="id" value={id} />
        <div className="editor-fields">
          {fields.map((field) => (
            <label key={field.name} className={field.type === "textarea" ? "wide" : ""}>
              <span>{field.label}</span>
              {field.type === "textarea" ? (
                <textarea
                  name={field.name}
                  rows={field.name === "content" ? 18 : 3}
                  required={field.required}
                  defaultValue={String(initial[field.name] || "")}
                />
              ) : field.type === "select" ? (
                <select
                  name={field.name}
                  defaultValue={String(initial[field.name] || field.options?.[0])}
                >
                  {field.options?.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              ) : field.type === "checkbox" ? (
                <input type="checkbox" name={field.name} defaultChecked={!!initial[field.name]} />
              ) : (
                <input
                  type={field.type === "url" ? "text" : field.type || "text"}
                  name={field.name}
                  required={field.required}
                  min={field.type === "number" ? 0 : undefined}
                  defaultValue={String(initial[field.name] ?? "")}
                />
              )}
            </label>
          ))}
        </div>
        {state.error && (
          <p className="form-error" role="alert">
            {state.error}
          </p>
        )}
        {state.success && (
          <p className="form-success" role="status">
            {state.success}{" "}
            {id && !settings && (
              <Link href={`/admin/${resource}?edit=${id}`}>Continuar editando</Link>
            )}
          </p>
        )}
        <button className="primary-button" disabled={pending}>
          {pending ? "Salvando…" : "Salvar alterações"}
        </button>
      </form>
      {!settings && <UploadField />}
      {canDelete && id && (
        <form
          action={remove}
          onSubmit={(e) => {
            if (!window.confirm("Excluir este registro permanentemente?")) e.preventDefault();
          }}
          className="delete-box"
        >
          <input type="hidden" name="resource" value={resource} />
          <input type="hidden" name="id" value={id} />
          <button className="danger-button" disabled={deleting}>
            Excluir registro
          </button>
          {deletion.error && <p role="alert">{deletion.error}</p>}
          {deletion.success && (
            <p>
              {deletion.success} <Link href={`/admin/${resource}`}>Voltar à lista</Link>
            </p>
          )}
        </form>
      )}
    </div>
  );
}
