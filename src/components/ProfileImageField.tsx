"use client";
import { useState } from "react";

export default function ProfileImageField({
  name,
  label,
  value,
  onBusy,
}: {
  name: string;
  label: string;
  value: string;
  onBusy: (busy: boolean) => void;
}) {
  const [url, setUrl] = useState(value);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <fieldset className={`profile-image-field field-${name}`}>
      <legend>{label}</legend>
      {url && <img src={url} alt={`Prévia: ${label}`} className="profile-image-preview" />}
      <label>
        Enviar do computador
        <input
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          disabled={busy}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setError("");
            if (file.size > 2 * 1024 * 1024) {
              setError("Use uma imagem de até 2 MB.");
              return;
            }
            setBusy(true);
            onBusy(true);
            try {
              const body = new FormData();
              body.set("file", file);
              const response = await fetch("/api/perfil/upload", { method: "POST", body });
              const result = await response.json();
              if (!response.ok) throw new Error(result.error || "Falha no envio.");
              setUrl(result.url);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Falha no envio.");
            } finally {
              setBusy(false);
              onBusy(false);
            }
          }}
        />
      </label>
      <label>
        Ou cole uma URL HTTPS de imagem
        <input
          name={name}
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          maxLength={2000}
          placeholder="https://exemplo.com/imagem.png"
        />
      </label>
      <small>PNG, JPEG, GIF ou WebP · até 2 MB no envio.</small>
      {url && (
        <button
          type="button"
          className="profile-remove-image"
          onClick={() => setUrl("")}
          disabled={busy}
        >
          Remover imagem
        </button>
      )}
      {busy && <p role="status">Enviando imagem…</p>}
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
    </fieldset>
  );
}
