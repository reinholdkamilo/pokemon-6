"use client";

import { useEffect } from "react";

const MATCHUP_TITLE = "Player Card VS Opponent Card";

export function ArcadeBattleScreenPolish() {
  useEffect(() => {
    let scheduled = false;

    function polishArcadeScreen() {
      scheduled = false;

      const hero = Array.from(document.querySelectorAll<HTMLElement>(".stage-hero")).find(
        (candidate) => candidate.querySelector("h1")?.textContent?.trim() === MATCHUP_TITLE,
      );

      if (!hero) return;

      const eyebrow = hero.querySelector(".eyebrow");
      const roundMatch = eyebrow?.textContent?.match(/Arcade Battle\s+(\d+)/i);
      hero.dataset.round = roundMatch?.[1] ?? "1";
      hero.classList.add("arcade-round-heading");

      const matchupGrid = hero.nextElementSibling;
      if (!(matchupGrid instanceof HTMLElement)) return;

      matchupGrid.classList.add("arcade-matchup-grid");
      matchupGrid.removeAttribute("style");

      const cards = matchupGrid.querySelectorAll<HTMLElement>(".progression-card");
      const playerCard = cards[0];
      const opponentCard = cards[1];
      if (!playerCard || !opponentCard) return;

      playerCard.classList.add("arcade-player-battle-card");
      opponentCard.classList.add("arcade-opponent-battle-card");

      const opponentStamp = opponentCard.querySelector<HTMLElement>(".result-stamp");
      opponentCard.classList.toggle(
        "arcade-opponent-wiped-out",
        opponentStamp?.textContent?.trim().toUpperCase() === "WIPED OUT",
      );
    }

    function schedulePolish() {
      if (scheduled || document.querySelector(".battle-sim-screen")) return;
      scheduled = true;
      window.requestAnimationFrame(polishArcadeScreen);
    }

    schedulePolish();
    const observer = new MutationObserver(schedulePolish);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      scheduled = false;
    };
  }, []);

  return null;
}
