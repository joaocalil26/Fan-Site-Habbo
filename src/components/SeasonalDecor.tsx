import type { CSSProperties } from "react";
import type { SeasonalConfig } from "@/lib/seasonal-config";
import { seasons } from "@/lib/seasonal-config";
import SeasonPixel from "./SeasonPixel";
const decorations = {
  halloween: { left: "pumpkin", right: "ghost", particles: ["bat", "sparkle", "bat"] },
  christmas: { left: "tree", right: "gift", particles: ["snow", "snow", "sparkle"] },
  easter: { left: "bunny", right: "egg", particles: ["egg", "sparkle", "sparkle"] },
  junina: { left: "lantern", right: "flag", particles: ["confetti", "sparkle", "confetti"] },
};
export default function SeasonalDecor({ config }: { config: SeasonalConfig }) {
  if (config.theme === "none") return null;
  const art = decorations[config.theme];
  return (
    <div
      className={`seasonal-effects season-${config.theme}`}
      data-motion={config.motion ? "on" : "off"}
      aria-hidden="true"
    >
      {(config.theme === "junina" || config.theme === "christmas") && (
        <div className="seasonal-garland">
          <svg viewBox="0 0 800 52" preserveAspectRatio="none">
            <path
              d="M0 2 Q400 46 800 2"
              fill="none"
              stroke={config.theme === "junina" ? "#a79570" : "#6f8b65"}
              strokeWidth="1"
            />
            {Array.from({ length: 16 }, (_, i) => {
              const x = 25 + i * 50;
              const y = 2 + (1 - ((x - 400) / 400) ** 2) * 22;
              const color = ["#c98563", "#d9b767", "#91a580", "#b49aaf"][i % 4];
              return config.theme === "junina" ? (
                <polygon
                  key={i}
                  points={`${x - 10},${y} ${x + 10},${y} ${x + 10},${y + 22} ${x},${y + 15} ${x - 10},${y + 22}`}
                  fill={color}
                  shapeRendering="crispEdges"
                />
              ) : (
                <g key={i} className="seasonal-bulb" style={{ animationDelay: `${i * 0.23}s` }}>
                  <path d={`M${x} ${y}v5`} stroke="#718365" strokeWidth="1.5" />
                  <rect x={x - 2} y={y + 4} width="4" height="3" fill="#8e936b" />
                  <circle
                    cx={x}
                    cy={y + 10}
                    r="4"
                    fill={["#e1ba6b", "#c9806b", "#9cb38b"][i % 3]}
                  />
                </g>
              );
            })}
          </svg>
        </div>
      )}
      <span className="seasonal-corner seasonal-corner-left">
        <SeasonPixel name={art.left} size={42} />
      </span>
      <span className="seasonal-corner seasonal-corner-right">
        <SeasonPixel name={art.right} size={38} />
      </span>
      <span className="seasonal-caption">{seasons[config.theme].label} no IdBlet</span>
      <div className="seasonal-particles">
        {[2, 6, 11, 17, 84, 89, 94, 98].map((left, i) => (
          <span
            key={i}
            className="seasonal-particle"
            style={
              {
                left: `${left}%`,
                "--season-delay": `${-i * 2.8}s`,
                "--season-duration": `${19 + (i % 4) * 3}s`,
                "--season-sway": `${i % 2 ? -14 : 14}px`,
                top: `${i * 12}%`,
              } as CSSProperties
            }
          >
            <SeasonPixel
              name={art.particles[i % art.particles.length]}
              size={config.theme === "halloween" ? 19 : 12 + (i % 3) * 2}
            />
          </span>
        ))}
      </div>
    </div>
  );
}
