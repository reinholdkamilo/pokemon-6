"use client";

type TitleScreenProps = {
  onSelectArcadeMode: () => void;
  onSelectMarathonMode: () => void;
};

const CARD_ROTATIONS = [-18, -10, -3, 5, 12, 20];

export function TitleScreen({
  onSelectArcadeMode,
  onSelectMarathonMode,
}: TitleScreenProps) {
  return (
    <main className="title-screen">
      <section className="title-stage" aria-label="Pokemon 6 title screen">
        <h1 className="game-title">POKEMON 6</h1>
        <div className="title-card-fan" aria-hidden="true">
          {CARD_ROTATIONS.map((rotation, index) => (
            <img
              alt=""
              className="title-card-back"
              key={rotation}
              src="/images/card-back.png"
              style={{
                transform: `translateX(${(index - 2.5) * 18}px) rotate(${rotation}deg)`,
                zIndex: index,
              }}
            />
          ))}
        </div>
        <div className="mode-actions" aria-label="Choose game mode">
          <button
            className="catch-button"
            type="button"
            onClick={onSelectArcadeMode}
          >
            Arcade Mode
          </button>
          <button
            className="catch-button marathon-mode-button"
            type="button"
            onClick={onSelectMarathonMode}
          >
            Marathon Mode
          </button>
        </div>
      </section>
    </main>
  );
}
