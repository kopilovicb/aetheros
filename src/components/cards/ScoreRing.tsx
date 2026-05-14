"use client";

type ScoreRingProps = {
  score: number;
  label: string;
  size: "sm" | "lg";
};

function getScoreColor(score: number): string {
  if (score >= 67) {
    return "#10b981";
  }

  if (score >= 34) {
    return "#f59e0b";
  }

  return "#ef4444";
}

export function ScoreRing({ score, label, size }: ScoreRingProps) {
  const dimensions = size === "lg" ? 104 : 82;
  const strokeWidth = size === "lg" ? 8 : 7;
  const radius = (dimensions - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const normalizedScore = Math.max(0, Math.min(100, score));
  const offset = circumference - (normalizedScore / 100) * circumference;

  return (
    <div className="flex min-w-0 flex-col items-center gap-2">
      <div className="relative" style={{ height: dimensions, width: dimensions }}>
        <svg
          className="-rotate-90"
          height={dimensions}
          viewBox={`0 0 ${dimensions} ${dimensions}`}
          width={dimensions}
        >
          <circle
            cx={dimensions / 2}
            cy={dimensions / 2}
            fill="transparent"
            r={radius}
            stroke="#2a2a2a"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={dimensions / 2}
            cy={dimensions / 2}
            fill="transparent"
            r={radius}
            stroke={getScoreColor(normalizedScore)}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            strokeWidth={strokeWidth}
            className="transition-all duration-500"
          />
        </svg>
        <span
          className={`absolute inset-0 flex items-center justify-center font-semibold text-[#f9fafb] ${
            size === "lg" ? "text-3xl" : "text-xl"
          }`}
        >
          {Math.round(normalizedScore)}
        </span>
      </div>
      <p className="max-w-24 text-center text-xs leading-4 text-[#9ca3af]">
        {label}
      </p>
    </div>
  );
}
