type Props = { name: string; size?: number; className?: string };
export default function SeasonPixel({ name, size = 32, className }: Props) {
  const art: Record<string, React.ReactNode> = {
    pumpkin: (
      <>
        <path d="M14 3h4v5h-4z" fill="#65773f" />
        <path d="M9 8h14v3h4v4h2v9h-3v4H6v-4H3v-9h2v-4h4z" fill="#c97529" />
        <path d="M10 9h4v18h-4zm8 0h4v18h-4z" fill="#ee9e3f" />
        <path d="M8 14h5v5H8zm11 0h5v5h-5zm-8 8h10v3H11z" fill="#45322e" />
        <path d="M9 15h2v2H9zm11 0h2v2h-2z" fill="#ffe49b" />
      </>
    ),
    ghost: (
      <>
        <path d="M11 4h10v3h4v4h2v18h-5v-4h-4v4h-4v-4h-4v4H5V11h2V7h4z" fill="#e6dfcf" />
        <path d="M7 14h2v11H7zm5-8h8v2h-8z" fill="#fff9e9" />
        <path d="M11 12h3v5h-3zm8 0h3v5h-3zm-5 8h5v4h-5z" fill="#5a4d6a" />
      </>
    ),
    bat: (
      <>
        <path
          d="M2 7h4v4h5V8h3V5h4v3h3v3h5V7h4v15h-4v-3h-5v4h-3v3h-4v-3h-3v-4H6v3H2z"
          fill="#63516f"
        />
        <path d="M4 12h3v3h5v4H9v-2H4zm24 0h-3v3h-5v4h3v-2h5z" fill="#8e6f91" />
        <path d="M13 13h2v2h-2zm5 0h2v2h-2z" fill="#f3bb62" />
      </>
    ),
    tree: (
      <>
        <path d="M14 1h4v3h3v3h-3v3h-4V7h-3V4h3z" fill="#edc56e" />
        <path d="M13 8h6v4h4v4h-3v2h6v5h-4v2h7v4H3v-4h7v-2H6v-5h6v-2H9v-4h4z" fill="#52735a" />
        <path d="M15 11h3v3h-3zm-5 9h3v3h-3zm9 4h3v3h-3z" fill="#cc6960" />
        <path d="M17 17h3v3h-3zm-9 8h3v3H8z" fill="#e8bb62" />
        <path d="M13 29h6v3h-6z" fill="#9b754c" />
      </>
    ),
    snow: (
      <path
        d="M14 2h4v9l5-5 3 3-6 5h10v4H20l6 5-3 3-5-5v9h-4v-9l-5 5-3-3 5-5H2v-4h9L6 9l3-3 5 5z"
        fill="#bad1ce"
      />
    ),
    gift: (
      <>
        <path d="M4 12h24v6H4zm2 6h20v12H6z" fill="#c27663" />
        <path d="M14 12h4v18h-4z" fill="#edd28d" />
        <path d="M8 4h6v4h4V4h6v7H8z" fill="#b89f61" />
        <path d="M11 6h3v3h-3zm7 0h3v3h-3z" fill="#f6e3b2" />
        <path d="M7 19h5v2H7z" fill="#e4987f" />
      </>
    ),
    egg: (
      <>
        <path d="M13 2h6v3h4v5h3v5h2v10h-4v4H8v-4H4V15h2v-5h3V5h4z" fill="#d3b9bf" />
        <path d="M9 9h14v4H9zM5 17h22v4H5z" fill="#edcd80" />
        <path d="M10 13h3v4h-3zm9 0h3v4h-3zM9 23h4v3H9zm10 0h4v3h-4z" fill="#a3b68b" />
        <path d="M13 4h4v3h-4zM8 14h3v3H8z" fill="#f8e5dd" />
      </>
    ),
    bunny: (
      <>
        <path d="M7 1h6v13h6V1h6v17h3v10h-4v3H8v-3H4V18h3z" fill="#eadfca" />
        <path d="M9 3h2v10H9zm12 0h2v10h-2z" fill="#d8adb1" />
        <path d="M9 19h3v4H9zm11 0h3v4h-3z" fill="#625e55" />
        <path d="M14 24h4v3h-4z" fill="#d3a3a3" />
        <path d="M11 27h4v2h-4zm6 0h4v2h-4z" fill="#b7a99b" />
      </>
    ),
    lantern: (
      <>
        <path d="M14 1h4v4h5v4h4v11h-4v5h-5v3h-4v-3H9v-5H5V9h4V5h5z" fill="#c78052" />
        <path d="M14 4h4v21h-4zM8 11h17v6H8z" fill="#e5b86b" />
        <path d="M9 6h3v4H9zm11 0h3v4h-3z" fill="#e5c787" />
        <path d="M14 28h4v4h-4zm-5-2h3v5H9zm11 0h3v5h-3z" fill="#ab9770" />
      </>
    ),
    flag: (
      <>
        <path d="M3 3h26v3H3z" fill="#9a8f74" />
        <path d="M5 6h22v23l-11-7-11 7z" fill="#c87f61" />
        <path d="M8 8h4v10H8z" fill="#e4ab7f" />
      </>
    ),
    confetti: (
      <>
        <path d="M3 3h7v5H3z" fill="#d3b369" />
        <path d="M21 5h5v8h-5z" fill="#bd7d67" />
        <path d="M11 16h7v5h-7z" fill="#8fa580" />
        <path d="M4 26h5v4H4zM24 23h5v5h-5z" fill="#ba9eb5" />
      </>
    ),
    sparkle: <path d="M14 1h4v9h4v4h9v4h-9v4h-4v9h-4v-9h-4v-4H1v-4h9v-4h4z" fill="#dbb567" />,
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      shapeRendering="crispEdges"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {art[name] || art.sparkle}
    </svg>
  );
}
