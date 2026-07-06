"use client";

type GameTopBarProps = {
  modeLabel: "Battle Mode" | "Adventure Mode";
  onMainMenu: () => void;
};

export function GameTopBar({ modeLabel, onMainMenu }: GameTopBarProps) {
  return (
    <div className="game-top-bar">
      <p className="eyebrow">{modeLabel}</p>
      <button className="main-menu-button" type="button" onClick={onMainMenu}>
        Main Menu
      </button>
    </div>
  );
}
