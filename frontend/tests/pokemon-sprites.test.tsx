import { describe, expect, it } from "vitest";
import {
  evolvePokemonSprite,
  getPokemonSpritePath,
  rollPokemonShiny,
} from "@/lib/pokemonSprites";
import type { Pokemon } from "@/types/pokemon";

const bulbasaur: Pokemon = {
  id: 1,
  name: "Bulbasaur",
  generation: 1,
  primary_type: "Grass",
  secondary_type: "Poison",
  hp: 45,
  attack: 49,
  defense: 49,
  special_attack: 65,
  special_defense: 65,
  speed: 45,
  base_stat_total: 318,
  image: "/images/pokemon/1.png",
};

const ivysaur: Pokemon = {
  ...bulbasaur,
  id: 2,
  name: "Ivysaur",
  image: "/images/pokemon/2.png",
};

describe("Pokemon sprite image routing", () => {
  it("uses normal Gen 1 sprite paths by default", () => {
    expect(getPokemonSpritePath(bulbasaur)).toBe("/images/pokemon/1.png");
  });

  it("uses shiny Gen 1 sprite paths for shiny Pokemon", () => {
    expect(getPokemonSpritePath({ ...bulbasaur, isShiny: true })).toBe(
      "/images/pokemon-shiny/1.png",
    );
  });

  it("can deterministically roll shiny Pokemon", () => {
    expect(rollPokemonShiny(bulbasaur, () => 0).isShiny).toBe(true);
    expect(rollPokemonShiny(bulbasaur, () => 1).isShiny).toBe(false);
  });

  it("carries shiny status through evolution", () => {
    const evolved = evolvePokemonSprite(
      { ...bulbasaur, isShiny: true },
      ivysaur,
    );

    expect(evolved.isShiny).toBe(true);
    expect(evolved.image).toBe("/images/pokemon-shiny/2.png");
  });
});
