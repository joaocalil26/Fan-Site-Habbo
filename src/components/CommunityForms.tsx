"use client";
import { useActionState, useState } from "react";
import ProfileImageField from "@/components/ProfileImageField";
import {
  postComment,
  toggleReaction,
  updateProfile,
  changePassword,
  reportContent,
} from "@/actions/community";
export function CommentForm({ type, id }: { type: "news" | "entry"; id: string }) {
  const [state, action, busy] = useActionState(postComment, {});
  return (
    <form action={action} className="comment-form">
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="id" value={id} />
      <label htmlFor="comment-content">Participe da conversa</label>
      <textarea
        id="comment-content"
        name="content"
        rows={4}
        minLength={2}
        maxLength={3000}
        required
        placeholder="Escreva seu comentário…"
      />
      <button className="primary-button" disabled={busy}>
        {busy ? "Publicando…" : "Publicar comentário"}
      </button>
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
export function ReactionButton({
  type,
  id,
  count,
  liked,
}: {
  type: string;
  id: string;
  count: number;
  liked: boolean;
}) {
  const [state, action, busy] = useActionState(toggleReaction, {});
  return (
    <form action={action} className="reaction-form">
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="id" value={id} />
      <button disabled={busy} aria-pressed={liked}>
        {liked ? "♥ Curtido" : "♡ Curtir"} <b>{count}</b>
      </button>
      <span role="status">{state.error || state.success}</span>
    </form>
  );
}
export function ProfileForm({
  name,
  bio,
  avatar,
  coverImage,
  signature,
  signatureImage,
}: {
  name: string;
  bio: string;
  avatar: string;
  coverImage: string;
  signature: string;
  signatureImage: string;
}) {
  const [state, action, busy] = useActionState(updateProfile, {});
  const [uploads, setUploads] = useState<Record<string, boolean>>({});
  const uploading = Object.values(uploads).some(Boolean);
  return (
    <form action={action} className="admin-form profile-edit-form">
      <div className="profile-media-editor">
        {[
          { name: "avatar", label: "Foto de perfil", value: avatar },
          { name: "coverImage", label: "Capa do perfil", value: coverImage },
        ].map((field) => (
          <ProfileImageField
            key={field.name}
            {...field}
            onBusy={(value) => setUploads((previous) => ({ ...previous, [field.name]: value }))}
          />
        ))}
      </div>
      <label>
        Nome
        <input name="name" defaultValue={name} maxLength={80} />
      </label>
      <label>
        Sobre você
        <textarea name="bio" defaultValue={bio} maxLength={1000} rows={5} />
      </label>
      <label>
        Assinatura
        <textarea
          name="signature"
          defaultValue={signature}
          maxLength={1000}
          rows={4}
          placeholder="Uma frase para acompanhar suas publicações no fórum…"
        />
      </label>
      <p className="muted">
        Sua assinatura aparece no perfil e abaixo das suas publicações no fórum. Você pode usar
        texto e uma imagem.
      </p>
      <ProfileImageField
        name="signatureImage"
        label="Imagem da assinatura (opcional)"
        value={signatureImage}
        onBusy={(value) => setUploads((previous) => ({ ...previous, signatureImage: value }))}
      />
      <button className="primary-button" disabled={busy || uploading}>
        Salvar perfil
      </button>
      <p role="status">{state.error || state.success}</p>
    </form>
  );
}
export function PasswordForm() {
  const [state, action, busy] = useActionState(changePassword, {});
  return (
    <form action={action} className="admin-form">
      <label>
        Senha atual
        <input
          type="password"
          name="currentPassword"
          autoComplete="current-password"
          required
          maxLength={72}
        />
      </label>
      <label>
        Nova senha
        <input
          type="password"
          name="newPassword"
          autoComplete="new-password"
          required
          minLength={10}
          maxLength={72}
        />
      </label>
      <p className="muted">A alteração encerra o acesso das sessões anteriores.</p>
      <button className="primary-button" disabled={busy}>
        Alterar senha
      </button>
      <p className="form-error" hidden={!state.error} role="alert">
        {state.error}
      </p>
    </form>
  );
}
export function ReportForm({ type, id }: { type: string; id: string }) {
  const [state, action, busy] = useActionState(reportContent, {});
  return (
    <details className="report-box">
      <summary>Denunciar publicação</summary>
      <form action={action} className="comment-form">
        <input type="hidden" name="type" value={type} />
        <input type="hidden" name="id" value={id} />
        <label>
          Conte à moderação o que aconteceu
          <textarea name="content" required minLength={10} maxLength={1500} rows={3} />
        </label>
        <button className="primary-button" disabled={busy}>
          Enviar à moderação
        </button>
        <p role="status">{state.error || state.success}</p>
      </form>
    </details>
  );
}
