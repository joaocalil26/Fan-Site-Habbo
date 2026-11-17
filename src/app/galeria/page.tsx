import EntryListing from "@/components/EntryListing";
export const dynamic = "force-dynamic";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  return <EntryListing kind="ART" title="Galeria" base="galeria" search={await searchParams} />;
}
