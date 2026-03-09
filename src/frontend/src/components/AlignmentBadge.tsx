import { cn } from "@/lib/utils";

interface AlignmentBadgeProps {
  score: number;
  className?: string;
}

export function AlignmentBadge({ score, className }: AlignmentBadgeProps) {
  const isHigh = score >= 70;
  const isMid = score >= 40 && score < 70;

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-mono font-semibold border",
        isHigh && "bg-score-high/15 text-score-high border-score-high/30",
        isMid && "bg-score-mid/15 text-score-mid border-score-mid/30",
        !isHigh &&
          !isMid &&
          "bg-score-low/15 text-score-low border-score-low/30",
        className,
      )}
    >
      {score}
    </span>
  );
}
