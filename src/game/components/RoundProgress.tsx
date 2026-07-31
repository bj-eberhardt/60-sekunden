type RoundProgressProps = {
  currentRound: number;
  targetRounds: number;
  completed?: boolean;
};

export function RoundProgress({
  currentRound,
  targetRounds,
  completed = false,
}: RoundProgressProps) {
  const clampedTarget = Math.max(targetRounds, 1);
  const progressRound = completed ? currentRound : currentRound - 1;
  const progress = Math.min(Math.max(progressRound / clampedTarget, 0), 1);
  const label = completed
    ? `Runde ${currentRound} von ${clampedTarget} abgeschlossen`
    : `Runde ${currentRound} von ${clampedTarget}`;

  return (
    <div className="round-progress" aria-label={label} data-testid="round-progress">
      <div className="round-progress-header">
        <span data-testid="round-progress-label">{label}</span>
        <span data-testid="round-progress-percent">{Math.round(progress * 100)}%</span>
      </div>
      <div className="round-progress-track" aria-hidden="true">
        <div
          className="round-progress-fill"
          data-testid="round-progress-fill"
          style={{ inlineSize: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
}
