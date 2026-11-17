import type { NextAuthConfig } from "next-auth";

/**
 * Config compartilhada (edge-compatible) — sem Prisma/bcrypt aqui.
 * Providers com credentials ficam em auth.ts
 */
export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  providers: [], // preenchido em auth.ts
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const path = nextUrl.pathname;
      const isAuthPage = path.startsWith("/login") || path.startsWith("/register");
      const isProtected = path.startsWith("/forum/novo") || path.startsWith("/perfil/editar");

      if (isProtected && !isLoggedIn) {
        return false; // redirect to signIn
      }
      if (isAuthPage && isLoggedIn) {
        return Response.redirect(new URL("/", nextUrl));
      }
      return true;
    },
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.username = (user as { username?: string }).username;
        token.role = (user as { role?: string }).role;
        token.avatar = (user as { avatar?: string | null }).avatar;
        token.level = (user as { level?: number }).level;
        token.isPremium = (user as { isPremium?: boolean }).isPremium;
      }
      if (trigger === "update" && session) {
        token.username = session.username ?? token.username;
        token.avatar = session.avatar ?? token.avatar;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.role = token.role as string;
        session.user.sessionVersion = token.sessionVersion as number;
        session.user.avatar = token.avatar as string | null | undefined;
        session.user.level = token.level as number | undefined;
        session.user.isPremium = token.isPremium as boolean | undefined;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
