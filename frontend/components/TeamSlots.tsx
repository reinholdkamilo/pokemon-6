import type { Pokemon } from "@/types/pokemon";

type TeamSlotsProps = {
  pokemon: Pokemon[];
  onRemovePokemon: (pokemonId: number) => void;
};

const TEAM_SIZE = 6;

export function TeamSlots({ pokemon, onRemovePokemon }: TeamSlotsProps) {
  const slots = Array.from({ length: TEAM_SIZE }, (_, index) => pokemon[index]);

  return (
    <section className="panel" aria-label="Team slots">
      <h2>Team Slots</h2>
      <div className="team-grid">
        {slots.map((selectedPokemon, index) => (
          <div
            className={`team-slot ${selectedPokemon ? "filled" : ""}`}
            key={selectedPokemon?.id ?? `empty-${index}`}
          >
            {selectedPokemon ? (
              <div className="slot-header">
                <div>
                  <h3>{selectedPokemon.name}</h3>
                  <p className="slot-meta">
                    {[selectedPokemon.primary_type, selectedPokemon.secondary_type]
                      .filter(Boolean)
                      .join(" / ")}
                  </p>
                  <p className="slot-meta">BST {selectedPokemon.base_stat_total}</p>
                </div>
                <button
                  className="remove-button"
                  type="button"
                  onClick={() => onRemovePokemon(selectedPokemon.id)}
                  aria-label={`Remove ${selectedPokemon.name}`}
                >
                  X
                </button>
              </div>
            ) : (
              <>
                <h3>Slot {index + 1}</h3>
                <p className="slot-meta">Empty</p>
              </>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
