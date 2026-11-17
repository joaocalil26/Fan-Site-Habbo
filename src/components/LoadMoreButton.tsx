"use client";

type Props = {
  onClick: () => void;
  loading?: boolean;
  hasMore?: boolean;
  label?: string;
};

export default function LoadMoreButton({
  onClick,
  loading,
  hasMore = true,
  label = "Carregar mais",
}: Props) {
  if (!hasMore) return null;
  return (
    <div className="mt-8 flex justify-center">
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className="rounded-full border border-slate-600 bg-slate-800 px-6 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-700 disabled:opacity-50 transition"
      >
        {loading ? "Carregando..." : label}
      </button>
    </div>
  );
}
