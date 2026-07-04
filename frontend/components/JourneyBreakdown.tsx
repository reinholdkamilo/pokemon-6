import type { OpponentBreakdown, TeamScoreResult } from "@/types/pokemon";

type JourneyBreakdownProps = {
  result: TeamScoreResult;
};

export function JourneyBreakdown({ result }: JourneyBreakdownProps) {
  const eliteFourBeaten =
    result.elite_four_unlocked &&
    result.opponent_breakdown.elite_four.every(
      (opponent) => opponent.outcome === "Beat",
    );

  return (
    <div className="journey-breakdown">
      <JourneySection
        title="Gym Leaders"
        opponents={result.opponent_breakdown.gym_leaders}
      />
      <JourneySection
        title="Elite Four"
        opponents={result.opponent_breakdown.elite_four}
        locked={!result.elite_four_unlocked}
        lockedMessage="Locked until all 8 Kanto badges are earned."
      />
      <JourneySection
        title="Champion Gary"
        opponents={result.opponent_breakdown.champion}
        locked={!eliteFourBeaten}
        lockedMessage="Locked until the Elite Four is beaten."
      />
    </div>
  );
}

type JourneySectionProps = {
  title: string;
  opponents: OpponentBreakdown[];
  locked?: boolean;
  lockedMessage?: string;
};

function JourneySection({
  title,
  opponents,
  locked = false,
  lockedMessage,
}: JourneySectionProps) {
  return (
    <section className={`journey-section ${locked ? "locked" : ""}`}>
      <div className="journey-section-header">
        <h4>{title}</h4>
        {locked && <span className="status-pill locked">Locked</span>}
      </div>
      {locked && lockedMessage ? (
        <p className="muted journey-lock-message">{lockedMessage}</p>
      ) : null}
      <div className="opponent-list">
        {opponents.map((opponent) => (
          <OpponentCard
            key={`${opponent.stage}-${opponent.opponent_name}`}
            opponent={opponent}
          />
        ))}
      </div>
    </section>
  );
}

type OpponentCardProps = {
  opponent: OpponentBreakdown;
};

function OpponentCard({ opponent }: OpponentCardProps) {
  const isBeat = opponent.outcome === "Beat";
  const outcomeClass = isBeat ? "pass" : "fail";

  return (
    <article className="opponent-card">
      <div className="opponent-card-main">
        <div>
          <strong>{opponent.opponent_name}</strong>
          <span className="muted">{opponent.stage}</span>
        </div>
        <div className="opponent-score">
          <strong>{opponent.matchup_score}/100</strong>
          <span className={outcomeClass}>{opponent.outcome}</span>
        </div>
      </div>

      {opponent.badge_name ? (
        <div className="badge-result">
          <span>{opponent.badge_name}</span>
          <strong className={opponent.badge_earned ? "pass" : "fail"}>
            {opponent.badge_earned ? "Earned" : "Missing"}
          </strong>
        </div>
      ) : null}

      <p>{opponent.explanation}</p>
    </article>
  );
}
