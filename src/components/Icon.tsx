import type { CSSProperties } from "react";
const paths: Record<string, string> = {
  arrow: "M5 12h14m-6-6 6 6-6 6",
  external: "M14 4h6v6M20 4 9 15M10 4H4v16h16v-6",
  chevron: "m9 5 7 7-7 7",
  headphones: "M4 14v-3a8 8 0 0 1 16 0v3M4 13H2v7h5v-7H4Zm16 0h2v7h-5v-7h3Z",
  play: "m9 5 11 7-11 7V5Z",
  pause: "M8 5v14M16 5v14",
  sparkle: "m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3ZM20 2v4m-2-2h4",
  news: "M4 4h16v16H4V4Zm4 4h4v5H8V8Zm7 0h2m-2 4h2m-9 4h9",
  badge:
    "m12 2 3 2 4 .5.5 4 2 3-2 3-.5 4-4 .5-3 2-3-2-4-.5-.5-4-2-3 2-3 .5-4 4-.5L12 2Zm-4 9 3 3 5-6",
  coin: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-7-5h-3a2 2 0 0 0 0 4h2a2 2 0 0 1 0 4h-3m2-10v2m0 8v2",
  chat: "M21 11a9 9 0 1 0-5 8l5 2-1-5 1-5Z",
  calendar: "M4 5h16v16H4V5Zm0 5h16M8 2v6m8-6v6M8 14h2m4 0h2m-8 3h2",
  image: "M3 3h18v18H3V3Zm0 14 6-6 5 5 3-3 4 4M16 7h.01",
  trophy: "M8 3h8v7a4 4 0 0 1-8 0V3Zm0 2H3v3a5 5 0 0 0 5 5m8-8h5v3a5 5 0 0 1-5 5m-4 1v6m-5 1h10",
  search: "M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Zm-2 5 6 6",
  menu: "M4 6h16M4 12h16M4 18h16",
  close: "m6 6 12 12M6 18 18 6",
  user: "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2a8 8 0 0 1 16 0v2",
  volume: "M4 9h4l5-5v16l-5-5H4V9Zm13-2a7 7 0 0 1 0 10m3-13a11 11 0 0 1 0 16",
  radio: "M4 8h16v13H4V8Zm2-4 13-3M7 12h10m-7 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm7 0h.01",
  bolt: "m14 2-10 12h7l-1 8L20 10h-7l1-8Z",
  heart: "M20 5a5 5 0 0 0-8 1 5 5 0 0 0-8-1C-2 11 12 21 12 21S26 11 20 5Z",
};
export default function Icon({
  name,
  size = 20,
  className,
  style,
}: {
  name: string;
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      style={style}
    >
      <path d={paths[name] || paths.sparkle} />
    </svg>
  );
}
