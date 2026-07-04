import type { TeamScoreResult } from "@/types/pokemon";

type ResultPanelProps = {
  result: TeamScoreResult | null;
};

export function ResultPanel({ result }: ResultPanelProps) {
  if (!result) {
    return (
      <section className="panel result-panel" aria-label="Team result">
        <h2>Result</h2>
        <p className="muted">Submit a complete team of six to see the score.</p>
      </section>
    );
  }

  const resultClass = result.result.toLowerCase().startsWith("win")
    ? "win"
    : "lose";

  return (
    <section className={`panel result-panel ${resultClass}`} aria-label="Team result">
      <h2>Result</h2>
      <div className="score-total">{result.total_score}/100</div>
      <h3>{result.result}</h3>
      <p>{result.explanation}</p>

      <h3>Score Breakdown</h3>
      <div>
        {Object.entries(result.score_breakdown).map(([label, score]) => (
          <div className="score-row" key={label}>
            <span>{formatScoreLabel(label)}</span>
            <strong>{score}</strong>
          </div>
        ))}
      </div>

      <h3>Warnings</h3>
      {result.warnings.length > 0 ? (
        <ul className="warning-list">
          {result.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      ) : (
        <p className="muted">No warnings for this team.</p>
      )}
    </section>
  );
}

function formatScoreLabel(label: string) {
  return label
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
