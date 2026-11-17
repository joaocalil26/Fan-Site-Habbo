import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
export async function currentMember() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      isBanned: true,
      sessionVersion: true,
      avatar: true,
    },
  });
  return user && !user.isBanned && (session.user.sessionVersion ?? 0) === user.sessionVersion
    ? user
    : null;
}
export async function requireStaff(adminOnly = false) {
  const user = await currentMember();
  if (!user || (user.role !== "ADMIN" && (adminOnly || user.role !== "MODERATOR")))
    throw new Error("Acesso restrito à equipe autorizada.");
  return user;
}

export async function requireStaffPage(adminOnly = false) {
  const user = await currentMember();
  if (!user) redirect("/login?callbackUrl=/admin");
  if (user.role !== "ADMIN" && (adminOnly || user.role !== "MODERATOR"))
    redirect("/acesso-restrito");
  return user;
}
