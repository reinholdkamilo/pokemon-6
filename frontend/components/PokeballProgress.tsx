"use client";

type PokeballProgressProps = {
  count: number;
  total?: number;
  label?: string;
};

export function PokeballProgress({
  count,
  total = 6,
  label = "Selected Pokemon",
}: PokeballProgressProps) {
  return (
    <div className="team-progress-pokeballs" aria-label={`${label}: ${count} of ${total}`}>
      {Array.from({ length: total }, (_, index) => (
        <span
          className={`team-progress-pokeball${index < count ? " filled" : ""}`}
          key={index}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}
