"use client";

import Link from "next/link";
import LoadMoreButton from "./LoadMoreButton";
import { useCursorPage } from "@/hooks/useCursorPage";

type ThreadItem = {
  id: string;
  title: string;
  slug: string;
  pinned: boolean;
  views: number;
  replyCount: number;
  lastPostAt: string;
  author: { username: string | null };
  category: { name: string; slug: string };
};

type Props = {
  initialItems: ThreadItem[];
  initialCursor: string | null;
  initialHasMore: boolean;
  category?: string;
};

function formatRelative(iso: string) {
  try {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `há ${m} min`;
    const h = Math.floor(m / 60);
    if (h < 24) return `há ${h}h`;
    return d.toLocaleDateString("pt-BR");
  } catch {
    return "";
  }
}

export default function ThreadsListClient({
  initialItems,
  initialCursor,
  initialHasMore,
  category,
}: Props) {
  const { items, hasMore, loading, loadMore } = useCursorPage<ThreadItem>({
    endpoint: "/api/forum/threads",
    params: { category },
    take: 20,
    initialItems,
    initialCursor,
    initialHasMore,
  });

  return (
    <div>
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
        <div className="hidden border-b border-[var(--border)] bg-slate-900/50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:grid sm:grid-cols-12">
          <span className="col-span-6">Tópico</span>
          <span className="col-span-2 text-center">Respostas</span>
          <span className="col-span-2 text-center">Views</span>
          <span className="col-span-2 text-right">Atividade</span>
        </div>

        {items.map((thread) => (
          <Link
            key={thread.id}
            href={`/forum/${thread.slug}`}
            className="flex flex-col gap-2 border-b border-[var(--border)] px-5 py-4 last:border-0 hover:bg-slate-800/40 transition sm:grid sm:grid-cols-12 sm:items-center"
          >
            <div className="col-span-6 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {thread.pinned && (
                  <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-400">
                    FIXADO
                  </span>
                )}
                <span className="rounded bg-slate-700 px-1.5 py-0.5 text-[10px] text-slate-300">
                  {thread.category.name}
                </span>
              </div>
              <p className="mt-1 font-medium text-white truncate">{thread.title}</p>
              <p className="text-xs text-slate-500">por {thread.author.username}</p>
            </div>
            <div className="col-span-2 text-center text-sm text-slate-300">{thread.replyCount}</div>
            <div className="col-span-2 text-center text-sm text-slate-400">{thread.views}</div>
            <div className="col-span-2 text-right text-xs text-slate-500">
              {formatRelative(thread.lastPostAt)}
            </div>
          </Link>
        ))}

        {items.length === 0 && (
          <p className="p-8 text-center text-slate-500">Nenhum tópico ainda.</p>
        )}
      </div>
      <LoadMoreButton hasMore={hasMore} loading={loading} onClick={() => void loadMore()} />
    </div>
  );
}
