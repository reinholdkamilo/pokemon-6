import type { OpponentBreakdown, TeamScoreResult } from "@/types/pokemon";

type JourneyBreakdownProps = {
  result: TeamScoreResult;
};

export function JourneyBreakdown({ result }: JourneyBreakdownProps) {
  const opponentBreakdown = result.opponent_breakdown ?? {};
  const gymLeaders = opponentBreakdown.gym_leaders ?? [];
  const eliteFour = opponentBreakdown.elite_four ?? [];
  const champion = opponentBreakdown.champion ?? [];
  const eliteFourBeaten =
    result.elite_four_unlocked &&
    eliteFour.length > 0 &&
    eliteFour.every((opponent) => opponent.outcome === "Beat");

  return (
    <div className="journey-breakdown">
      <JourneySection title="Gym Leaders" opponents={gymLeaders} />
      <JourneySection
        title="Elite Four"
        opponents={eliteFour}
        locked={!result.elite_four_unlocked}
        lockedMessage="Locked until all 8 Kanto badges are earned."
      />
      <JourneySection
        title="Champion Gary"
        opponents={champion}
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
        {opponents.length > 0 ? (
          opponents.map((opponent) => (
            <OpponentCard
              key={`${opponent.stage}-${opponent.opponent_name}`}
              opponent={opponent}
            />
          ))
        ) : (
          <p className="muted">No opponent details returned.</p>
        )}
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
  const opponentName = opponent.opponent_name || "Unknown opponent";
  const stage = opponent.stage || "Unknown stage";
  const matchupScore =
    typeof opponent.matchup_score === "number" ? opponent.matchup_score : 0;
  const outcome = opponent.outcome || "Unknown";

  return (
    <article className="opponent-card">
      <div className="opponent-card-main">
        <div>
          <strong>{opponentName}</strong>
          <span className="muted">{stage}</span>
        </div>
        <div className="opponent-score">
          <strong>{matchupScore}/100</strong>
          <span className={outcomeClass}>{outcome}</span>
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

      <p>{opponent.explanation || "No explanation returned for this matchup."}</p>
    </article>
  );
}
