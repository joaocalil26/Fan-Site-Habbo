import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
export default async function Page({ params }: { params: Promise<{ id: string; slug: string }> }) {
  const { id, slug } = await params;
  const row = await prisma.forumThread.findFirst({
    where: { OR: [{ id }, { slug }] },
    select: { slug: true },
  });
  if (!row) notFound();
  redirect(`/forum/${row.slug}`);
}
