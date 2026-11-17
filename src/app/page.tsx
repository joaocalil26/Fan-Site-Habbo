import { latestFurniture } from "@/lib/external-furniture";
import { latestBadges } from "@/lib/external-badges";
import { latestValues } from "@/lib/values";
import { prisma } from "@/lib/prisma";
import { getSiteConfig } from "@/lib/site";
import HomeContent from "@/components/HomeContent";
export const dynamic = "force-dynamic";
export default async function HomePage() {
  const [site, news, threads, entries, mobis, emblems, ranking, valueFeed] = await Promise.all([
    getSiteConfig(),
    prisma.news.findMany({
      where: { published: true, publishedAt: { lte: new Date() } },
      orderBy: { publishedAt: "desc" },
      take: 8,
      include: { _count: { select: { comments: { where: { hidden: false } } } } },
    }),
    prisma.forumThread.findMany({
      orderBy: [{ pinned: "desc" }, { lastPostAt: "desc" }],
      take: 8,
      include: { author: { select: { username: true } } },
    }),
    prisma.contentEntry.findMany({
      where: { published: true, kind: { in: ["EVENT", "ART", "PODCAST", "BANNER"] } },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      take: 60,
      include: { author: { select: { username: true } } },
    }),
    latestFurniture(),
    latestBadges(),
    prisma.user.findMany({
      where: { isBanned: false },
      orderBy: [{ xp: "desc" }, { id: "asc" }],
      take: 5,
      select: {
        id: true,
        username: true,
        xp: true,
        level: true,
        _count: { select: { posts: true } },
      },
    }),
    latestValues(),
  ]);
  return (
    <HomeContent
      site={site}
      values={valueFeed.items}
      news={news.map((n) => ({
        id: n.id,
        slug: n.slug,
        title: n.title,
        excerpt: n.excerpt,
        image: n.image,
        comments: n._count.comments,
        publishedAt: n.publishedAt.toISOString(),
      }))}
      threads={threads.map((t) => ({
        id: t.id,
        slug: t.slug,
        title: t.title,
        author: t.author.username || "Membro",
        replies: t.replyCount,
      }))}
      entries={entries.map((e) => ({
        id: e.id,
        kind: e.kind,
        slug: e.slug,
        title: e.title,
        excerpt: e.excerpt,
        image: e.image,
        mediaUrl: e.mediaUrl,
        status: e.status,
        author: e.author.username || "Equipe",
      }))}
      mobiSource={mobis.source}
      mobis={mobis.items.map((m) => ({
        id: m.id,
        name: m.name,
        image: m.image,
        classname: m.classname,
      }))}
      emblemSource={emblems.source}
      emblems={emblems.items.map((e) => ({ id: e.id, name: e.name, image: e.image, code: e.code }))}
      ranking={ranking.map((u) => ({
        id: u.id,
        name: u.username || "Membro",
        xp: u.xp,
        level: u.level,
        comments: u._count.posts,
      }))}
    />
  );
}
