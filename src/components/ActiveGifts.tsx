import { currentMember } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import EventGift from "@/components/EventGift";

export default async function ActiveGifts() {
  const member = await currentMember();
  if (!member) return null;
  const now = new Date();
  const events = await prisma.contentEntry.findMany({
    where: {
      kind: "EVENT",
      published: true,
      giftEnabled: true,
      status: { not: "Finalizado" },
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
      ],
      rewards: { some: {} },
      giftClaims: { none: { userId: member.id } },
    },
    select: { id: true, title: true, _count: { select: { rewards: true } } },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: 10,
  });
  return (
    <EventGift gifts={events.map((e) => ({ id: e.id, title: e.title, count: e._count.rewards }))} />
  );
}
