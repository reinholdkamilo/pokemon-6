"use client";

import { usePathname } from "next/navigation";

type GameTopBarProps = {
  modeLabel: "Battle Mode" | "Adventure Mode" | "Arcade Mode";
  onMainMenu: () => void;
};

export function GameTopBar({ modeLabel, onMainMenu }: GameTopBarProps) {
  const pathname = usePathname();
  const displayedModeLabel = pathname.startsWith("/arcade") ? "Arcade Mode" : modeLabel;

  return (
    <div className="game-top-bar">
      <p className="eyebrow">{displayedModeLabel}</p>
      <button className="main-menu-button" type="button" onClick={onMainMenu}>
        Main Menu
      </button>
    </div>
  );
}
