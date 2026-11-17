/**
 * Utilitários de paginação por cursor
 *
 * Formato do cursor (opaco para o cliente):
 *   base64url( JSON({ v: 1, ...campos de ordenação, id }) )
 *
 * Vantagens vs offset (skip):
 * - estável com inserts/deletes no meio da lista
 * - O(1) no banco com índice (sem pular N linhas)
 * - ideal para infinite scroll / "carregar mais"
 */

export type CursorPayload = {
  v: 1;
  id: string;
  // Campos extras conforme a ordenação da query
  publishedAt?: string; // ISO
  releasedAt?: string;
  lastPostAt?: string;
  createdAt?: string;
  obtainedAt?: string;
  level?: number;
  xp?: number;
  views?: number;
};

export function encodeCursor(payload: CursorPayload): string {
  const json = JSON.stringify(payload);
  return Buffer.from(json, "utf8").toString("base64url");
}

export function decodeCursor(cursor: string | null | undefined): CursorPayload | null {
  if (!cursor) return null;
  try {
    const json = Buffer.from(cursor, "base64url").toString("utf8");
    const data = JSON.parse(json) as CursorPayload;
    if (data?.v !== 1 || typeof data.id !== "string") return null;
    return data;
  } catch {
    return null;
  }
}

export type CursorPage<T> = {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
};

/**
 * Busca take+1 para saber se existe próxima página sem COUNT(*).
 */
export function toCursorPage<T>(
  rows: T[],
  take: number,
  getCursor: (item: T) => CursorPayload,
): CursorPage<T> {
  const hasMore = rows.length > take;
  const items = hasMore ? rows.slice(0, take) : rows;
  const last = items[items.length - 1];
  const nextCursor = hasMore && last ? encodeCursor(getCursor(last)) : null;

  return { items, nextCursor, hasMore };
}
