"use client";
import { useActionState, useState } from "react";
import { saveRadio } from "@/actions/radio";
export default function RadioSettingsForm({
  streamUrl,
  show,
}: {
  streamUrl: string;
  show: string;
}) {
  const [state, action, pending] = useActionState(saveRadio, {});
  const [url, setUrl] = useState(streamUrl);
  const [testUrl, setTestUrl] = useState("");
  return (
    <form action={action} className="admin-form">
      <label>
        URL direta do streaming
        <input
          name="streamUrl"
          type="url"
          required
          maxLength={2048}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://seu-servidor.com/stream"
        />
      </label>
      <p className="muted">
        Cole a URL de áudio do seu provedor, não o endereço da página da rádio. A programação e a
        playlist do AutoDJ são transmitidas pelo seu servidor de streaming.
      </p>
      <label>
        Nome do programa
        <input name="show" defaultValue={show} maxLength={120} placeholder="IdBlet no ar" />
      </label>
      <div className="radio-test">
        <button
          type="button"
          className="radio-test-button"
          disabled={!url.trim()}
          onClick={() => {
            try {
              const u = new URL(url.trim());
              if (["https:", "http:"].includes(u.protocol)) setTestUrl(u.href);
            } catch {
              setTestUrl("");
            }
          }}
        >
          Preparar teste de áudio
        </button>
        {testUrl && <audio key={testUrl} src={testUrl} controls preload="none" />}
        <small>
          Use o play do teste para confirmar se o endereço transmite áudio. O navegador exige uma
          interação para iniciar o som.
        </small>
      </div>
      <div className="appearance-actions">
        <button className="primary-button" name="mode" value="stream" disabled={pending}>
          {pending ? "Salvando…" : "Conectar AutoDJ"}
        </button>
        {streamUrl && (
          <button
            className="danger-button"
            name="mode"
            value="off"
            formNoValidate
            disabled={pending}
          >
            Desativar rádio
          </button>
        )}
        <a href="/" target="_blank" rel="noopener noreferrer">
          Abrir o player ↗
        </a>
      </div>
      {state.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="form-success" role="status">
          {state.success}
        </p>
      )}
    </form>
  );
}
