/**
 * Camada de consultas otimizadas
 *
 * - select enxuto
 * - índices compostos cobrem where + orderBy
 * - paginação por cursor (principal) + offset legado onde útil
 * - replyCount denormalizado
 * - increments atômicos
 */

import { prisma } from "./prisma";
import type { Prisma, Rarity } from "@prisma/client";
import { decodeCursor, toCursorPage, type CursorPage, type CursorPayload } from "./cursor";

// ---------------------------------------------------------------------------
// Selects
// ---------------------------------------------------------------------------

const userPublicSelect = {
  id: true,
  username: true,
  avatar: true,
  level: true,
  rank: true,
  isPremium: true,
} satisfies Prisma.UserSelect;

const emblemCardSelect = {
  id: true,
  code: true,
  name: true,
  image: true,
  rarity: true,
  releasedAt: true,
} satisfies Prisma.EmblemSelect;

const newsCardSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  category: true,
  image: true,
  views: true,
  publishedAt: true,
} satisfies Prisma.NewsSelect;

const threadListSelect = {
  id: true,
  title: true,
  slug: true,
  pinned: true,
  locked: true,
  views: true,
  replyCount: true,
  lastPostAt: true,
  createdAt: true,
  author: { select: userPublicSelect },
  category: {
    select: { id: true, name: true, slug: true },
  },
} satisfies Prisma.ForumThreadSelect;

const DEFAULT_TAKE = 20;
const MAX_TAKE = 50;

function clampTake(take?: number) {
  if (!take || take < 1) return DEFAULT_TAKE;
  return Math.min(take, MAX_TAKE);
}

// ---------------------------------------------------------------------------
// NEWS — cursor: publishedAt DESC, id DESC
// ---------------------------------------------------------------------------

export type NewsCursorParams = {
  category?: string;
  cursor?: string | null;
  take?: number;
  orderBy?: "recent" | "popular";
};

export async function getNewsFeedCursor({
  category,
  cursor,
  take: takeParam,
  orderBy = "recent",
}: NewsCursorParams = {}): Promise<
  CursorPage<Prisma.NewsGetPayload<{ select: typeof newsCardSelect }>>
> {
  const take = clampTake(takeParam);
  const decoded = decodeCursor(cursor);

  const baseWhere: Prisma.NewsWhereInput = {
    published: true,
    publishedAt: { lte: new Date() },
    ...(category ? { category } : {}),
  };

  if (orderBy === "popular") {
    // Ordenação: views DESC, id DESC
    const where: Prisma.NewsWhereInput = {
      ...baseWhere,
      ...(decoded
        ? {
            OR: [
              { views: { lt: decoded.views ?? 0 } },
              {
                views: decoded.views ?? 0,
                id: { lt: decoded.id },
              },
            ],
          }
        : {}),
    };

    const rows = await prisma.news.findMany({
      where,
      select: newsCardSelect,
      orderBy: [{ views: "desc" }, { id: "desc" }],
      take: take + 1,
    });

    return toCursorPage(rows, take, (item) => ({
      v: 1,
      id: item.id,
      views: item.views,
    }));
  }

  // recent: publishedAt DESC, id DESC
  const where: Prisma.NewsWhereInput = {
    ...baseWhere,
    ...(decoded?.publishedAt
      ? {
          OR: [
            { publishedAt: { lt: new Date(decoded.publishedAt) } },
            {
              publishedAt: new Date(decoded.publishedAt),
              id: { lt: decoded.id },
            },
          ],
        }
      : {}),
  };

  const rows = await prisma.news.findMany({
    where,
    select: newsCardSelect,
    orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
    take: take + 1,
  });

  return toCursorPage(rows, take, (item) => ({
    v: 1,
    id: item.id,
    publishedAt: item.publishedAt.toISOString(),
  }));
}

/** Offset legado (páginas numeradas / SEO) */
export async function getNewsFeedOffset(params: {
  category?: string;
  page?: number;
  pageSize?: number;
  orderBy?: "recent" | "popular";
}) {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = clampTake(params.pageSize);
  const where: Prisma.NewsWhereInput = {
    published: true,
    publishedAt: { lte: new Date() },
    ...(params.category ? { category: params.category } : {}),
  };
  const orderBy =
    params.orderBy === "popular"
      ? ([{ views: "desc" }, { id: "desc" }] as const)
      : ([{ publishedAt: "desc" }, { id: "desc" }] as const);

  const [items, total] = await Promise.all([
    prisma.news.findMany({
      where,
      select: newsCardSelect,
      orderBy: [...orderBy],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.news.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getNewsBySlug(slug: string) {
  const news = await prisma.news.findFirst({
    where: { slug, published: true, publishedAt: { lte: new Date() } },
  });
  if (!news) return null;

  void prisma.news.update({
    where: { id: news.id },
    data: { views: { increment: 1 } },
  });

  return news;
}

// ---------------------------------------------------------------------------
// EMBLEMS — cursor: releasedAt DESC, id DESC
// ---------------------------------------------------------------------------

export type EmblemCursorParams = {
  rarity?: Rarity;
  limitedOnly?: boolean;
  cursor?: string | null;
  take?: number;
};

export async function getRecentEmblemsCursor({
  rarity,
  limitedOnly,
  cursor,
  take: takeParam,
}: EmblemCursorParams = {}) {
  const take = clampTake(takeParam);
  const decoded = decodeCursor(cursor);

  const where: Prisma.EmblemWhereInput = {
    ...(rarity ? { rarity } : {}),
    ...(limitedOnly ? { isLimited: true } : {}),
    ...(decoded?.releasedAt
      ? {
          OR: [
            { releasedAt: { lt: new Date(decoded.releasedAt) } },
            {
              releasedAt: new Date(decoded.releasedAt),
              id: { lt: decoded.id },
            },
          ],
        }
      : {}),
  };

  const rows = await prisma.emblem.findMany({
    where,
    select: emblemCardSelect,
    orderBy: [{ releasedAt: "desc" }, { id: "desc" }],
    take: take + 1,
  });

  return toCursorPage(rows, take, (item) => ({
    v: 1,
    id: item.id,
    releasedAt: item.releasedAt.toISOString(),
  }));
}

export async function getUserEmblemsCursor(
  userId: string,
  opts: { cursor?: string | null; take?: number } = {},
) {
  const take = clampTake(opts.take);
  const decoded = decodeCursor(opts.cursor);

  const where: Prisma.UserEmblemWhereInput = {
    userId,
    ...(decoded?.obtainedAt
      ? {
          OR: [
            { obtainedAt: { lt: new Date(decoded.obtainedAt) } },
            {
              obtainedAt: new Date(decoded.obtainedAt),
              id: { lt: decoded.id },
            },
          ],
        }
      : {}),
  };

  const rows = await prisma.userEmblem.findMany({
    where,
    orderBy: [{ obtainedAt: "desc" }, { id: "desc" }],
    take: take + 1,
    select: {
      id: true,
      obtainedAt: true,
      emblem: { select: emblemCardSelect },
    },
  });

  return toCursorPage(rows, take, (item) => ({
    v: 1,
    id: item.id,
    obtainedAt: item.obtainedAt.toISOString(),
  }));
}

// ---------------------------------------------------------------------------
// FORUM THREADS — cursor: lastPostAt DESC, id DESC
// (pinned primeiro só na 1ª página; páginas seguintes = não fixados)
// ---------------------------------------------------------------------------

export type ThreadCursorParams = {
  categorySlug?: string;
  cursor?: string | null;
  take?: number;
  /** true = incluir fixados (só faz sentido na 1ª página) */
  includePinned?: boolean;
};

export async function getForumThreadsCursor({
  categorySlug,
  cursor,
  take: takeParam,
  includePinned = true,
}: ThreadCursorParams = {}) {
  const take = clampTake(takeParam);
  const decoded = decodeCursor(cursor);

  // Com cursor: só threads não fixadas (ou todas se includePinned=false),
  // ordenadas por lastPostAt — índice cobre bem.
  // Na 1ª página sem cursor: buscamos fixados + recentes e mesclamos.
  if (!decoded && includePinned) {
    const categoryFilter = categorySlug ? { category: { slug: categorySlug } } : {};

    const [pinned, recent] = await Promise.all([
      prisma.forumThread.findMany({
        where: { ...categoryFilter, pinned: true },
        select: threadListSelect,
        orderBy: [{ lastPostAt: "desc" }, { id: "desc" }],
        take: 10, // poucos fixados
      }),
      prisma.forumThread.findMany({
        where: { ...categoryFilter, pinned: false },
        select: threadListSelect,
        orderBy: [{ lastPostAt: "desc" }, { id: "desc" }],
        take: take + 1,
      }),
    ]);

    const page = toCursorPage(recent, take, (item) => ({
      v: 1,
      id: item.id,
      lastPostAt: item.lastPostAt.toISOString(),
    }));

    // Fixados só na primeira página, no topo
    return {
      items: [...pinned, ...page.items],
      nextCursor: page.nextCursor,
      hasMore: page.hasMore,
    };
  }

  const where: Prisma.ForumThreadWhereInput = {
    ...(categorySlug ? { category: { slug: categorySlug } } : {}),
    pinned: false, // páginas seguintes
    ...(decoded?.lastPostAt
      ? {
          OR: [
            { lastPostAt: { lt: new Date(decoded.lastPostAt) } },
            {
              lastPostAt: new Date(decoded.lastPostAt),
              id: { lt: decoded.id },
            },
          ],
        }
      : {}),
  };

  const rows = await prisma.forumThread.findMany({
    where,
    select: threadListSelect,
    orderBy: [{ lastPostAt: "desc" }, { id: "desc" }],
    take: take + 1,
  });

  return toCursorPage(rows, take, (item) => ({
    v: 1,
    id: item.id,
    lastPostAt: item.lastPostAt.toISOString(),
  }));
}

export async function getThreadBySlug(
  slug: string,
  opts: { cursor?: string | null; take?: number } = {},
) {
  const take = clampTake(opts.take ?? 20);
  const decoded = decodeCursor(opts.cursor);

  const thread = await prisma.forumThread.findUnique({
    where: { slug },
    select: {
      ...threadListSelect,
      content: true,
      locked: true,
    },
  });

  if (!thread) return null;

  // Posts: createdAt ASC, id ASC (ordem de leitura)
  const postWhere: Prisma.ForumPostWhereInput = {
    threadId: thread.id,
    ...(decoded?.createdAt
      ? {
          OR: [
            { createdAt: { gt: new Date(decoded.createdAt) } },
            {
              createdAt: new Date(decoded.createdAt),
              id: { gt: decoded.id },
            },
          ],
        }
      : {}),
  };

  const postRows = await prisma.forumPost.findMany({
    where: postWhere,
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: take + 1,
    select: {
      id: true,
      content: true,
      createdAt: true,
      updatedAt: true,
      author: { select: userPublicSelect },
    },
  });

  const postsPage = toCursorPage(postRows, take, (item) => ({
    v: 1,
    id: item.id,
    createdAt: item.createdAt.toISOString(),
  }));

  void prisma.forumThread.update({
    where: { id: thread.id },
    data: { views: { increment: 1 } },
  });

  return {
    thread,
    posts: postsPage.items,
    nextCursor: postsPage.nextCursor,
    hasMore: postsPage.hasMore,
  };
}

export async function createForumReply(params: {
  threadId: string;
  authorId: string;
  content: string;
}) {
  return prisma.$transaction(async (tx) => {
    const post = await tx.forumPost.create({
      data: {
        threadId: params.threadId,
        authorId: params.authorId,
        content: params.content,
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        author: { select: userPublicSelect },
      },
    });

    await tx.forumThread.update({
      where: { id: params.threadId },
      data: {
        replyCount: { increment: 1 },
        lastPostAt: new Date(),
      },
    });

    return post;
  });
}

export async function getForumCategories() {
  return prisma.forumCategory.findMany({
    orderBy: { order: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      _count: { select: { threads: true } },
    },
  });
}

// ---------------------------------------------------------------------------
// USERS / LEADERBOARD — cursor: level DESC, xp DESC, id DESC
// ---------------------------------------------------------------------------

export async function getLeaderboardCursor(
  opts: {
    cursor?: string | null;
    take?: number;
  } = {},
) {
  const take = clampTake(opts.take ?? 50);
  const decoded = decodeCursor(opts.cursor);

  const where: Prisma.UserWhereInput = decoded
    ? {
        OR: [
          { level: { lt: decoded.level ?? 0 } },
          {
            level: decoded.level ?? 0,
            xp: { lt: decoded.xp ?? 0 },
          },
          {
            level: decoded.level ?? 0,
            xp: decoded.xp ?? 0,
            id: { lt: decoded.id },
          },
        ],
      }
    : {};

  const rows = await prisma.user.findMany({
    where,
    orderBy: [{ level: "desc" }, { xp: "desc" }, { id: "desc" }],
    take: take + 1,
    select: {
      id: true,
      username: true,
      avatar: true,
      level: true,
      xp: true,
      rank: true,
      isPremium: true,
    },
  });

  return toCursorPage(rows, take, (item) => ({
    v: 1,
    id: item.id,
    level: item.level,
    xp: item.xp,
  }));
}

export async function getUserProfile(username: string) {
  return prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      name: true,
      avatar: true,
      bio: true,
      level: true,
      xp: true,
      rank: true,
      isPremium: true,
      premiumUntil: true,
      createdAt: true,
      lastSeenAt: true,
      userEmblems: {
        orderBy: { obtainedAt: "desc" },
        take: 24,
        select: {
          obtainedAt: true,
          emblem: { select: emblemCardSelect },
        },
      },
      _count: {
        select: { threads: true, posts: true },
      },
    },
  });
}

export async function addUserXp(
  userId: string,
  amount: number,
  rankThresholds: number[] = defaultRankThresholds,
) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, level: true, xp: true, rank: true },
    });

    let newXp = user.xp + amount;
    let newLevel = user.level;
    let newRank = user.rank;

    while (newLevel < rankThresholds.length && newXp >= rankThresholds[newLevel]) {
      newLevel += 1;
      newRank = rankNameForLevel(newLevel);
    }

    return tx.user.update({
      where: { id: userId },
      data: { xp: newXp, level: newLevel, rank: newRank },
      select: {
        id: true,
        username: true,
        level: true,
        xp: true,
        rank: true,
      },
    });
  });
}

const defaultRankThresholds = [
  0, 100, 250, 500, 900, 1400, 2000, 2800, 3800, 5000, 6500, 8500, 11000, 14000, 18000,
];

function rankNameForLevel(level: number): string {
  if (level >= 40) return "Lenda";
  if (level >= 30) return "Elite";
  if (level >= 20) return "Veterano";
  if (level >= 10) return "Avançado";
  if (level >= 5) return "Intermediário";
  return "Iniciante";
}

// ---------------------------------------------------------------------------
// MOBIS
// ---------------------------------------------------------------------------

export async function getRecentMobisCursor(
  opts: {
    cursor?: string | null;
    take?: number;
  } = {},
) {
  const take = clampTake(opts.take ?? 12);
  const decoded = decodeCursor(opts.cursor);

  const where: Prisma.MobiWhereInput = decoded?.createdAt
    ? {
        OR: [
          { createdAt: { lt: new Date(decoded.createdAt) } },
          {
            createdAt: new Date(decoded.createdAt),
            id: { lt: decoded.id },
          },
        ],
      }
    : {};

  const rows = await prisma.mobi.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: take + 1,
    select: {
      id: true,
      name: true,
      image: true,
      price: true,
      isLimited: true,
      createdAt: true,
    },
  });

  return toCursorPage(rows, take, (item) => ({
    v: 1,
    id: item.id,
    createdAt: item.createdAt.toISOString(),
  }));
}

export async function getRecentMobis(limit = 12) {
  return prisma.mobi.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      name: true,
      image: true,
      price: true,
      isLimited: true,
    },
  });
}

// ---------------------------------------------------------------------------
// HOME
// ---------------------------------------------------------------------------

export async function getHomeData() {
  const [emblems, mobis, news, threads] = await Promise.all([
    getRecentEmblemsCursor({ take: 6 }),
    getRecentMobis(6),
    getNewsFeedCursor({ take: 4 }),
    getForumThreadsCursor({ take: 5 }),
  ]);

  return {
    emblems: emblems.items,
    mobis,
    news: news.items,
    threads: threads.items,
  };
}

// Re-export tipos úteis
export type { CursorPage, CursorPayload };
