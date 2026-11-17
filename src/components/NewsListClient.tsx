"use client";

import NewsCard from "./NewsCard";
import LoadMoreButton from "./LoadMoreButton";
import { useCursorPage } from "@/hooks/useCursorPage";

type NewsItem = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  category: string;
  image: string | null;
  views: number;
  publishedAt: string;
};

type Props = {
  initialItems: NewsItem[];
  initialCursor: string | null;
  initialHasMore: boolean;
  category?: string;
  orderBy?: string;
};

export default function NewsListClient({
  initialItems,
  initialCursor,
  initialHasMore,
  category,
  orderBy = "recent",
}: Props) {
  const { items, hasMore, loading, loadMore } = useCursorPage<NewsItem>({
    endpoint: "/api/news",
    params: { category, orderBy },
    take: 12,
    initialItems,
    initialCursor,
    initialHasMore,
  });

  return (
    <div>
      <div className="space-y-4">
        {items.map((item) => (
          <NewsCard key={item.id} item={item} />
        ))}
      </div>
      {items.length === 0 && (
        <p className="text-center text-slate-500 py-12">Nenhuma notícia encontrada.</p>
      )}
      <LoadMoreButton hasMore={hasMore} loading={loading} onClick={() => void loadMore()} />
    </div>
  );
}
