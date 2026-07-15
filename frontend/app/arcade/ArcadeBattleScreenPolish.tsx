"use client";

import { useEffect } from "react";

const MATCHUP_TITLE = "Player Card VS Opponent Card";
const CHARACTER_TITLE = "Choose Your Character";

export function ArcadeBattleScreenPolish() {
  useEffect(() => {
    function polishArcadeScreens() {
      const heroes = Array.from(document.querySelectorAll<HTMLElement>(".stage-hero"));

      for (const hero of heroes) {
        const title = hero.querySelector("h1");
        const titleText = title?.textContent?.trim();

        if (titleText === CHARACTER_TITLE) {
          hero.closest(".stage-screen")?.classList.add("arcade-character-select-screen");
          const characterGrid = hero.nextElementSibling;
          if (characterGrid instanceof HTMLElement) {
            characterGrid.classList.add("arcade-character-grid");
          }
          continue;
        }

        if (titleText !== MATCHUP_TITLE) continue;

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

    polishArcadeScreens();

    const observer = new MutationObserver(polishArcadeScreens);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return null;
}
