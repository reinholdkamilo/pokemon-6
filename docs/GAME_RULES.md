# Pokémon 6 Game Rules

## Core Concept

Players create a local Trainer Card, then build a team of six Pokémon from
Generation 1 by revealing random team cards.

The team must defeat:

1. The 8 gym leaders
2. The Elite Four
3. The Pokémon Champion

The aim is to go undefeated.

## MVP Challenge

Reveal six different Generation 1 Pokémon cards, then submit the team to the
scoring system.

## MVP Rules

1. Only Generation 1 Pokémon are allowed.
2. The player creates a Trainer Card before selecting a team.
3. The player receives Pokémon through the card reveal screen.
4. No duplicate Pokémon are allowed.
5. The player must select exactly six Pokémon before submitting the team.
6. A balanced team should avoid repeated primary types.
7. The team must have strong coverage against gym leaders, Elite Four members, and the Champion.
8. The player earns one badge for each Gym Leader beaten.
9. The Elite Four is locked until all 8 gym badges are earned.
10. The Champion is locked until all Elite Four members are beaten.
11. The result is either Win or Lose.
12. The game must explain why the team won or lost.

## Trainer Cards

After the title screen, the player creates a local Trainer Profile Card before
team selection. The MVP Trainer Profile Card records:

- Trainer name
- Date of birth
- Email address
- Hometown
- Player trainer sprite
- Badge count, starting at 0
- Pokémon count, starting at 0
- Known type: Mixed

The player chooses a hometown from the Kanto town list and can switch between
local male and female trainer placeholder sprites. The trainer profile is saved
through the backend to `backend/app/data/pokemon_trainers.json`, which is local
development data and ignored by Git.

Battle Trainer Cards are separate public battle cards used during the Champion
challenge and final results. They can show trainer sprite, trainer name,
hometown, Pokémon count, known type, and badge count. They do not display email
addresses or dates of birth.

## Card Selection

1. The player starts from the title screen and presses CATCH EM ALL.
2. The player creates and saves a Trainer Card.
3. The player sees six unrevealed team cards.
4. Tapping an unrevealed card starts a card reveal animation.
5. The card cycles through available Pokémon names and types.
6. The reveal stops after a short delay on one random Pokémon.
7. The revealed Pokémon fills that card's team slot.
8. The player can tap any revealed card to re-spin that same card slot.
9. Re-spins are currently unlimited.
10. Re-spinning replaces the Pokémon in that card slot.
11. Already selected Pokémon in the other five card slots are excluded from
    future card reveals and re-spins.
12. The player can submit once all six cards are revealed.
13. Submitting the team sends the six selected Pokémon to the scoring endpoint.
14. The player can reset the run and return to the title screen before submitting.

## Staged Progression

After the team is submitted, the game stores the score response and shows the
journey one stage at a time instead of revealing every result at once.

1. Team Selection: the player reveals or re-spins six cards and submits the
   team with I CHOOSE YOU.
2. Gym Leaders: the player sees only the 8 Kanto Gym Leader cards in order.
   The BATTLE button sits above the cards. Before BATTLE is pressed, cards show
   trainer details with no result stamp. After BATTLE, reached wins show a
   bright green DEFEATED stamp, the stopping loss shows a bright red WIPED OUT
   stamp, and future leaders are greyed out.
3. Elite Four Unlock: if the score response has all 8 badges earned and
   `elite_four_unlocked` is true, the player can press CHALLENGE ELITE FOUR.
   Otherwise the player can only view final results.
4. Elite Four: the player sees only Lorelei, Bruno, Agatha, and Lance. The
   BATTLE button reveals deterministic results. Wins show DEFEATED, losses show
   WIPED OUT, and unreached members are greyed out.
5. Champion Challenge: if all Elite Four members are beaten, the player can
   press CHALLENGE CHAMPION and see a head-to-head screen with the player's
   Battle Trainer Card against Champion Gary's Battle Trainer Card. The BATTLE
   button reveals Gary's result.
6. End Results: the final screen shows the player Battle Trainer Card, final
   team, Gym Leader results, Elite Four results, and Champion Gary. Opponents
   the player did not reach are greyed out rather than given invented results.

The TRY AGAIN button on the End Results screen clears selected Pokémon, score
results, and revealed cards, then returns the player to the Pokémon selection
screen rather than the title screen.

Trainer cards do not show matchup scores, recommended counter types, or internal
scoring details. The backend can still return those fields for explanations and
future debugging.

## Scoring Areas

- Base stat strength
- Type balance
- Journey coverage against Gym Leaders, Elite Four, and Champion Gary
- Weakness management
- Low repeated type overlap
- Matchup spread across the full journey

The scoring system is not a full battle simulator. It uses simple, readable
matchup scoring based on team stats, team types, recommended counter types, and
how consistently the team matches up across the journey.

## Gym Leaders and Badge Rewards

The team is scored against the Generation 1 Kanto Gym Leaders in order:

1. Brock - Boulder Badge
2. Misty - Cascade Badge
3. Lt. Surge - Thunder Badge
4. Erika - Rainbow Badge
5. Koga - Soul Badge
6. Sabrina - Marsh Badge
7. Blaine - Volcano Badge
8. Giovanni - Earth Badge

Gym Leader battles are evaluated sequentially. If the team beats a Gym Leader,
that leader's badge is added to `badges_earned` and the team moves to the next
Gym Leader. If the team loses to any Gym Leader, Gym progression stops there.
Later Gym Leaders are treated as not reached, do not award badges, and are not
invented as wins even if their individual matchup would have been favorable.

If the team earns fewer than 8 badges, `elite_four_unlocked` is false and the
Elite Four and Champion are not marked as beaten. All 8 Gym Badges are required
before the Elite Four can be challenged.

Gym Leaders can also be beaten by lucky progression when the matchup is close
and the team has strong overall base stats. This means a strong team can
sometimes actually beat a Gym Leader despite imperfect counter coverage:

- Matchup score 48 or higher: normal win.
- Matchup score 42 to 47 and average team base stat total 420 to 459: 20%
  lucky win chance.
- Matchup score 42 to 47 and average team base stat total 460 to 499: 35%
  lucky win chance.
- Matchup score 42 to 47 and average team base stat total 500 or higher: 50%
  lucky win chance.
- If the lucky roll succeeds: lucky win, `lucky_win` is true, and the badge is
  earned.
- If the lucky roll fails: loss, `lucky_win` is false, no badge is earned, and
  later Gym Leaders are not reached.
- Matchup score below 42 or average base stat total below 420: no lucky win
  chance.

Lucky Gym Leader wins earn badges and can unlock the Elite Four if all 8 badges
are earned. Opponent breakdowns include `win_type`, `lucky_win`,
`lucky_win_chance`, and `random_roll` so lucky wins are visible in the API data.
Lucky progression never grants automatic advancement after a loss.

## Elite Four

After all 8 badges are earned and the player chooses to continue, the team can
challenge the Elite Four:

1. Lorelei
2. Bruno
3. Agatha
4. Lance

The team must beat all four Elite Four members before Champion Gary can be
marked as beaten.

Elite Four results are deterministic. Lucky progression never applies to Elite
Four members, and they cannot be beaten by randomness.

## Champion

Champion Gary is the final opponent. Gary uses a mixed team profile, so the
scoring rewards teams with strong stats, broad type coverage, and balanced type
selection. The Champion screen is only shown after all Elite Four members are
beaten and the player chooses to challenge Gary.

Champion Gary's result is deterministic. Lucky progression never applies to the
Champion, and Gary cannot be beaten by randomness.

## Result Scoring

The total score stays out of 100.

- 95 to 100 and Champion beaten: `Win - Undefeated Champion`
- 85 to 94 and Elite Four beaten but Champion not beaten: `Lose - Beat Gym Leaders and Elite Four, but lost to Champion Gary`
- 75 to 84 and all 8 badges earned but Elite Four not beaten: `Lose - Beat Gym Leaders, but lost during the Elite Four`
- Below 75 or fewer than 8 badges earned: `Lose - Did not beat all Gym Leaders`

The score response includes the selected Pokémon, score breakdown, gym score,
Elite Four score, Champion score, badges earned, badge requirement, Elite Four
unlock state, path result, opponent breakdown, explanation, and warnings.
