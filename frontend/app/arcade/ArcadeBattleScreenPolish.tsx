"use client";

import { useEffect } from "react";

const MATCHUP_TITLE = "Player Card VS Opponent Card";

export function ArcadeBattleScreenPolish() {
  useEffect(() => {
    function polishMatchupScreen() {
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
        if (matchupGrid instanceof HTMLElement) {
          matchupGrid.classList.add("arcade-matchup-grid");
          matchupGrid.removeAttribute("style");
        }
      }
    }

    polishMatchupScreen();

    const observer = new MutationObserver(polishMatchupScreen);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return null;
}
