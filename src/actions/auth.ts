"use server";

import { headers } from "next/headers";
import { allowAttempt } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

function slugifyUsername(raw: string) {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 24);
}

export type AuthActionState = {
  error?: string;
  success?: string;
};

export async function registerAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") || "")
    .toLowerCase()
    .trim();
  const password = String(formData.get("password") || "");
  const usernameRaw = String(formData.get("username") || "");
  const username = slugifyUsername(usernameRaw);

  if (!email || !password || !username) {
    return { error: "Preencha todos os campos." };
  }
  if (username.length < 3) {
    return { error: "Username deve ter pelo menos 3 caracteres." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)
    return { error: "Informe um e-mail válido." };
  if (password.length < 10 || password.length > 72) {
    return { error: "Use uma senha de 10 a 72 caracteres." };
  }

  const requestHeaders = await headers();
  if (
    !(await allowAttempt(
      "register",
      requestHeaders.get("x-forwarded-for")?.split(",")[0] || "local",
      5,
      60 * 60000,
    ))
  )
    return { error: "Muitas tentativas de cadastro. Tente novamente mais tarde." };
  try {
    const exists = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });
    if (exists) {
      return {
        error:
          exists.email === email
            ? "Este e-mail já está cadastrado."
            : "Este username já está em uso.",
      };
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        name: usernameRaw.trim() || username,
        avatar: "😎",
        rank: "Iniciante",
        level: 1,
        xp: 0,
      },
    });
  } catch (e) {
    console.error("[register]", e);
    return {
      error: "Não foi possível criar a conta. Verifique se o banco está conectado.",
    };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/",
    });
  } catch (e) {
    if (e instanceof AuthError) {
      return { error: "Conta criada, mas o login automático falhou. Entre manualmente." };
    }
    throw e; // NEXT_REDIRECT
  }

  return { success: "Conta criada!" };
}

export async function loginAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") || "")
    .toLowerCase()
    .trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { error: "Informe e-mail e senha." };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: (() => {
        const path = String(formData.get("callbackUrl") || "/");
        return path.startsWith("/") && !path.startsWith("//") && !path.includes("\\") ? path : "/";
      })(),
    });
  } catch (e) {
    if (e instanceof AuthError) {
      return { error: "E-mail ou senha inválidos." };
    }
    throw e;
  }

  return { success: "OK" };
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}
