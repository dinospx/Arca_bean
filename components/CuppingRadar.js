"use client";

import { useId, useState } from "react";

const AXES = [
  { key: "acidity", label: "Acidity", angle: -90 },
  { key: "body", label: "Body", angle: -18 },
  { key: "sweetness", label: "Sweetness", angle: 54 },
  { key: "aroma", label: "Aroma", angle: 126 },
  { key: "finish", label: "Finish", angle: 198 },
];

function polarToCartesian(cx, cy, r, angleInDegrees) {
  const angleInRadians = (angleInDegrees * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(angleInRadians),
    y: cy + r * Math.sin(angleInRadians),
  };
}

export default function CuppingRadar({
  profile = { acidity: 3.5, body: 4.0, sweetness: 4.0, aroma: 4.5, finish: 4.0 },
  score,
  compact = false,
  className = "",
}) {
  const id = useId();
  const [activeAxis, setActiveAxis] = useState(null);

  const size = compact ? 160 : 260;
  const cx = size / 2;
  const cy = size / 2;
  const maxRadius = compact ? 52 : 88;
  const maxScore = 5;

  const levels = [1, 2, 3, 4, 5];

  // Generate background concentric web paths (5-sided pentagons)
  const webPaths = levels.map((lvl) => {
    const r = (lvl / maxScore) * maxRadius;
    const points = AXES.map((axis) => {
      const { x, y } = polarToCartesian(cx, cy, r, axis.angle);
      return `${x},${y}`;
    });
    return points.join(" ");
  });

  // Calculate coordinates for the coffee's profile polygon
  const profilePoints = AXES.map((axis) => {
    const val = profile[axis.key] ?? 3;
    const r = Math.max(0.4, Math.min(5, val) / maxScore) * maxRadius;
    return polarToCartesian(cx, cy, r, axis.angle);
  });

  const polygonPath = profilePoints.map((p) => `${p.x},${p.y}`).join(" ");

  const ariaDescription = AXES.map(
    (a) => `${a.label}: ${profile[a.key] || 0} of 5`
  ).join(", ");

  return (
    <div
      className={`cupping-radar ${compact ? "cupping-radar--compact" : ""} ${className}`}
      role="img"
      aria-label={`Cupping radar chart: ${ariaDescription}${score ? `. SCA Score: ${score}` : ""}`}
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="cupping-radar__svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`radarGrad-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c9a06a" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#7b3f1d" stopOpacity="0.25" />
          </linearGradient>
          <filter id={`glow-${id}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#7b3f1d" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* Concentric pentagon guide webs */}
        {webPaths.map((pts, i) => (
          <polygon
            key={i}
            points={pts}
            fill={i === levels.length - 1 ? "rgba(244, 243, 243, 0.55)" : "none"}
            stroke="rgba(169, 120, 77, 0.18)"
            strokeWidth={i === levels.length - 1 ? "1.5" : "0.75"}
            strokeDasharray={i < levels.length - 1 ? "2 3" : "none"}
          />
        ))}

        {/* Axis radial spokes */}
        {AXES.map((axis) => {
          const outer = polarToCartesian(cx, cy, maxRadius, axis.angle);
          return (
            <line
              key={axis.key}
              x1={cx}
              y1={cy}
              x2={outer.x}
              y2={outer.y}
              stroke="rgba(169, 120, 77, 0.22)"
              strokeWidth="1"
            />
          );
        })}

        {/* Sensory Profile Polygon */}
        <polygon
          points={polygonPath}
          fill={`url(#radarGrad-${id})`}
          stroke="#a9784d"
          strokeWidth={compact ? "1.75" : "2.25"}
          strokeLinejoin="round"
          className="cupping-radar__polygon"
          filter={`url(#glow-${id})`}
        />

        {/* Vertex dots */}
        {profilePoints.map((pt, i) => {
          const axis = AXES[i];
          const isActive = activeAxis === axis.key;
          return (
            <g
              key={axis.key}
              onMouseEnter={() => setActiveAxis(axis.key)}
              onMouseLeave={() => setActiveAxis(null)}
              className="cupping-radar__vertex"
            >
              <circle
                cx={pt.x}
                cy={pt.y}
                r={compact ? (isActive ? 4.5 : 3) : isActive ? 6 : 4}
                fill="#532e12"
                stroke="#c9a06a"
                strokeWidth={compact ? "1.5" : "2"}
                style={{ transition: "all 0.2s ease" }}
              />
            </g>
          );
        })}

        {/* Axis Labels (only shown when not compact or styled appropriately) */}
        {!compact &&
          AXES.map((axis) => {
            const labelPos = polarToCartesian(cx, cy, maxRadius + 22, axis.angle);
            const val = profile[axis.key] ?? 3;
            const isActive = activeAxis === axis.key;

            return (
              <text
                key={axis.key}
                x={labelPos.x}
                y={labelPos.y}
                textAnchor="middle"
                dominantBaseline="central"
                className={`cupping-radar__label ${isActive ? "is-active" : ""}`}
                fill={isActive ? "#532e12" : "#6f4e37"}
                fontSize={compact ? "9" : "11"}
                fontWeight={isActive ? "700" : "600"}
              >
                {axis.label} ({val})
              </text>
            );
          })}
      </svg>

      {/* Axis readout for accessibility & compact glance */}
      {compact && (
        <div className="cupping-radar__compact-legend">
          <span className="cupping-radar__compact-item">Acid <strong>{profile.acidity}</strong></span>
          <span className="cupping-radar__compact-item">Body <strong>{profile.body}</strong></span>
          <span className="cupping-radar__compact-item">Sweet <strong>{profile.sweetness}</strong></span>
        </div>
      )}
    </div>
  );
}
