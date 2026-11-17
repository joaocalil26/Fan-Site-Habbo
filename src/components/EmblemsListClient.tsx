"use client";

import EmblemCard from "./EmblemCard";
import LoadMoreButton from "./LoadMoreButton";
import { useCursorPage } from "@/hooks/useCursorPage";

type EmblemItem = {
  id: string;
  code: string;
  name: string;
  image: string;
  rarity: string;
  releasedAt: string;
};

type Props = {
  initialItems: EmblemItem[];
  initialCursor: string | null;
  initialHasMore: boolean;
  rarity?: string;
};

export default function EmblemsListClient({
  initialItems,
  initialCursor,
  initialHasMore,
  rarity,
}: Props) {
  const { items, hasMore, loading, loadMore } = useCursorPage<EmblemItem>({
    endpoint: "/api/emblemas",
    params: { rarity },
    take: 24,
    initialItems,
    initialCursor,
    initialHasMore,
  });

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {items.map((e) => (
          <EmblemCard key={e.id} emblem={e} />
        ))}
      </div>
      {items.length === 0 && (
        <p className="text-center text-slate-500 py-12">Nenhum emblema encontrado.</p>
      )}
      <LoadMoreButton hasMore={hasMore} loading={loading} onClick={() => void loadMore()} />
    </div>
  );
}
