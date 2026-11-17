import EntryDetail from "@/components/EntryDetail";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ comentarios?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  return (
    <EntryDetail
      slug={slug}
      kind="EVENT"
      commentPage={Math.max(1, Math.min(10000, Number(sp.comentarios) || 1))}
    />
  );
}
