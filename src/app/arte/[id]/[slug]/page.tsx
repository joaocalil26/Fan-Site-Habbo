import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
export default async function Page({ params }: { params: Promise<{ id: string; slug: string }> }) {
  const { id, slug } = await params;
  const row = await prisma.contentEntry.findFirst({
    where: { OR: [{ id }, { slug }], kind: "ART", published: true },
    select: { slug: true },
  });
  if (!row) notFound();
  redirect(`/galeria/${row.slug}`);
}
