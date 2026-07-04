# Pokémon 6 Game Rules

## Core Concept

Players must build a team of six Pokémon from Generation 1 by revealing random
team cards.

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
2. The player receives Pokémon through the card reveal screen.
3. No duplicate Pokémon are allowed.
4. The player may enter an optional Trainer Name before submitting the team.
5. The player must select exactly six Pokémon before submitting the team.
6. A balanced team should avoid repeated primary types.
7. The team must have strong coverage against gym leaders, Elite Four members, and the Champion.
8. The player earns one badge for each Gym Leader beaten.
9. The Elite Four is locked until all 8 gym badges are earned.
10. The Champion is locked until all Elite Four members are beaten.
11. The result is either Win or Lose.
12. The game must explain why the team won or lost.

## Card Selection

1. The player starts from the title screen and presses CATCH EM ALL.
2. The player sees six unrevealed team cards.
3. Tapping an unrevealed card starts a card reveal animation.
4. The card cycles through available Pokémon names and types.
5. The reveal stops after a short delay on one random Pokémon.
6. The revealed Pokémon fills that card's team slot.
7. The player can tap any revealed card to re-spin that same card slot.
8. Re-spins are currently unlimited.
9. Re-spinning replaces the Pokémon in that card slot.
10. Already selected Pokémon in the other five card slots are excluded from
    future card reveals and re-spins.
11. The player can submit once all six cards are revealed.
12. Submitting the team sends the six selected Pokémon to the scoring endpoint.
13. The player can reset the run and return to the title screen before submitting.

## Staged Progression

After the team is submitted, the game stores the score response and shows the
journey one stage at a time instead of revealing every result at once.

1. Team Selection: the player reveals or re-spins six cards and submits the
   team with I CHOOSE YOU.
2. Gym Leaders: the player sees only the 8 Kanto Gym Leader cards in order.
   Cleared leaders show earned badges, failed leaders show the stopping point,
   and future leaders are marked NOT REACHED.
3. Elite Four Unlock: if the score response has all 8 badges earned and
   `elite_four_unlocked` is true, the player can press CHALLENGE ELITE FOUR.
   Otherwise the player can only view final results.
4. Elite Four: the player sees Lorelei, Bruno, Agatha, and Lance in order.
   Cleared members, failed members, and not reached members are shown from the
   existing opponent breakdown.
5. Champion Challenge: if all Elite Four members are beaten, the player can
   press CHALLENGE CHAMPION and see a head-to-head screen against Champion Gary.
6. End Results: the final screen shows the player name, final team, Gym Leader
   results, Elite Four results, and Champion Gary. Opponents the player did not
   reach are greyed out and marked NOT REACHED rather than given invented
   results.

The TRY AGAIN button on the End Results screen clears selected Pokémon, score
results, and revealed cards, then returns the player to the Pokémon selection
screen rather than the title screen.

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

If the team beats a Gym Leader, that leader's badge is added to
`badges_earned`. If the team earns fewer than 8 badges, `elite_four_unlocked`
is false and the Elite Four and Champion are not marked as beaten.

## Elite Four

After all 8 badges are earned and the player chooses to continue, the team can
challenge the Elite Four:

1. Lorelei
2. Bruno
3. Agatha
4. Lance

The team must beat all four Elite Four members before Champion Gary can be
marked as beaten.

## Champion

Champion Gary is the final opponent. Gary uses a mixed team profile, so the
scoring rewards teams with strong stats, broad type coverage, and balanced type
selection. The Champion screen is only shown after all Elite Four members are
beaten and the player chooses to challenge Gary.

## Result Scoring

The total score stays out of 100.

- 95 to 100 and Champion beaten: `Win - Undefeated Champion`
- 85 to 94 and Elite Four beaten but Champion not beaten: `Lose - Beat Gym Leaders and Elite Four, but lost to Champion Gary`
- 75 to 84 and all 8 badges earned but Elite Four not beaten: `Lose - Beat Gym Leaders, but lost during the Elite Four`
- Below 75 or fewer than 8 badges earned: `Lose - Did not beat all Gym Leaders`

The score response includes the selected Pokémon, score breakdown, gym score,
Elite Four score, Champion score, badges earned, badge requirement, Elite Four
unlock state, path result, opponent breakdown, explanation, and warnings.
