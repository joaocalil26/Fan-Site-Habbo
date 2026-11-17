import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
export default async function Page({ params }: { params: Promise<{ id: string; slug: string }> }) {
  const { id, slug } = await params;
  const row = await prisma.news.findFirst({
    where: { OR: [{ id }, { slug }], published: true, publishedAt: { lte: new Date() } },
    select: { slug: true },
  });
  if (!row) notFound();
  redirect(`/noticias/${row.slug}`);
}
