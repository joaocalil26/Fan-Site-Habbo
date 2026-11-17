import Link from "next/link";

type NewsCardProps = {
  item: {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    category: string;
    image: string | null;
    views: number;
    publishedAt: Date | string;
  };
};

export default function NewsCard({ item }: NewsCardProps) {
  const date =
    typeof item.publishedAt === "string"
      ? item.publishedAt.slice(0, 10)
      : item.publishedAt.toISOString().slice(0, 10);

  return (
    <Link
      href={`/noticias/${item.slug}`}
      className="card-lift group flex gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 hover:bg-[var(--card-hover)]"
    >
      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-4xl">
        {item.image ?? "📰"}
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase text-cyan-300">
            {item.category}
          </span>
          <span className="text-xs text-slate-500">{date}</span>
        </div>
        <h3 className="font-semibold text-white group-hover:text-cyan-300 transition line-clamp-2">
          {item.title}
        </h3>
        {item.excerpt && <p className="mt-1 text-sm text-slate-400 line-clamp-2">{item.excerpt}</p>}
        <p className="mt-2 text-xs text-slate-500">
          {item.views.toLocaleString("pt-BR")} visualizações
        </p>
      </div>
    </Link>
  );
}
