type EmblemCardProps = {
  emblem: {
    code: string;
    name: string;
    image: string;
    rarity: string;
  };
};

const rarityColors: Record<string, string> = {
  COMUM: "border-slate-600 bg-slate-800/50",
  RARO: "border-blue-500/50 bg-blue-500/10",
  EPICO: "border-purple-500/50 bg-purple-500/10",
  LENDARIO: "border-amber-400/60 bg-amber-500/10",
  comum: "border-slate-600 bg-slate-800/50",
  raro: "border-blue-500/50 bg-blue-500/10",
  epico: "border-purple-500/50 bg-purple-500/10",
  lendario: "border-amber-400/60 bg-amber-500/10",
};

const rarityLabel: Record<string, string> = {
  COMUM: "Comum",
  RARO: "Raro",
  EPICO: "Épico",
  LENDARIO: "Lendário",
  comum: "Comum",
  raro: "Raro",
  epico: "Épico",
  lendario: "Lendário",
};

export default function EmblemCard({ emblem }: EmblemCardProps) {
  const key = emblem.rarity;
  return (
    <div
      className={`card-lift flex flex-col items-center gap-2 rounded-xl border p-3 ${
        rarityColors[key] ?? rarityColors.COMUM
      }`}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-slate-900/60 text-3xl">
        {emblem.image}
      </div>
      <div className="text-center">
        <p className="text-xs font-mono text-slate-400">{emblem.code}</p>
        <p className="text-sm font-medium text-white leading-tight">{emblem.name}</p>
        <span className="mt-1 inline-block text-[10px] uppercase tracking-wide text-slate-400">
          {rarityLabel[key] ?? key}
        </span>
      </div>
    </div>
  );
}
