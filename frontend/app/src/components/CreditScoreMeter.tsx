"use client";

const MIN_SCORE = 300;
const MAX_SCORE = 850;

const SEGMENTS = [
  { min: 300, max: 579, color: "#dc2626", label: "Poor" },
  { min: 580, max: 639, color: "#ea580c", label: "Fair" },
  { min: 640, max: 699, color: "#ca8a04", label: "Good" },
  { min: 700, max: 749, color: "#2563eb", label: "Very Good" },
  { min: 750, max: 850, color: "#16a34a", label: "Excellent" },
] as const;

function scoreToAngle(score: number): number {
  const t = Math.max(
    0,
    Math.min(1, (score - MIN_SCORE) / (MAX_SCORE - MIN_SCORE)),
  );
  return 180 - t * 180; // 180° (left) to 0° (right)
}

function angleToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy - r * Math.sin(rad),
  };
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
): string {
  const start = angleToXY(cx, cy, r, startAngle);
  const end = angleToXY(cx, cy, r, endAngle);
  const largeArc = Math.abs(endAngle - startAngle) >= 180 ? 1 : 0;
  const sweep = startAngle > endAngle ? 1 : 0; // clockwise when going from higher to lower angle
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} ${sweep} ${end.x} ${end.y}`;
}

function getScoreRating(score: number): string {
  const seg = SEGMENTS.find((s) => score >= s.min && score <= s.max);
  return seg?.label ?? "—";
}

function getScoreColor(score: number): string {
  const seg = SEGMENTS.find((s) => score >= s.min && score <= s.max);
  return seg?.color ?? "#4a5a75";
}

type Props = {
  score: number | null;
  className?: string;
};

export function CreditScoreMeter({ score, className = "" }: Props) {
  const cx = 100;
  const cy = 95;
  const r = 72;
  const strokeWidth = 12;
  const innerR = r - strokeWidth / 2;

  const indicatorAngle = score !== null ? scoreToAngle(score) : null;
  const indicatorPos =
    indicatorAngle !== null ? angleToXY(cx, cy, innerR, indicatorAngle) : null;

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative w-full max-w-[200px]">
        <svg
          viewBox="0 0 200 120"
          className="w-full h-auto"
          aria-label={
            score !== null
              ? `Credit score: ${score} (${getScoreRating(score)})`
              : "Credit score not available"
          }
        >
          {/* Arc segments */}
          <g strokeLinecap="round" strokeWidth={strokeWidth}>
            {SEGMENTS.map((seg, i) => {
              const startAngle = scoreToAngle(seg.min);
              const endAngle = scoreToAngle(seg.max);
              const d = describeArc(cx, cy, innerR, startAngle, endAngle);
              return (
                <path
                  key={i}
                  d={d}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={strokeWidth}
                />
              );
            })}
          </g>

          {/* Score indicator dot on arc */}
          {indicatorPos && score !== null && (
            <circle
              cx={indicatorPos.x}
              cy={indicatorPos.y}
              r={5}
              fill={getScoreColor(score)}
              stroke="rgba(255, 255, 255, 0.9)"
              strokeWidth={2}
            />
          )}
        </svg>

        {/* Center: score + label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-9">
          <span className="font-mono text-3xl md:text-4xl font-bold text-ink-1 tabular-nums">
            {score !== null ? score : "—"}
          </span>
          <span
            className="text-sm font-medium mt-0.5"
            style={
              score !== null
                ? { color: getScoreColor(score) }
                : { color: "var(--color-ink-4)" }
            }
          >
            {score !== null ? getScoreRating(score) : "—"}
          </span>
        </div>
      </div>
    </div>
  );
}
