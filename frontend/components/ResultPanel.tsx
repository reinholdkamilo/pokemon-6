import { BadgeDisplay } from "@/components/BadgeDisplay";
import { JourneyBreakdown } from "@/components/JourneyBreakdown";
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

  const resultText = result.result || "Result unavailable";
  const totalScore =
    typeof result.total_score === "number" ? result.total_score : 0;
  const badgesEarned = result.badges_earned ?? [];
  const badgesRequired = result.badges_required ?? 8;
  const scoreBreakdown = result.score_breakdown ?? {};
  const warnings = result.warnings ?? [];
  const resultClass = resultText.toLowerCase().startsWith("win")
    ? "win"
    : "lose";

  return (
    <section className={`panel result-panel ${resultClass}`} aria-label="Team result">
      <h2>Result</h2>
      <div className="result-hero">
        <div>
          <div className="score-total">{totalScore}/100</div>
          <h3>{resultText}</h3>
        </div>
        <div className={`result-state ${resultClass}`}>
          {resultClass === "win" ? "Win" : "Lose"}
        </div>
      </div>
      <p>{result.explanation || "No scoring explanation returned."}</p>

      <h3>Journey Progress</h3>
      <div className="journey-summary">
        <div className="summary-card">
          <span>Badges earned</span>
          <strong>
            {badgesEarned.length}/{badgesRequired}
          </strong>
        </div>
        <div className="summary-card">
          <span>Elite Four unlocked</span>
          <strong>{result.elite_four_unlocked ? "Yes" : "No"}</strong>
        </div>
        <div className="summary-card">
          <span>Path result</span>
          <strong>{result.path_result || "Path result unavailable"}</strong>
        </div>
      </div>

      <h3>Badges</h3>
      <BadgeDisplay earnedBadges={badgesEarned} />

      <h3>Stage Scores</h3>
      <div>
        <div className="score-row">
          <span>Gym score</span>
          <strong>{result.gym_score ?? 0}</strong>
        </div>
        <div className="score-row">
          <span>Elite Four score</span>
          <strong>{result.elite_four_score ?? 0}</strong>
        </div>
        <div className="score-row">
          <span>Champion score</span>
          <strong>{result.champion_score ?? 0}</strong>
        </div>
      </div>

      <h3>Score Breakdown</h3>
      <div>
        {Object.entries(scoreBreakdown).length > 0 ? (
          Object.entries(scoreBreakdown).map(([label, score]) => (
            <div className="score-row" key={label}>
              <span>{formatScoreLabel(label)}</span>
              <strong>{score}</strong>
            </div>
          ))
        ) : (
          <p className="muted">No score breakdown returned.</p>
        )}
      </div>

      <h3>Opponent Breakdown</h3>
      <JourneyBreakdown result={result} />

      <h3>Warnings</h3>
      {warnings.length > 0 ? (
        <ul className="warning-list">
          {warnings.map((warning) => (
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
