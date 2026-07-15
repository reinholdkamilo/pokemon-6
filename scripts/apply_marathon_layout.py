from pathlib import Path

PAGE = Path('frontend/app/marathon/page.tsx')
CSS = Path('frontend/app/marathon/marathon.css')
COMP = Path('frontend/components/MarathonTrainerCard.tsx')

page = PAGE.read_text()
css = CSS.read_text()

component = r'''"use client";

import { LocalSprite } from "@/components/LocalSprite";
import { BADGE_IMAGE_PATHS, getTrainerSprite } from "@/lib/imagePaths";
import type { ArcadeTrainer } from "@/lib/arcade";

type MarathonTrainerCardProps = {
  trainer: ArcadeTrainer;
  city: string;
  status?: "cleared" | "failed" | "current" | "locked" | "pending";
  badge?: string;
  pokemonNames?: string[];
  className?: string;
};

export function MarathonTrainerCard({
  trainer,
  city,
  status = "pending",
  badge,
  pokemonNames = [],
  className = "",
}: MarathonTrainerCardProps) {
  const role = trainer.type === "gym-leader"
    ? "Gym Leader"
    : trainer.type === "elite-four"
      ? "Elite Four"
      : trainer.type === "champion"
        ? "Champion"
        : "Trainer";
  const visibleNames = pokemonNames.length > 0 ? pokemonNames : trainer.pokemonTeam;

  return (
    <article className={`marathon-trainer-card marathon-trainer-card--${status} ${className}`.trim()}>
      <header className="marathon-trainer-card__top">
        <span>{role}</span>
        {badge && BADGE_IMAGE_PATHS[badge] ? (
          <LocalSprite
            alt={badge}
            className="marathon-trainer-card__badge"
            fallback={badge.slice(0, 2)}
            src={BADGE_IMAGE_PATHS[badge]}
          />
        ) : null}
      </header>

      <h3>{trainer.name}</h3>

      <div className="marathon-trainer-card__artwork">
        <LocalSprite
          alt={`${trainer.name} sprite`}
          className="marathon-trainer-card__sprite"
          fallback={trainer.fallback}
          src={trainer.sprite || getTrainerSprite(trainer.name)}
        />
      </div>

      <p className="marathon-trainer-card__summary">
        {trainer.pokemonCount} POKÉMON • {role.toUpperCase()}
      </p>
      <p className="marathon-trainer-card__city">{city}</p>

      {status === "cleared" ? <span className="marathon-trainer-card__stamp marathon-trainer-card__stamp--success">DEFEATED</span> : null}
      {status === "failed" ? <span className="marathon-trainer-card__stamp marathon-trainer-card__stamp--danger">WIPED OUT</span> : null}
      {status === "locked" ? <span className="marathon-trainer-card__locked">NOT REACHED</span> : null}

      {visibleNames.length > 0 && status !== "locked" ? (
        <div className="marathon-trainer-card__team" aria-label={`${trainer.name} team`}>
          {visibleNames.map((name, index) => <span key={`${name}-${index}`}>{name}</span>)}
        </div>
      ) : null}
    </article>
  );
}
'''
COMP.write_text(component)

# Imports and constants.
page = page.replace(
  'import { LocalSprite } from "@/components/LocalSprite";\n',
  'import { LocalSprite } from "@/components/LocalSprite";\nimport { MarathonTrainerCard } from "@/components/MarathonTrainerCard";\n',
  1,
)
page = page.replace('const TEAM_SIZE = 6;\n', 'const TEAM_SIZE = 6;\nconst TOTAL_MARATHON_BATTLES = 53;\n', 1)

# Replace battle screen block between GameTopBar and stage complete section.
start = page.index('          <GameTopBar modeLabel="Marathon Mode" onMainMenu={() => router.push("/")} />\n', page.index('if ((phase === "matchup"'))
end = page.index('          {phase === "result" &&', start)
new_top = r'''          <GameTopBar modeLabel="Marathon Mode" onMainMenu={() => router.push("/")} />

          <div className="marathon-battle-heading">
            <p className="eyebrow">Marathon Mode</p>
            <h1>{isPokemonLeague ? "Pokémon League" : `Stage ${currentStage?.number}`}</h1>
            <p>Round {displayedRound} / {TOTAL_MARATHON_BATTLES}</p>
          </div>

          <div className="marathon-badge-strip" aria-label="Kanto badge progress">
            {MARATHON_STAGES.map((stage) => {
              const earned = earnedBadges.includes(stage.badge);
              return (
                <LocalSprite
                  alt={stage.badge}
                  className={`marathon-badge-strip__badge ${earned ? "marathon-badge-strip__badge--earned" : ""}`}
                  fallback={stage.badge.slice(0, 2)}
                  key={stage.badge}
                  src={BADGE_IMAGE_PATHS[stage.badge]}
                />
              );
            })}
          </div>

          {phase === "matchup" ? (
            <div className="marathon-battle-actions">
              <button className="primary-action stage-action" type="button" onClick={battle}>
                {isGymLeaderBattle
                  ? `BATTLE ${currentOpponent.name.toUpperCase()}`
                  : isChampionBattle
                    ? "CHAMPION BATTLE"
                    : isEliteFourBattle
                      ? "ELITE FOUR BATTLE"
                      : "BATTLE"}
              </button>
              {currentOpponent.type === "regular" ? (
                <button className="secondary-action marathon-skip-trainer" type="button" onClick={skipTrainerBattle}>
                  SKIP TRAINER
                </button>
              ) : null}
            </div>
          ) : null}

'''
page = page[:start] + new_top + page[end:]

# Replace matchup cards and the duplicated action block after them.
match_start = page.index('          <div className="marathon-matchup-grid">', start)
match_end = page.index('        </section>', match_start)
old_section = page[match_start:match_end]
# Find action suffix in old section and replace entire region.
new_section = r'''          <div className="marathon-matchup-grid">
            <ProgressionCard
              className="player-character-card marathon-player-battle-card"
              detailItems={team.map((pokemon) => pokemon.name)}
              explicitResultStamp={null}
              meta={{ ...toPlayerCharacterMeta(character, 0), pokemonCount: 6, pokemonTeam: team.map((pokemon) => pokemon.name) }}
              spritePresentation="full-body"
              spriteSrc={getPlayerTrainerSprite(character.id)}
              status={playerStatus}
              suppressAutomaticStamp
            />
            <strong className="marathon-versus">VS</strong>
            <MarathonTrainerCard
              badge={currentOpponent.badge}
              city={currentStage?.city ?? "Pokémon League"}
              className="marathon-opponent-battle-card"
              pokemonNames={phase === "result" ? currentOpponentTeam.map((pokemon) => pokemon.name) : []}
              status={phase === "result" ? (currentOutcome === "Beat" ? "cleared" : "failed") : "pending"}
              trainer={currentOpponent}
            />
          </div>

          <section className="marathon-progress-panel" aria-label="Stage progress">
            <div className="marathon-stage-hud__dots">
              {Array.from({ length: REGULAR_WINS_PER_GYM }, (_, index) => (
                <span
                  className={index < trainerProgress ? "marathon-stage-hud__dot marathon-stage-hud__dot--complete" : "marathon-stage-hud__dot"}
                  key={index}
                />
              ))}
              <span className={`marathon-stage-hud__gym-marker ${isGymLeaderBattle ? "marathon-stage-hud__gym-marker--active" : ""}`}>GYM</span>
            </div>
            {!isPokemonLeague ? <p>{trainerProgress} / {REGULAR_WINS_PER_GYM} Trainers Defeated</p> : <p>{isChampionBattle ? "Champion Battle" : `Elite Four ${leaguePosition} / ${ELITE_FOUR.length}`}</p>}
          </section>

          {phase === "result" && currentOutcome === "Beat" ? (
            <button className="primary-action stage-action" type="button" onClick={nextBattle}>
              {currentOpponent.type === "gym-leader"
                ? gymIndex === MARATHON_STAGES.length - 1 ? "ENTER POKÉMON LEAGUE" : "NEXT STAGE"
                : currentOpponent.type === "champion" ? "COMPLETE MARATHON" : "NEXT BATTLE"}
            </button>
          ) : phase === "result" ? (
            <button className="primary-action stage-action" type="button" onClick={() => setPhase("results")}>RESULTS</button>
          ) : null}
'''
page = page[:match_start] + new_section + page[match_end:]

# Replace results component completely.
res_start = page.index('function ArcadeResults(')
res_end = page.index('\nfunction namesToPokemon', res_start)
results = r'''function ArcadeResults({ characterId, team, scoreResult, encounters, earnedBadges, totalWins, totalBattles, completed, onTryAgain, onMainMenu }: { characterId: PlayerCharacterId; team: Pokemon[]; scoreResult: TeamScoreResult | null; encounters: ArcadeEncounter[]; earnedBadges: string[]; totalWins: number; totalBattles: number; completed: boolean; onTryAgain: () => void; onMainMenu: () => void }) {
  const character = getPlayerCharacter(characterId);
  const power = Math.round(scoreResult?.total_score ?? scoreResult?.team_score ?? scoreResult?.score ?? averagePower(team));
  const majorResults = scoreResult ? getPredeterminedMajorResults(scoreResult) : [];
  const regularEncounters = encounters.filter((entry) => entry.opponent.type === "regular");
  const latestEncounterId = encounters.at(-1)?.id;

  return (
    <main className="game-shell stage-shell marathon-results-shell">
      <section className="stage-screen end-results-screen marathon-results-screen">
        <GameTopBar modeLabel="Marathon Mode" onMainMenu={onMainMenu} />
        <div className="stage-hero">
          <p className="eyebrow">Marathon Results</p>
          <h1>{completed ? "MARATHON CHAMPION" : "MARATHON RUN COMPLETE"}</h1>
          <p>{totalWins} wins from {totalBattles} battles</p>
        </div>

        <div className="marathon-badge-strip marathon-badge-strip--results" aria-label="Final badge progress">
          {MARATHON_STAGES.map((stage) => (
            <LocalSprite
              alt={stage.badge}
              className={`marathon-badge-strip__badge ${earnedBadges.includes(stage.badge) ? "marathon-badge-strip__badge--earned" : ""}`}
              fallback={stage.badge.slice(0, 2)}
              key={stage.badge}
              src={BADGE_IMAGE_PATHS[stage.badge]}
            />
          ))}
        </div>

        <article className="results-trainer-card">
          <div className="results-trainer-card__top"><span className="results-trainer-card__logo">POKEMON 6</span><strong className="results-trainer-card__player-name">{character.label}</strong></div>
          <div className="results-trainer-card__artwork"><LocalSprite alt={character.label} className="results-trainer-card__sprite" fallback={character.fallback} src={getPlayerTrainerSprite(character.id)} /></div>
          <div className="results-trainer-card__stats"><div><span>Player Power</span><strong>{power}</strong></div><div><span>Record</span><strong>{totalWins}/{totalBattles}</strong></div></div>
        </article>

        <section className="results-team-section"><h2>Final Pokémon Team</h2><div className="results-team-grid">{team.map((pokemon) => <article className="results-pokemon-summary-card" key={pokemon.id}><div className="results-pokemon-summary-card__sprite-wrap"><img alt={pokemon.name} className="results-pokemon-summary-card__sprite" src={pokemon.image} /></div><strong>{pokemon.name}</strong><span>BST {pokemon.base_stat_total}</span></article>)}</div></section>

        <div className="marathon-results-stages">
          {MARATHON_STAGES.map((stage, stageIndex) => {
            const stageRegulars = regularEncounters.slice(stageIndex * REGULAR_WINS_PER_GYM, (stageIndex + 1) * REGULAR_WINS_PER_GYM);
            const gymResult = encounters.find((entry) => entry.opponent.type === "gym-leader" && entry.opponent.name === stage.gymLeader);
            const gymOpponent = majorResults.find(({ opponent }) => opponent.type === "gym-leader" && opponent.name === stage.gymLeader)?.opponent ?? createMajorTrainer(GYM_LEADERS[stageIndex], "gym-leader");
            return (
              <section className="marathon-results-stage" key={stage.number}>
                <header><div><span>Stage {stage.number}</span><h2>{stage.city}</h2></div><LocalSprite alt={stage.badge} className={`marathon-results-stage__badge ${earnedBadges.includes(stage.badge) ? "is-earned" : ""}`} fallback={stage.badge.slice(0, 2)} src={BADGE_IMAGE_PATHS[stage.badge]} /></header>
                <div className="marathon-results-stage__grid">
                  {Array.from({ length: REGULAR_WINS_PER_GYM }, (_, slot) => {
                    const encounter = stageRegulars[slot];
                    if (!encounter) {
                      const placeholder: ArcadeTrainer = { id: `stage-${stage.number}-trainer-${slot + 1}`, name: `Trainer ${slot + 1}`, type: "regular", stage: stage.number, pokemonCount: getRegularTeamSize(stageIndex), pokemonTeam: [], fallback: "?", sprite: "" };
                      return <MarathonTrainerCard city={stage.city} key={placeholder.id} status="locked" trainer={placeholder} />;
                    }
                    return <MarathonTrainerCard city={stage.city} key={encounter.id} pokemonNames={encounter.opponentTeam.map((pokemon) => pokemon.name)} status={encounter.id === latestEncounterId ? "current" : encounter.outcome === "Beat" ? "cleared" : "failed"} trainer={encounter.opponent} />;
                  })}
                  <MarathonTrainerCard badge={stage.badge} city={stage.city} key={gymOpponent.id} pokemonNames={gymResult?.opponentTeam.map((pokemon) => pokemon.name)} status={!gymResult ? "locked" : gymResult.id === latestEncounterId ? "current" : gymResult.outcome === "Beat" ? "cleared" : "failed"} trainer={gymOpponent} />
                </div>
              </section>
            );
          })}

          <section className="marathon-results-stage marathon-results-stage--league">
            <header><div><span>Final Stage</span><h2>Pokémon League</h2></div></header>
            <div className="marathon-results-stage__grid marathon-results-stage__grid--league">
              {majorResults.filter(({ opponent }) => opponent.type === "elite-four" || opponent.type === "champion").map(({ opponent }) => {
                const encounter = encounters.find((entry) => entry.opponent.id === opponent.id);
                return <MarathonTrainerCard city="Pokémon League" key={opponent.id} pokemonNames={encounter?.opponentTeam.map((pokemon) => pokemon.name)} status={!encounter ? "locked" : encounter.id === latestEncounterId ? "current" : encounter.outcome === "Beat" ? "cleared" : "failed"} trainer={opponent} />;
              })}
            </div>
          </section>
        </div>

        <div className="trainer-card-actions"><button className="primary-action" type="button" onClick={onTryAgain}>TRY AGAIN</button><button className="secondary-action" type="button" onClick={onMainMenu}>MAIN MENU</button></div>
      </section>
    </main>
  );
}
'''
page = page[:res_start] + results + page[res_end:]
PAGE.write_text(page)

css += r'''

/* Marathon battle hierarchy and staged results */
.marathon-battle-heading { width: 100%; text-align: center; margin: 0 auto 10px; }
.marathon-battle-heading h1 { margin: 2px 0; font-size: clamp(2rem, 8vw, 4rem); line-height: .95; }
.marathon-battle-heading p:last-child { margin: 4px 0 0; font-weight: 1000; }
.marathon-badge-strip { width: min(100%, 720px); margin: 0 auto 14px; display: grid; grid-template-columns: repeat(8, minmax(0, 1fr)); gap: clamp(5px, 1.5vw, 12px); align-items: center; }
.marathon-badge-strip__badge { width: 100%; max-width: 54px; aspect-ratio: 1; margin: auto; object-fit: contain; filter: grayscale(1); opacity: .28; transform: scale(.86); }
.marathon-badge-strip__badge--earned { filter: none; opacity: 1; transform: scale(1); }
.marathon-progress-panel { width: min(100%, 880px); margin: 14px auto 0; padding: 12px; border: 2px solid rgba(23,37,84,.18); border-radius: 14px; background: rgba(255,255,255,.72); text-align: center; }
.marathon-progress-panel p { margin: 8px 0 0; font-weight: 1000; }
.marathon-matchup-grid > .marathon-player-battle-card,
.marathon-matchup-grid > .marathon-opponent-battle-card { min-height: clamp(360px, 48vw, 500px); height: 100%; }
.marathon-matchup-grid .marathon-player-battle-card .progression-sprite-area,
.marathon-opponent-battle-card .marathon-trainer-card__artwork { height: clamp(190px, 25vw, 280px); min-height: clamp(190px, 25vw, 280px); }

.marathon-trainer-card { position: relative; min-width: 0; width: 100%; padding: 12px; border: 3px solid #172554; border-radius: 18px; background: linear-gradient(160deg,#fff,#eaf2ff); box-shadow: 0 7px 0 rgba(23,37,84,.18); color: #172554; overflow: hidden; display: flex; flex-direction: column; }
.marathon-trainer-card__top { min-height: 40px; display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: .76rem; font-weight: 1000; letter-spacing: .08em; text-transform: uppercase; }
.marathon-trainer-card__badge { width: 40px; height: 40px; object-fit: contain; }
.marathon-trainer-card h3 { margin: 4px 0 8px; font-size: clamp(1rem, 3.5vw, 1.5rem); line-height: 1; text-align: center; text-transform: uppercase; }
.marathon-trainer-card__artwork { flex: 1; min-height: 180px; display: flex; align-items: flex-end; justify-content: center; overflow: hidden; }
.marathon-trainer-card__sprite { display: block; width: auto; height: auto; max-width: 96%; max-height: 96%; object-fit: contain; object-position: center bottom; image-rendering: pixelated; transform: none; clip-path: none; }
.marathon-trainer-card__summary { margin: 10px 0 2px; font-size: clamp(.65rem, 2vw, .82rem); font-weight: 1000; text-align: center; }
.marathon-trainer-card__city { margin: 0; text-align: center; font-weight: 900; opacity: .72; }
.marathon-trainer-card__team { margin-top: 8px; display: flex; flex-wrap: wrap; justify-content: center; gap: 4px; }
.marathon-trainer-card__team span { padding: 3px 6px; border-radius: 999px; background: rgba(23,37,84,.1); font-size: .62rem; font-weight: 800; }
.marathon-trainer-card__stamp { position: absolute; inset: 50% auto auto 50%; transform: translate(-50%,-50%) rotate(-11deg); padding: 5px 10px; border: 4px solid currentColor; border-radius: 8px; font-size: clamp(.9rem,3vw,1.3rem); font-weight: 1000; letter-spacing: .08em; z-index: 3; }
.marathon-trainer-card__stamp--success { color: #15803d; background: rgba(220,252,231,.92); }
.marathon-trainer-card__stamp--danger { color: #b91c1c; background: rgba(254,226,226,.92); }
.marathon-trainer-card--locked { filter: grayscale(1); opacity: .42; }
.marathon-trainer-card__locked { position: absolute; inset: 50% auto auto 50%; transform: translate(-50%,-50%) rotate(-8deg); padding: 5px 8px; border: 3px solid #475569; border-radius: 7px; background: rgba(241,245,249,.92); color: #334155; font-weight: 1000; white-space: nowrap; z-index: 3; }
.marathon-trainer-card--current { border-color: #d4a017; box-shadow: 0 0 0 4px rgba(250,204,21,.22),0 8px 22px rgba(202,138,4,.28); }

.marathon-results-shell,.marathon-results-screen { width: 100%; }
.marathon-badge-strip--results { margin-bottom: 22px; }
.marathon-results-stages { width: 100%; display: grid; gap: 24px; }
.marathon-results-stage { width: 100%; padding: clamp(12px,2.5vw,20px); border: 3px solid #172554; border-radius: 20px; background: rgba(255,255,255,.78); }
.marathon-results-stage > header { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
.marathon-results-stage > header span { font-size: .76rem; font-weight: 1000; letter-spacing: .1em; text-transform: uppercase; }
.marathon-results-stage > header h2 { margin: 2px 0 0; }
.marathon-results-stage__badge { width: 54px; height: 54px; object-fit: contain; filter: grayscale(1); opacity: .28; }
.marathon-results-stage__badge.is-earned { filter: none; opacity: 1; }
.marathon-results-stage__grid { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 12px; align-items: stretch; }
.marathon-results-stage__grid .marathon-trainer-card { min-height: 390px; }
.marathon-results-stage--league { border-color: #581c87; background: linear-gradient(145deg,rgba(250,245,255,.95),rgba(237,233,254,.92)); }
.marathon-results-stage__grid--league { grid-template-columns: repeat(3,minmax(0,1fr)); }

@media (max-width: 700px) {
  .marathon-battle-actions { order: initial; margin-bottom: 10px; }
  .marathon-matchup-grid { margin-top: 0; }
  .marathon-badge-strip { gap: 3px; }
  .marathon-badge-strip__badge { max-width: 38px; }
  .marathon-matchup-grid > .marathon-player-battle-card,
  .marathon-matchup-grid > .marathon-opponent-battle-card { min-height: clamp(330px,86vw,410px); }
  .marathon-matchup-grid .marathon-player-battle-card .progression-sprite-area,
  .marathon-opponent-battle-card .marathon-trainer-card__artwork { height: clamp(150px,38vw,190px); min-height: clamp(150px,38vw,190px); }
  .marathon-trainer-card { padding: 8px; border-radius: 14px; }
  .marathon-trainer-card__top { min-height: 30px; font-size: .58rem; }
  .marathon-trainer-card__badge { width: 30px; height: 30px; }
  .marathon-trainer-card h3 { font-size: clamp(.78rem,4vw,1rem); }
  .marathon-trainer-card__summary { font-size: .56rem; }
  .marathon-trainer-card__city { font-size: .68rem; }
  .marathon-trainer-card__team { display: none; }
  .marathon-results-stage__grid,.marathon-results-stage__grid--league { grid-template-columns: repeat(2,minmax(0,1fr)); gap: 8px; }
  .marathon-results-stage__grid .marathon-trainer-card { min-height: 315px; }
}

@media (max-width: 370px) {
  .marathon-results-stage__grid,.marathon-results-stage__grid--league { grid-template-columns: repeat(2,minmax(0,1fr)); gap: 6px; }
  .marathon-results-stage { padding: 8px; }
}
'''
CSS.write_text(css)
print('Marathon battle hierarchy, staged results, badges, and normalized trainer cards applied.')
