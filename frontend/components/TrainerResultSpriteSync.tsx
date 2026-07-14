"use client";

import { useEffect } from "react";
import { getPlayerTrainerSprite } from "@/lib/imagePaths";
import type { TrainerProfile } from "@/types/pokemon";

const TRAINER_KEYS: Record<string, TrainerProfile["sprite"]> = {
  chaz: "chaz",
  laga: "laga",
  kevin: "kevin",
  gj: "gj",
};

export function TrainerResultSpriteSync() {
  useEffect(() => {
    function syncTrainerSprite() {
      const resultsScreen = document.querySelector<HTMLElement>(".end-results-screen");
      const cardTop = document.querySelector<HTMLElement>(".results-trainer-card__top");
      const playerName = resultsScreen?.querySelector<HTMLElement>(".stage-hero p:last-child")?.textContent?.trim();

      if (!cardTop || !playerName) {
        return;
      }

      const trainerKey = TRAINER_KEYS[playerName.toLowerCase()];
      if (!trainerKey) {
        return;
      }

      let portrait = cardTop.querySelector<HTMLImageElement>("[data-player-trainer-portrait]");
      if (!portrait) {
        portrait = document.createElement("img");
        portrait.dataset.playerTrainerPortrait = "true";
        portrait.style.width = "110px";
        portrait.style.height = "150px";
        portrait.style.objectFit = "contain";
        portrait.style.imageRendering = "pixelated";
        portrait.style.display = "block";
        portrait.style.margin = "14px auto 0";
        cardTop.appendChild(portrait);
      }

      portrait.alt = playerName;
      portrait.src = getPlayerTrainerSprite(trainerKey);
    }

    syncTrainerSprite();
    const observer = new MutationObserver(syncTrainerSprite);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return null;
}
