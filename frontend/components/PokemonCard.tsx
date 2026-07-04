import type { Pokemon } from "@/types/pokemon";

type PokemonCardProps = {
  pokemon: Pokemon;
};

export function PokemonCard({ pokemon }: PokemonCardProps) {
  return (
    <article className="pokemon-card">
      <h3>{pokemon.name}</h3>
      <p className="pokemon-types">
        {[pokemon.primary_type, pokemon.secondary_type].filter(Boolean).join(" / ")}
      </p>
      <div className="stat-list" aria-label={`${pokemon.name} stats`}>
        <Stat label="HP" value={pokemon.hp} />
        <Stat label="Attack" value={pokemon.attack} />
        <Stat label="Defense" value={pokemon.defense} />
        <Stat label="Sp. Attack" value={pokemon.special_attack} />
        <Stat label="Sp. Defense" value={pokemon.special_defense} />
        <Stat label="Speed" value={pokemon.speed} />
        <Stat label="BST" value={pokemon.base_stat_total} />
      </div>
    </article>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
