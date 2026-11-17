import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  // Evita rodar em estáticos / api auth
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
