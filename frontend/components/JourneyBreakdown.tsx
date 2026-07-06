import { LocalSprite } from "@/components/LocalSprite";
import { BADGE_IMAGE_PATHS, getTrainerSprite } from "@/lib/imagePaths";
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
        title="Champion"
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
              locked={locked}
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
  locked: boolean;
  opponent: OpponentBreakdown;
};

const OPPONENT_META: Record<
  string,
  { pokemonCount: number; specialty: string; fallback: string }
> = {
  Brock: { pokemonCount: 2, specialty: "Rock", fallback: "B" },
  Misty: { pokemonCount: 2, specialty: "Water", fallback: "M" },
  "Lt. Surge": { pokemonCount: 3, specialty: "Electric", fallback: "LS" },
  Erika: { pokemonCount: 4, specialty: "Grass", fallback: "E" },
  Koga: { pokemonCount: 4, specialty: "Poison", fallback: "K" },
  Sabrina: { pokemonCount: 4, specialty: "Psychic", fallback: "S" },
  Blaine: { pokemonCount: 4, specialty: "Fire", fallback: "B" },
  Giovanni: { pokemonCount: 5, specialty: "Ground", fallback: "G" },
  Lorelei: { pokemonCount: 5, specialty: "Ice / Water", fallback: "L" },
  Bruno: { pokemonCount: 5, specialty: "Fighting / Rock", fallback: "B" },
  Agatha: { pokemonCount: 5, specialty: "Ghost / Poison", fallback: "A" },
  Lance: { pokemonCount: 5, specialty: "Dragon / Flying", fallback: "L" },
  Gary: { pokemonCount: 6, specialty: "Mixed", fallback: "G" },
};

function OpponentCard({ locked, opponent }: OpponentCardProps) {
  const isBeat = opponent.outcome === "Beat";
  const outcomeClass = isBeat ? "pass" : "fail";
  const opponentName = opponent.opponent_name || "Unknown opponent";
  const stage = opponent.stage || "Unknown stage";
  const meta = OPPONENT_META[opponentName] ?? {
    pokemonCount: 0,
    specialty: "Unknown",
    fallback: stage.charAt(0).toUpperCase(),
  };
  const matchupScore =
    typeof opponent.matchup_score === "number" ? opponent.matchup_score : 0;
  const outcome = locked ? "Locked" : opponent.outcome || "Unknown";

  return (
    <article className={`opponent-card ${locked ? "locked" : ""}`}>
      <div className="opponent-trainer-row">
        <LocalSprite
          alt={`${opponentName} sprite`}
          className="trainer-sprite opponent-trainer-sprite"
          fallback={meta.fallback}
          src={getTrainerSprite(opponentName)}
        />
        <div>
          <strong>{opponentName}</strong>
          <span className="muted">{stage}</span>
          <span>{meta.specialty} specialist</span>
        </div>
      </div>

      <div className="opponent-card-main">
        <div>
          <span className="muted">Party</span>
          <PokeballIndicators count={meta.pokemonCount} label={`${meta.pokemonCount} Pokemon`} />
        </div>
        <div className="opponent-score">
          <strong>{matchupScore}/100</strong>
          <span className={outcomeClass}>{outcome}</span>
        </div>
      </div>

      {opponent.badge_name ? (
        <div className="badge-result">
          <LocalSprite
            alt={`${opponent.badge_name} sprite`}
            className="mini-badge-sprite"
            fallback="BD"
            src={BADGE_IMAGE_PATHS[opponent.badge_name]}
          />
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

function PokeballIndicators({ count, label }: { count: number; label: string }) {
  return (
    <div className="pokeball-row compact" aria-label={label}>
      {Array.from({ length: count }, (_, index) => (
        <span className="pokeball-dot" key={index} aria-hidden="true" />
      ))}
    </div>
  );
}
