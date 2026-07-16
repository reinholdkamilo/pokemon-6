import type { Pokemon } from "@/types/pokemon";

const SHINY_ROLL_CHANCE = 1 / 64;

export function getPokemonSpritePath(pokemon: Pick<Pokemon, "id" | "isShiny">) {
  return `/images/${pokemon.isShiny ? "pokemon-shiny" : "pokemon"}/${pokemon.id}.png`;
}

export function withPokemonSpriteImage(pokemon: Pokemon): Pokemon {
  return {
    ...pokemon,
    image: getPokemonSpritePath(pokemon),
  };
}

export function rollPokemonShiny(pokemon: Pokemon, random = Math.random): Pokemon {
  const isShiny = random() < SHINY_ROLL_CHANCE;

  return withPokemonSpriteImage({
    ...pokemon,
    isShiny,
  });
}

export function evolvePokemonSprite(fromPokemon: Pokemon, toPokemon: Pokemon): Pokemon {
  return withPokemonSpriteImage({
    ...toPokemon,
    isShiny: fromPokemon.isShiny,
  });
}
