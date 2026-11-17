import { prisma } from "@/lib/prisma";

export type CatalogValue = {
  id: string;
  name: string;
  price: number;
  image: string;
  icon: string;
  status: null;
};

export type ValuesPage = {
  items: CatalogValue[];
  total: number;
  page: number;
  hasMore: boolean;
  source: "local";
};

export async function latestValues({
  page = 1,
  take = 6,
  query = "",
}: { page?: number; take?: number; query?: string } = {}): Promise<ValuesPage> {
  page = Number.isSafeInteger(page) ? Math.max(1, Math.min(10000, page)) : 1;
  take = Number.isSafeInteger(take) ? Math.max(1, Math.min(50, take)) : 6;
  query = query.trim().slice(0, 100);
  const where = query ? { name: { contains: query } } : {};
  const [rows, total] = await Promise.all([
    prisma.mobi.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take,
      skip: (page - 1) * take,
    }),
    prisma.mobi.count({ where }),
  ]);
  return {
    items: rows.map((row) => ({
      id: row.id,
      name: row.name,
      price: row.price,
      image: row.image,
      icon: row.image,
      status: null,
    })),
    total,
    page,
    hasMore: page * take < total,
    source: "local",
  };
}
