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
      <p className="muted">{result.path_result}</p>

      <h3>Journey Progress</h3>
      <div>
        <div className="score-row">
          <span>Badges earned</span>
          <strong>
            {result.badges_earned.length}/{result.badges_required}
          </strong>
        </div>
        <div className="score-row">
          <span>Elite Four unlocked</span>
          <strong>{result.elite_four_unlocked ? "Yes" : "No"}</strong>
        </div>
        <div className="score-row">
          <span>Gym score</span>
          <strong>{result.gym_score}</strong>
        </div>
        <div className="score-row">
          <span>Elite Four score</span>
          <strong>{result.elite_four_score}</strong>
        </div>
        <div className="score-row">
          <span>Champion score</span>
          <strong>{result.champion_score}</strong>
        </div>
      </div>

      <h3>Badges</h3>
      {result.badges_earned.length > 0 ? (
        <p>{result.badges_earned.join(", ")}</p>
      ) : (
        <p className="muted">No badges earned.</p>
      )}

      <h3>Score Breakdown</h3>
      <div>
        {Object.entries(result.score_breakdown).map(([label, score]) => (
          <div className="score-row" key={label}>
            <span>{formatScoreLabel(label)}</span>
            <strong>{score}</strong>
          </div>
        ))}
      </div>

      <h3>Opponent Breakdown</h3>
      <div className="opponent-list">
        {[
          ...result.opponent_breakdown.gym_leaders,
          ...result.opponent_breakdown.elite_four,
          ...result.opponent_breakdown.champion,
        ].map((opponent) => (
          <div
            className="opponent-row"
            key={`${opponent.stage}-${opponent.opponent_name}`}
          >
            <div>
              <strong>{opponent.opponent_name}</strong>
              <span className="muted">
                {opponent.stage}
                {opponent.badge_name ? ` · ${opponent.badge_name}` : ""}
              </span>
            </div>
            <div>
              <strong>{opponent.matchup_score}/100</strong>
              <span className={opponent.outcome === "Beat" ? "pass" : "fail"}>
                {opponent.outcome}
              </span>
            </div>
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
