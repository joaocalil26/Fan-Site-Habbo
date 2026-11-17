"use client";
import { useActionState } from "react";
import Link from "next/link";
import { loginAction, registerAction } from "@/actions/auth";
import DiscordSignInButton from "./DiscordSignInButton";
export default function AuthForm({
  register = false,
  discord = false,
  callbackUrl = "/",
}: {
  register?: boolean;
  discord?: boolean;
  callbackUrl?: string;
}) {
  const [state, action, pending] = useActionState(register ? registerAction : loginAction, {});
  return (
    <div className="auth-shell">
      <div className="paper">
        <img className="auth-logo" src="/idblet.svg" alt="IdBlet" />
        <h1>{register ? "Faça parte do IdBlet" : "Bom ter você por aqui"}</h1>
        <p className="muted">
          {register
            ? "Sua próxima história começa na comunidade."
            : "Entre para conversar, comentar e participar."}
        </p>
        {discord && (
          <>
            <DiscordSignInButton callbackUrl={callbackUrl} />
            <div className="auth-divider">ou continue com e-mail</div>
          </>
        )}
        <form action={action} className="admin-form">
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
          {register && (
            <label>
              Seu nick
              <input
                name="username"
                required
                minLength={3}
                maxLength={24}
                autoComplete="username"
                placeholder="seu_nick"
                pattern="[a-zA-Z0-9_]+"
                title="Use letras, números e sublinhado."
              />
            </label>
          )}
          <label>
            E-mail
            <input
              name="email"
              type="email"
              required
              maxLength={254}
              autoComplete="email"
              placeholder="voce@email.com"
            />
          </label>
          <label>
            Senha
            <input
              name="password"
              type="password"
              required
              minLength={register ? 10 : undefined}
              maxLength={72}
              autoComplete={register ? "new-password" : "current-password"}
              placeholder={register ? "Pelo menos 10 caracteres" : "Sua senha"}
            />
          </label>
          {register && (
            <p className="muted">
              Ao criar sua conta, você concorda com as <Link href="/pagina/regras">regras</Link> e a{" "}
              <Link href="/pagina/privacidade">política de privacidade</Link>.
            </p>
          )}
          {state.error && (
            <p className="form-error" role="alert">
              {state.error}
            </p>
          )}
          <button className="primary-button" disabled={pending}>
            {pending ? "Aguarde…" : register ? "Criar minha conta" : "Entrar"}
          </button>
        </form>
        <p className="auth-switch">
          {register ? "Já faz parte? " : "Ainda não tem conta? "}
          <Link href={register ? "/login" : "/register"}>
            {register ? "Entre aqui" : "Cadastre-se"}
          </Link>
        </p>
      </div>
    </div>
  );
}
