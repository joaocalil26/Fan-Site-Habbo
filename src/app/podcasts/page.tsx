import EntryListing from "@/components/EntryListing";
export const dynamic = "force-dynamic";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  return (
    <EntryListing kind="PODCAST" title="Podcasts" base="podcasts" search={await searchParams} />
  );
}
