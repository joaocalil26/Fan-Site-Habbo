import { allowAttempt } from "@/lib/rate-limit";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Discord from "next-auth/providers/discord";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";

function discordUsername(profile: { username?: string; global_name?: string | null; id?: string }) {
  const base = (profile.username || profile.global_name || "discord")
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 20);
  return base || `user_${profile.id?.slice(-6) || "discord"}`;
}

async function ensureUniqueUsername(desired: string, userId?: string) {
  let candidate = desired.slice(0, 24) || "user";
  for (let i = 0; i < 20; i++) {
    const tryName = i === 0 ? candidate : `${candidate.slice(0, 18)}_${i}`;
    const existing = await prisma.user.findUnique({
      where: { username: tryName },
    });
    if (!existing || (userId && existing.id === userId)) {
      return tryName;
    }
  }
  return `${candidate.slice(0, 12)}_${Date.now().toString(36)}`;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Discord({
      clientId: process.env.AUTH_DISCORD_ID,
      clientSecret: process.env.AUTH_DISCORD_SECRET,
      // allow linking by email if Discord returns verified email
      allowDangerousEmailAccountLinking: false,
      profile(profile) {
        const avatarHash = (profile as { avatar?: string | null }).avatar;
        const image = avatarHash
          ? `https://cdn.discordapp.com/avatars/${profile.id}/${avatarHash}.png`
          : null;
        return {
          id: profile.id,
          name: profile.global_name ?? profile.username,
          email: profile.email,
          image,
          username: discordUsername(profile),
          avatar: image ?? "🎮",
        };
      },
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials, request) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password || email.length > 254 || password.length > 72) return null;
        const identity = `${request.headers.get("x-forwarded-for")?.split(",")[0] || "local"}:${email.toLowerCase().trim()}`;
        if (!(await allowAttempt("login", identity, 12, 15 * 60000))) return null;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase().trim() },
        });
        if (!user?.passwordHash || user.isBanned) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        void prisma.user.update({
          where: { id: user.id },
          data: { lastSeenAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? user.username,
          image: user.image ?? user.avatar,
          username: user.username ?? undefined,
          role: user.role,
          sessionVersion: user.sessionVersion,
          avatar: user.avatar,
          level: user.level,
          isPremium: user.isPremium,
        };
      },
    }),
  ],
  events: {
    async createUser({ user }) {
      if (!user.id) return;
      // Garante username único após criação via OAuth
      try {
        const desired =
          (user as { username?: string }).username ||
          user.name
            ?.toLowerCase()
            .replace(/\s+/g, "_")
            .replace(/[^a-z0-9_]/g, "") ||
          user.email?.split("@")[0] ||
          `user_${user.id.slice(-6)}`;

        const username = await ensureUniqueUsername(desired, user.id);

        await prisma.user.update({
          where: { id: user.id },
          data: {
            username,
            avatar: user.image || (user as { avatar?: string }).avatar || "🎮",
            image: user.image ?? undefined,
            lastSeenAt: new Date(),
          },
        });
      } catch (e) {
        console.error("[auth createUser]", e);
      }
    },
    async signIn({ user, account }) {
      if (user.id) {
        const member = await prisma.user.findUnique({
          where: { id: user.id },
          select: { isBanned: true },
        });
        if (member?.isBanned) throw new Error("Conta suspensa.");
      }
      if (account?.provider === "discord" && user.id) {
        void prisma.user.update({
          where: { id: user.id },
          data: { lastSeenAt: new Date() },
        });
      }
    },
  },
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, account, trigger, session, profile }) {
      // merge base jwt from authConfig
      if (user) {
        token.id = user.id;
        token.username = (user as { username?: string }).username;
        token.role = (user as { role?: string }).role;
        token.sessionVersion = user.sessionVersion;
        token.avatar = (user as { avatar?: string | null }).avatar ?? user.image;
        token.level = (user as { level?: number }).level;
        token.isPremium = (user as { isPremium?: boolean }).isPremium;
      }

      // Após OAuth, recarrega user do DB (username pode ter sido setado no event)
      if (account?.provider === "discord" && token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            username: true,
            role: true,
            sessionVersion: true,
            avatar: true,
            image: true,
            level: true,
            isPremium: true,
          },
        });
        if (dbUser) {
          token.username = dbUser.username ?? token.username;
          token.role = dbUser.role;
          token.sessionVersion = dbUser.sessionVersion;
          token.avatar = dbUser.avatar ?? dbUser.image;
          token.level = dbUser.level;
          token.isPremium = dbUser.isPremium;
        }
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
});
