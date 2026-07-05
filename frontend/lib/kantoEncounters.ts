import type { Pokemon } from "@/types/pokemon";

export const PROFESSOR_OAK_LAB = "Professor Oak's Laboratory";

export const KANTO_LOCATIONS = [
  "Pallet Town",
  PROFESSOR_OAK_LAB,
  "Route 1",
  "Viridian City",
  "Viridian City Poke Mart",
  "Route 22",
  "Route 2",
  "Viridian Forest",
  "Pewter City",
  "Pewter Museum of Science",
  "Pewter City Museum Back Room",
  "Route 3",
  "Mt. Moon",
  "Mt. Moon Fossil Area",
  "Route 4",
  "Cerulean City",
  "Cerulean Gym",
  "Route 24",
  "Nugget Bridge",
  "Route 25",
  "Bill's Cottage",
  "Route 5",
  "Underground Path Route 5-6",
  "Route 6",
  "Vermilion City",
  "Vermilion Harbor",
  "S.S. Anne",
  "Vermilion Gym",
  "Route 11",
  "Diglett's Cave",
  "Route 9",
  "Route 10",
  "Rock Tunnel",
  "Lavender Town",
  "Pokemon Tower",
  "Route 8",
  "Underground Path Route 7-8",
  "Route 7",
  "Celadon City",
  "Celadon Gym",
  "Celadon Department Store",
  "Celadon Mansion",
  "Rocket Game Corner",
  "Rocket Hideout",
  "Route 16",
  "Route 17",
  "Cycling Road",
  "Route 18",
  "Route 12",
  "Silence Bridge",
  "Route 13",
  "Route 14",
  "Route 15",
  "Fuchsia City",
  "Fuchsia Gym",
  "Safari Zone",
  "Safari Zone Entrance Area",
  "Safari Zone Area 1",
  "Safari Zone Area 2",
  "Safari Zone Area 3",
  "Safari Zone Secret House",
  "Safari Zone Warden's House",
  "Saffron City",
  "Fighting Dojo",
  "Silph Co.",
  "Saffron Gym",
  "Route 19",
  "Route 20",
  "Seafoam Islands",
  "Cinnabar Island",
  "Pokemon Mansion",
  "Cinnabar Island Pokemon Lab",
  "Cinnabar Island Fossil Restoration Room",
  "Cinnabar Gym",
  "Route 21",
  "Viridian Gym",
  "Route 23",
  "Victory Road",
  "Indigo Plateau",
  "Pokemon League",
  "Lorelei's Elite Four Chamber",
  "Bruno's Elite Four Chamber",
  "Agatha's Elite Four Chamber",
  "Lance's Elite Four Chamber",
  "Champion's Room",
  "Hall of Fame",
  "Cerulean Cave",
  "Power Plant",
  "Trade Encounter Locations",
  "Gift Pokemon Locations",
  "Fossil Pokemon Revival Locations",
  "Legendary Bird Encounter Locations",
  "Mewtwo Encounter Location",
  "Mew Special Event Location",
  "Shiny Encounter Locations",
  "Shiny Legendary Encounter Locations",
] as const;

export const LEGENDARY_SPIN_LOCATIONS = [
  "Legendary Bird Encounter Locations",
  "Mewtwo Encounter Location",
  "Mew Special Event Location",
  "Shiny Legendary Encounter Locations",
  "Power Plant",
  "Seafoam Islands",
  "Victory Road",
  "Cerulean Cave",
] as const;

const EVOLUTION_FAMILIES = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
  [10, 11, 12],
  [13, 14, 15],
  [16, 17, 18],
  [19, 20],
  [21, 22],
  [23, 24],
  [25, 26],
  [27, 28],
  [29, 30, 31],
  [32, 33, 34],
  [35, 36],
  [37, 38],
  [39, 40],
  [41, 42],
  [43, 44, 45],
  [46, 47],
  [48, 49],
  [50, 51],
  [52, 53],
  [54, 55],
  [56, 57],
  [58, 59],
  [60, 61, 62],
  [63, 64, 65],
  [66, 67, 68],
  [69, 70, 71],
  [72, 73],
  [74, 75, 76],
  [77, 78],
  [79, 80],
  [81, 82],
  [83],
  [84, 85],
  [86, 87],
  [88, 89],
  [90, 91],
  [92, 93, 94],
  [95],
  [96, 97],
  [98, 99],
  [100, 101],
  [102, 103],
  [104, 105],
  [106],
  [107],
  [108],
  [109, 110],
  [111, 112],
  [113],
  [114],
  [115],
  [116, 117],
  [118, 119],
  [120, 121],
  [122],
  [123],
  [124],
  [125],
  [126],
  [127],
  [128],
  [129, 130],
  [131],
  [132],
  [133, 134, 135, 136],
  [137],
  [138, 139],
  [140, 141],
  [142],
  [143],
  [144],
  [145],
  [146],
  [147, 148, 149],
  [150],
  [151],
] as const;

const FAMILY_BY_POKEMON_ID = new Map<number, readonly number[]>(
  EVOLUTION_FAMILIES.flatMap((family) => family.map((id) => [id, family] as const)),
);

const FAMILY_KEY_BY_POKEMON_ID = new Map<number, number>(
  EVOLUTION_FAMILIES.flatMap((family) => family.map((id) => [id, family[0]] as const)),
);

// Encounter values are evolution-family ids. The full family becomes eligible at runtime.
export const KANTO_ENCOUNTER_FAMILIES: Record<string, number[]> = {
  "Pallet Town": [16, 19, 21, 60, 129],
  [PROFESSOR_OAK_LAB]: [1, 4, 7],
  "Route 1": [16, 19, 21],
  "Viridian City": [19, 25, 60, 129],
  "Viridian City Poke Mart": [25, 35, 39],
  "Route 22": [19, 21, 29, 32, 56],
  "Route 2": [10, 13, 16, 19],
  "Viridian Forest": [10, 13, 25],
  "Pewter City": [74, 95, 138, 140],
  "Pewter Museum of Science": [138, 140, 142],
  "Pewter City Museum Back Room": [35, 137, 142],
  "Route 3": [16, 21, 39, 56],
  "Mt. Moon": [35, 41, 46, 74],
  "Mt. Moon Fossil Area": [138, 140, 142],
  "Route 4": [19, 21, 23, 27, 129],
  "Cerulean City": [54, 60, 98, 118, 129],
  "Cerulean Gym": [54, 60, 120, 129],
  "Route 24": [10, 13, 16, 43, 63],
  "Nugget Bridge": [16, 25, 43, 63],
  "Route 25": [10, 13, 16, 43, 69],
  "Bill's Cottage": [133, 137],
  "Route 5": [16, 39, 43, 52],
  "Underground Path Route 5-6": [19, 23, 52, 83],
  "Route 6": [16, 39, 43, 52, 129],
  "Vermilion City": [54, 60, 72, 98, 129],
  "Vermilion Harbor": [72, 90, 98, 116, 129],
  "S.S. Anne": [52, 54, 72, 83, 116],
  "Vermilion Gym": [25, 81, 100, 125],
  "Route 11": [21, 23, 96, 129],
  "Diglett's Cave": [50],
  "Route 9": [19, 21, 23, 27, 100],
  "Route 10": [21, 23, 81, 100, 129],
  "Rock Tunnel": [41, 66, 74, 95],
  "Lavender Town": [92, 96, 104],
  "Pokemon Tower": [92, 104],
  "Route 8": [16, 23, 37, 39, 52, 56],
  "Underground Path Route 7-8": [19, 52, 58, 83],
  "Route 7": [16, 37, 39, 52, 63],
  "Celadon City": [43, 52, 54, 60, 129],
  "Celadon Gym": [43, 46, 69, 114],
  "Celadon Department Store": [25, 35, 37, 137],
  "Celadon Mansion": [133],
  "Rocket Game Corner": [23, 52, 63, 109, 137],
  "Rocket Hideout": [23, 41, 52, 88, 109],
  "Route 16": [19, 21, 84, 143],
  "Route 17": [19, 21, 77, 84],
  "Cycling Road": [19, 21, 77, 88, 109],
  "Route 18": [19, 21, 77, 84],
  "Route 12": [16, 43, 72, 79, 98, 129, 143],
  "Silence Bridge": [72, 79, 98, 118, 129],
  "Route 13": [16, 21, 43, 48, 132],
  "Route 14": [16, 21, 43, 48, 132],
  "Route 15": [16, 21, 43, 48, 132],
  "Fuchsia City": [54, 60, 98, 118, 129],
  "Fuchsia Gym": [41, 48, 88, 109],
  "Safari Zone": [29, 32, 46, 48, 84, 102, 111, 113, 115, 123, 127, 128, 147],
  "Safari Zone Entrance Area": [29, 32, 46, 48, 102, 111, 113],
  "Safari Zone Area 1": [84, 102, 111, 123, 127],
  "Safari Zone Area 2": [29, 32, 115, 128, 147],
  "Safari Zone Area 3": [46, 48, 102, 113, 127],
  "Safari Zone Secret House": [113, 115, 128],
  "Safari Zone Warden's House": [79, 111, 115],
  "Saffron City": [63, 96, 122],
  "Fighting Dojo": [56, 66, 106, 107],
  "Silph Co.": [25, 63, 66, 88, 109, 131],
  "Saffron Gym": [63, 96, 122],
  "Route 19": [72, 86, 90, 116, 118, 120, 129],
  "Route 20": [72, 86, 90, 116, 118, 120, 129],
  "Seafoam Islands": [54, 79, 86, 90, 98, 116, 120, 144],
  "Cinnabar Island": [72, 90, 98, 116, 118, 129],
  "Pokemon Mansion": [37, 58, 88, 109, 126, 132],
  "Cinnabar Island Pokemon Lab": [88, 109, 132, 137],
  "Cinnabar Island Fossil Restoration Room": [138, 140, 142],
  "Cinnabar Gym": [37, 58, 77, 126],
  "Route 21": [16, 19, 72, 90, 98, 116, 118, 120, 129],
  "Viridian Gym": [27, 50, 66, 74, 95, 111],
  "Route 23": [21, 23, 27, 41, 60, 72, 79, 118, 129],
  "Victory Road": [23, 41, 66, 74, 95, 104, 111, 146, 147],
  "Indigo Plateau": [63, 95, 106, 107, 113, 124, 131, 143, 147],
  "Pokemon League": [1, 4, 7, 25, 63, 74, 95, 131, 143, 147],
  "Lorelei's Elite Four Chamber": [54, 79, 86, 90, 124, 131],
  "Bruno's Elite Four Chamber": [56, 66, 74, 95, 106, 107],
  "Agatha's Elite Four Chamber": [23, 41, 88, 92],
  "Lance's Elite Four Chamber": [129, 130, 142, 147],
  "Champion's Room": [1, 4, 7, 25, 63, 111, 130, 143],
  "Hall of Fame": [113, 131, 132, 143, 147],
  "Cerulean Cave": [24, 26, 40, 42, 47, 49, 53, 55, 57, 64, 67, 82, 85, 97, 101, 105, 108, 112, 113, 114, 115, 132, 150],
  "Power Plant": [25, 81, 100, 125, 145],
  "Trade Encounter Locations": [63, 66, 74, 92, 122, 124],
  "Gift Pokemon Locations": [1, 4, 7, 106, 107, 113, 131, 133, 137],
  "Fossil Pokemon Revival Locations": [138, 140, 142],
  "Legendary Bird Encounter Locations": [144, 145, 146],
  "Mewtwo Encounter Location": [150],
  "Mew Special Event Location": [151],
  "Shiny Encounter Locations": [25, 37, 58, 63, 77, 90, 123, 127, 130, 132, 133, 147],
  "Shiny Legendary Encounter Locations": [144, 145, 146],
};

export function spinLocation(selectedTeam: Pokemon[], allPokemon: Pokemon[]) {
  if (selectedTeam.length === 0) {
    return PROFESSOR_OAK_LAB;
  }

  return pickRandomLocation(getAvailableLocations(selectedTeam, allPokemon));
}

export function spinLegendaryLocation(selectedTeam: Pokemon[], allPokemon: Pokemon[]) {
  const legendaryLocations = LEGENDARY_SPIN_LOCATIONS.filter(
    (location) => getEligiblePokemonForLocation(location, selectedTeam, allPokemon).length > 0,
  );

  if (legendaryLocations.length === 0) {
    return spinLocation(selectedTeam, allPokemon);
  }

  return pickRandomLocation(legendaryLocations);
}

export function getAvailableLocations(selectedTeam: Pokemon[], allPokemon: Pokemon[]) {
  return KANTO_LOCATIONS.filter((location) => {
    if (location === PROFESSOR_OAK_LAB && selectedTeam.length > 0) {
      return false;
    }

    return getEligiblePokemonForLocation(location, selectedTeam, allPokemon).length > 0;
  });
}

export function getLocationEncounterFamilies(location: string) {
  return KANTO_ENCOUNTER_FAMILIES[location] ?? [];
}

export function getEligiblePokemonForLocation(
  location: string,
  selectedTeam: Pokemon[],
  allPokemon: Pokemon[],
) {
  const selectedIds = new Set(selectedTeam.map((pokemon) => pokemon.id));
  const selectedFamilyKeys = new Set(
    selectedTeam.map((pokemon) => getEvolutionFamilyKey(pokemon.id)),
  );
  const candidates = getLocationEncounterFamilies(location)
    .flatMap((familyId) => FAMILY_BY_POKEMON_ID.get(familyId) ?? [familyId])
    .map((pokemonId) => allPokemon.find((pokemon) => pokemon.id === pokemonId))
    .filter((pokemon): pokemon is Pokemon => Boolean(pokemon))
    .filter((pokemon) => !selectedIds.has(pokemon.id));
  const familyUniqueCandidates = candidates.filter(
    (pokemon) => !selectedFamilyKeys.has(getEvolutionFamilyKey(pokemon.id)),
  );

  return pickOnePokemonPerEvolutionFamily(
    familyUniqueCandidates.length > 0 ? familyUniqueCandidates : candidates,
  );
}

export function getLegendaryEncounterForLocation(
  location: string,
  selectedTeam: Pokemon[],
  allPokemon: Pokemon[],
) {
  const selectedIds = new Set(selectedTeam.map((pokemon) => pokemon.id));
  let desiredIds: number[] = [];

  if (
    location === "Legendary Bird Encounter Locations" ||
    location === "Shiny Legendary Encounter Locations"
  ) {
    desiredIds = [144, 145, 146];
  } else if (location === "Mewtwo Encounter Location" || location === "Cerulean Cave") {
    desiredIds = [150];
  } else if (location === "Mew Special Event Location") {
    desiredIds = [151];
  } else if (location === "Power Plant") {
    desiredIds = [145];
  } else if (location === "Seafoam Islands") {
    desiredIds = [144];
  } else if (location === "Victory Road") {
    desiredIds = [146];
  }

  const available = desiredIds
    .map((pokemonId) => allPokemon.find((pokemon) => pokemon.id === pokemonId))
    .filter((pokemon): pokemon is Pokemon => Boolean(pokemon))
    .filter((pokemon) => !selectedIds.has(pokemon.id));

  return available.length > 0 ? pickRandomPokemon(available) : null;
}

export function getEvolutionFamilyKey(pokemonId: number) {
  return FAMILY_KEY_BY_POKEMON_ID.get(pokemonId) ?? pokemonId;
}

export function pickOnePokemonPerEvolutionFamily(pokemon: Pokemon[]) {
  const byFamily = new Map<number, Pokemon[]>();

  pokemon.forEach((candidate) => {
    const familyKey = getEvolutionFamilyKey(candidate.id);
    const family = byFamily.get(familyKey) ?? [];
    family.push(candidate);
    byFamily.set(familyKey, family);
  });

  return Array.from(byFamily.values()).map((family) => pickRandomPokemon(family));
}

export function getMissingEncounterPokemonIds() {
  const coveredIds = new Set<number>();

  Object.values(KANTO_ENCOUNTER_FAMILIES).forEach((familyIds) => {
    familyIds.forEach((familyId) => {
      const family = FAMILY_BY_POKEMON_ID.get(familyId) ?? [familyId];
      family.forEach((pokemonId) => coveredIds.add(pokemonId));
    });
  });

  return Array.from({ length: 151 }, (_, index) => index + 1).filter(
    (pokemonId) => !coveredIds.has(pokemonId),
  );
}

function pickRandomLocation(locations: readonly string[]) {
  return locations[Math.floor(Math.random() * locations.length)] ?? PROFESSOR_OAK_LAB;
}

function pickRandomPokemon(pokemon: Pokemon[]) {
  return pokemon[Math.floor(Math.random() * pokemon.length)];
}
