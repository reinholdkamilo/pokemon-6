export const BADGE_IMAGE_PATHS: Record<string, string> = {
  "Boulder Badge": "/images/badges/boulder.svg",
  "Cascade Badge": "/images/badges/cascade.svg",
  "Thunder Badge": "/images/badges/thunder.svg",
  "Rainbow Badge": "/images/badges/rainbow.svg",
  "Soul Badge": "/images/badges/soul.svg",
  "Marsh Badge": "/images/badges/marsh.svg",
  "Volcano Badge": "/images/badges/volcano.svg",
  "Earth Badge": "/images/badges/earth.svg",
};

export type PlayerTrainerGender =
  | "male"
  | "female"
  | "player-male"
  | "player-female"
  | "chaz"
  | "laga"
  | "kevin"
  | "gj";

const PLAYER_TRAINER_IMAGE_PATHS: Record<"male" | "female" | "chaz" | "laga" | "kevin" | "gj", string> = {
  male: "/images/trainers/player/Chaz.PNG",
  female: "/images/trainers/player/Laga.PNG",
  chaz: "/images/trainers/player/Chaz.PNG",
  laga: "/images/trainers/player/Laga.PNG",
  kevin: "/images/trainers/player/Kevin.PNG",
  gj: "/images/trainers/player/GJ.PNG",
};

const REGULAR_TRAINER_IMAGE_PATHS: Record<string, string> = {
  "Ace Trainer": "/images/trainers/adventure/ace-trainer.png",
  Beauty: "/images/trainers/adventure/beauty.png",
  Biker: "/images/trainers/adventure/biker.png",
  "Bird Keeper": "/images/trainers/adventure/bird-keeper.png",
  "Black Belt": "/images/trainers/adventure/black-belt.png",
  "Bug Catcher": "/images/trainers/adventure/bug-catcher.png",
  Camper: "/images/trainers/adventure/camper.png",
  Channeler: "/images/trainers/adventure/channeler.png",
  Fisherman: "/images/trainers/adventure/fisherman.png",
  Hiker: "/images/trainers/adventure/hiker.png",
  Juggler: "/images/trainers/adventure/juggler.png",
  Lass: "/images/trainers/adventure/lass.png",
  Picnicker: "/images/trainers/adventure/picnicker.png",
  Sailor: "/images/trainers/adventure/sailor.png",
  Scientist: "/images/trainers/adventure/scientist.png",
  Swimmer: "/images/trainers/adventure/swimmer.png",
  Tamer: "/images/trainers/adventure/tamer.png",
  Youngster: "/images/trainers/adventure/youngster.png",
};

const GYM_LEADER_IMAGE_PATHS: Record<string, string> = {
  Brock: "/images/trainers/gym-leaders/brock.png",
  Misty: "/images/trainers/gym-leaders/misty.png",
  "Lt. Surge": "/images/trainers/gym-leaders/lt-surge.png",
  Erika: "/images/trainers/gym-leaders/erika.png",
  Koga: "/images/trainers/gym-leaders/koga.png",
  Sabrina: "/images/trainers/gym-leaders/sabrina.png",
  Blaine: "/images/trainers/gym-leaders/blaine.png",
  Giovanni: "/images/trainers/gym-leaders/giovanni.png",
};

const ELITE_FOUR_IMAGE_PATHS: Record<string, string> = {
  Lorelei: "/images/trainers/elite-four/lorelei.png",
  Bruno: "/images/trainers/elite-four/bruno.png",
  Agatha: "/images/trainers/elite-four/agatha.png",
  Lance: "/images/trainers/elite-four/lance.png",
};

const CHAMPION_IMAGE_PATHS: Record<string, string> = {
  Gary: "/images/trainers/champion/gary.png",
};

export const TRAINER_IMAGE_PATHS: Record<string, string> = {
  ...REGULAR_TRAINER_IMAGE_PATHS,
  ...GYM_LEADER_IMAGE_PATHS,
  ...ELITE_FOUR_IMAGE_PATHS,
  ...CHAMPION_IMAGE_PATHS,
  "player-male": PLAYER_TRAINER_IMAGE_PATHS.male,
  "player-female": PLAYER_TRAINER_IMAGE_PATHS.female,
  chaz: PLAYER_TRAINER_IMAGE_PATHS.chaz,
  laga: PLAYER_TRAINER_IMAGE_PATHS.laga,
  kevin: PLAYER_TRAINER_IMAGE_PATHS.kevin,
  gj: PLAYER_TRAINER_IMAGE_PATHS.gj,
};

const CARD_FILENAME_OVERRIDES: Record<number, string> = {
  29: "029_nidoranf.png",
  32: "032_nidoranm.png",
  83: "083_farfetch_d.png",
  122: "122_mr_mime.png",
};

export function getPlayerTrainerSprite(gender: PlayerTrainerGender | null | undefined) {
  return PLAYER_TRAINER_IMAGE_PATHS[toPlayerTrainerKey(gender)];
}

export function getGymLeaderSprite(name: string | null | undefined) {
  return getTrainerSpriteFromMap(GYM_LEADER_IMAGE_PATHS, name);
}

export function getEliteFourSprite(name: string | null | undefined) {
  return getTrainerSpriteFromMap(ELITE_FOUR_IMAGE_PATHS, name);
}

export function getChampionSprite(name: string | null | undefined) {
  return getTrainerSpriteFromMap(CHAMPION_IMAGE_PATHS, name) ?? CHAMPION_IMAGE_PATHS.Gary;
}

export function getTrainerSprite(name: string | null | undefined) {
  if (!name) {
    return getPlayerTrainerSprite("male");
  }

  if (
    name === "player-male" ||
    name === "player-female" ||
    name === "chaz" ||
    name === "laga" ||
    name === "kevin" ||
    name === "gj"
  ) {
    return getPlayerTrainerSprite(name);
  }

  return (
    getTrainerSpriteFromMap(REGULAR_TRAINER_IMAGE_PATHS, name) ??
    getGymLeaderSprite(name) ??
    getEliteFourSprite(name) ??
    getTrainerSpriteFromMap(CHAMPION_IMAGE_PATHS, name) ??
    getPlayerTrainerSprite("male")
  );
}

export function getPokemonCardImagePath(pokemon: { id: number; name: string }) {
  const fileName =
    CARD_FILENAME_OVERRIDES[pokemon.id] ??
    `${String(pokemon.id).padStart(3, "0")}_${slugifyPokemonName(pokemon.name)}.png`;

  return `/images/pokemon-cards-hd/${fileName}`;
}

function getTrainerSpriteFromMap(
  map: Record<string, string>,
  name: string | null | undefined,
) {
  if (!name) {
    return undefined;
  }

  return map[name] ?? map[normalizeTrainerName(name)];
}

function normalizeTrainerName(name: string) {
  return name
    .trim()
    .replace(/\s+/g, " ")
    .replace(/^lt surge$/i, "Lt. Surge")
    .replace(/^lt\. surge$/i, "Lt. Surge")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function toPlayerTrainerKey(
  trainer: PlayerTrainerGender | null | undefined,
): "male" | "female" | "chaz" | "laga" | "kevin" | "gj" {
  if (trainer === "female" || trainer === "player-female") {
    return "laga";
  }
  if (trainer === "chaz" || trainer === "laga" || trainer === "kevin" || trainer === "gj") {
    return trainer;
  }
  return "chaz";
}

function slugifyPokemonName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}
