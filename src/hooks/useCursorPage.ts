"use client";

import { useCallback, useRef, useState } from "react";

export type CursorPageResponse<T> = {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
};

type Options<T> = {
  endpoint: string;
  params?: Record<string, string | undefined>;
  take?: number;
  /** Dados da 1ª página vindos do Server Component */
  initialItems?: T[];
  initialCursor?: string | null;
  initialHasMore?: boolean;
};

export function useCursorPage<T>({
  endpoint,
  params = {},
  take = 20,
  initialItems = [],
  initialCursor = null,
  initialHasMore = false,
}: Options<T>) {
  const [items, setItems] = useState<T[]>(initialItems);
  const [nextCursor, setNextCursor] = useState<string | null>(initialCursor);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);

  const buildUrl = useCallback(
    (cursor: string | null) => {
      const sp = new URLSearchParams();
      sp.set("take", String(take));
      if (cursor) sp.set("cursor", cursor);
      for (const [k, v] of Object.entries(params)) {
        if (v != null && v !== "") sp.set(k, v);
      }
      return `${endpoint}?${sp.toString()}`;
    },
    [endpoint, params, take],
  );

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(buildUrl(nextCursor));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as CursorPageResponse<T>;

      setItems((prev) => [...prev, ...data.items]);
      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar");
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [buildUrl, hasMore, nextCursor]);

  const reset = useCallback(async () => {
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(buildUrl(null));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as CursorPageResponse<T>;
      setItems(data.items);
      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar");
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [buildUrl]);

  return { items, hasMore, loading, error, nextCursor, loadMore, reset };
}
