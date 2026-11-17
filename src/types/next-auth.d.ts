import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username?: string;
      role?: string;
      sessionVersion?: number;
      avatar?: string | null;
      level?: number;
      isPremium?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    username?: string;
    role?: string;
    sessionVersion?: number;
    avatar?: string | null;
    level?: number;
    isPremium?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    username?: string;
    role?: string;
    sessionVersion?: number;
    avatar?: string | null;
    level?: number;
    isPremium?: boolean;
  }
}
