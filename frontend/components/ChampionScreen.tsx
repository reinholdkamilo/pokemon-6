"use client";

import { LocalSprite } from "@/components/LocalSprite";
import { TRAINER_IMAGE_PATHS } from "@/lib/imagePaths";
import {
  CHAMPION,
  didBeatOpponent,
  findBreakdown,
  formatBattleOutcome,
  getBattleStatus,
} from "@/lib/progression";
import type { Pokemon, TeamScoreResult } from "@/types/pokemon";

type ChampionScreenProps = {
  playerName: string;
  result: TeamScoreResult;
  selectedPokemon: Pokemon[];
  onViewResults: () => void;
};

export function ChampionScreen({
  playerName,
  result,
  selectedPokemon,
  onViewResults,
}: ChampionScreenProps) {
  const championBreakdown = findBreakdown(
    result.opponent_breakdown?.champion,
    CHAMPION.name,
  );
  const championStatus = getBattleStatus(championBreakdown, Boolean(championBreakdown));
  const championBeaten = didBeatOpponent(championBreakdown);

  return (
    <main className="game-shell stage-shell">
      <section className="stage-screen champion-screen" aria-label="Champion battle">
        <div className="stage-hero">
          <p className="eyebrow">Final challenge</p>
          <h1>Champion Battle</h1>
          <p>{playerName} versus Champion Gary</p>
        </div>

        <div className="champion-versus">
          <article className="versus-card player-card">
            <div className="progression-card-top">
              <span>CHALLENGER</span>
              <strong>{playerName}</strong>
            </div>
            <h2>{playerName}</h2>
            <div className="champion-team-grid" aria-label={`${playerName} team`}>
              {selectedPokemon.map((pokemon) => (
                <div className="champion-team-member" key={pokemon.id}>
                  <LocalSprite
                    alt={`${pokemon.name} sprite`}
                    className="team-member-sprite"
                    fallback={pokemon.name.slice(0, 2).toUpperCase()}
                    src={pokemon.image}
                  />
                  <span>{pokemon.name}</span>
                </div>
              ))}
            </div>
          </article>

          <div className="versus-mark" aria-hidden="true">
            VS
          </div>

          <article className={`versus-card champion-card ${championStatus}`}>
            <div className="progression-card-top">
              <span>{CHAMPION.stage}</span>
              <strong>{formatBattleOutcome(championStatus, championBreakdown)}</strong>
            </div>
            <LocalSprite
              alt="Champion Gary sprite"
              className="trainer-sprite champion-trainer-sprite"
              fallback={CHAMPION.fallback}
              src={TRAINER_IMAGE_PATHS[CHAMPION.name]}
            />
            <h2>Champion Gary</h2>
            <p>{CHAMPION.specialty} team</p>
            <div className="pokeball-row" aria-label="6 Pokemon">
              {Array.from({ length: CHAMPION.pokemonCount }, (_, index) => (
                <span className="pokeball-dot" key={index} aria-hidden="true" />
              ))}
            </div>
            {typeof championBreakdown?.matchup_score === "number" ? (
              <p className="stage-matchup">
                Matchup {championBreakdown.matchup_score}/100
              </p>
            ) : null}
          </article>
        </div>

        <button className="primary-action stage-action" type="button" onClick={onViewResults}>
          {championBeaten ? "VIEW CHAMPION RESULTS" : "VIEW FINAL RESULTS"}
        </button>
      </section>
    </main>
  );
}
