"use client";

import { useEffect } from "react";

const MATCHUP_TITLE = "Player Card VS Opponent Card";

export function ArcadeBattleScreenPolish() {
  useEffect(() => {
    function polishArcadeScreen() {
      const heroes = Array.from(document.querySelectorAll<HTMLElement>(".stage-hero"));

      for (const hero of heroes) {
        const title = hero.querySelector("h1");
        if (title?.textContent?.trim() !== MATCHUP_TITLE) continue;

        const eyebrow = hero.querySelector(".eyebrow");
        const roundMatch = eyebrow?.textContent?.match(/Arcade Battle\s+(\d+)/i);
        const roundNumber = roundMatch?.[1] ?? "1";

        hero.classList.add("arcade-round-heading");
        hero.replaceChildren();

        const roundTitle = document.createElement("h1");
        roundTitle.textContent = `Round ${roundNumber}`;
        hero.appendChild(roundTitle);

        const matchupGrid = hero.nextElementSibling;
        if (!(matchupGrid instanceof HTMLElement)) continue;

        matchupGrid.classList.add("arcade-matchup-grid");
        matchupGrid.removeAttribute("style");

        const cards = matchupGrid.querySelectorAll<HTMLElement>(".progression-card");
        const playerCard = cards[0];
        const opponentCard = cards[1];
        if (!playerCard || !opponentCard) continue;

        playerCard.classList.add("arcade-player-battle-card");
        opponentCard.classList.add("arcade-opponent-battle-card");

        const playerStamp = playerCard.querySelector<HTMLElement>(".result-stamp");
        const opponentStamp = opponentCard.querySelector<HTMLElement>(".result-stamp");

        if (playerStamp?.textContent?.trim().toUpperCase() === "WIPED OUT") {
          playerStamp.remove();
          if (opponentStamp) opponentStamp.textContent = "WIPED OUT";
          opponentCard.classList.remove("cleared");
          opponentCard.classList.add("failed");
        } else if (playerStamp) {
          playerStamp.remove();
        }
      }
    }

    polishArcadeScreen();
    const observer = new MutationObserver(polishArcadeScreen);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
