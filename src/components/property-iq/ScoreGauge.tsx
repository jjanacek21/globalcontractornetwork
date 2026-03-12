interface ScoreGaugeProps {
  score: number;
  label: string;
  size?: number;
}

const getScoreColor = (score: number): string => {
  if (score >= 80) return 'hsl(0, 84%, 50%)'; // red - high urgency
  if (score >= 60) return 'hsl(35, 92%, 50%)'; // orange
  if (score >= 40) return 'hsl(45, 93%, 50%)'; // yellow
  return 'hsl(142, 71%, 45%)'; // green - low urgency
};

const getScoreLabel = (score: number): string => {
  if (score >= 80) return 'High';
  if (score >= 60) return 'Moderate';
  if (score >= 40) return 'Low';
  return 'Minimal';
};

export const ScoreGauge = ({ score, label, size = 120 }: ScoreGaugeProps) => {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = getScoreColor(score);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="8"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold" style={{ color }}>{score}</span>
          <span className="text-[10px] text-muted-foreground">{getScoreLabel(score)}</span>
        </div>
      </div>
      <span className="text-xs font-medium text-muted-foreground text-center">{label}</span>
    </div>
  );
};
