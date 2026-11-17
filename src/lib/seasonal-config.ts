export const seasons = {
  none: {
    label: "Desativado",
    description: "A identidade dourada original, sem decoração sazonal.",
    icon: "sparkle",
  },
  halloween: {
    label: "Halloween",
    description: "Abóboras, fantasminhas e morcegos em pixel art.",
    icon: "pumpkin",
  },
  christmas: {
    label: "Natal",
    description: "Neve suave, luzinhas e presentes de Natal.",
    icon: "tree",
  },
  easter: {
    label: "Páscoa",
    description: "Ovinhos coloridos, coelhinho e detalhes em tons pastel.",
    icon: "egg",
  },
  junina: {
    label: "Festa Junina",
    description: "Bandeirinhas, lanternas e confetes coloridos.",
    icon: "lantern",
  },
} as const;
export type Season = keyof typeof seasons;
export type SeasonalConfig = { theme: Season; motion: boolean };
export const seasonalDefaults: SeasonalConfig = { theme: "none", motion: true };
export function normalizeSeasonal(value: unknown): SeasonalConfig {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ...seasonalDefaults };
  const row = value as Record<string, unknown>;
  const theme =
    typeof row.theme === "string" && Object.prototype.hasOwnProperty.call(seasons, row.theme)
      ? (row.theme as Season)
      : "none";
  return { theme, motion: typeof row.motion === "boolean" ? row.motion : true };
}
