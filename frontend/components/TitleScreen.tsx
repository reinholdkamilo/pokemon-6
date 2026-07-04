"use client";

type TitleScreenProps = {
  onStart: () => void;
};

const CARD_ROTATIONS = [-18, -10, -3, 5, 12, 20];

export function TitleScreen({ onStart }: TitleScreenProps) {
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
        <button className="catch-button" type="button" onClick={onStart}>
          CATCH EM ALL
        </button>
      </section>
    </main>
  );
}
