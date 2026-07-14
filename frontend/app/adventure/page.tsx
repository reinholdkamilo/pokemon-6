"use client";

import { useEffect, useMemo, useState } from "react";
import { getPokemon } from "@/lib/api";
import type { Pokemon } from "@/types/pokemon";
import styles from "./adventure.module.css";

type Condition = "Healthy" | "Tired" | "Fainted";
type PartyMember = { pokemon: Pokemon; condition: Condition };
type Phase = "trainer" | "starter" | "journey" | "league" | "complete";
type EventKind = "wild" | "trainer" | "centre" | "mart" | "item" | "daycare" | "safari" | "gym" | "rival";
type AdventureEvent = { kind: EventKind; title: string; text: string; trainerClass?: string };
type SaveState = {
  phase: Phase;
  trainer: string;
  party: PartyMember[];
  box: Pokemon[];
  locationIndex: number;
  routeProgress: number;
  badges: string[];
  money: number;
  pokeballs: number;
  potions: number;
  event: AdventureEvent | null;
  log: string[];
};

const SAVE_KEY = "pokemon-6-adventure-v2";
const TRAINERS = ["Chaz", "Laga", "Kevin", "GJ"];
const STARTERS = ["Bulbasaur", "Charmander", "Squirtle"];
const LOCATIONS = [
  { name: "Pallet Town", route: "Route 1", gym: null },
  { name: "Pewter City", route: "Viridian Forest", gym: "Boulder Badge" },
  { name: "Cerulean City", route: "Route 4", gym: "Cascade Badge" },
  { name: "Vermilion City", route: "Route 6", gym: "Thunder Badge" },
  { name: "Celadon City", route: "Route 7", gym: "Rainbow Badge" },
  { name: "Fuchsia City", route: "Cycling Road", gym: "Soul Badge" },
  { name: "Saffron City", route: "Route 15", gym: "Marsh Badge" },
  { name: "Cinnabar Island", route: "Seafoam Islands", gym: "Volcano Badge" },
  { name: "Viridian City", route: "Route 22", gym: "Earth Badge" },
  { name: "Indigo Plateau", route: "Victory Road", gym: null },
];
const TRAINER_CLASSES = ["youngster", "lass", "bug-catcher", "hiker", "fisherman", "camper", "picnicker", "ace-trainer"];

const EMPTY_SAVE: SaveState = {
  phase: "trainer",
  trainer: "",
  party: [],
  box: [],
  locationIndex: 0,
  routeProgress: 0,
  badges: [],
  money: 3000,
  pokeballs: 5,
  potions: 2,
  event: null,
  log: ["Professor Oak is waiting in Pallet Town."],
};

export default function AdventurePage() {
  const [catalogue, setCatalogue] = useState<Pokemon[]>([]);
  const [state, setState] = useState<SaveState>(EMPTY_SAVE);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getPokemon().then(setCatalogue).catch(() => setCatalogue([]));
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (raw) {
      try { setState(JSON.parse(raw) as SaveState); } catch { window.localStorage.removeItem(SAVE_KEY); }
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) window.localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  }, [state, loaded]);

  const location = LOCATIONS[Math.min(state.locationIndex, LOCATIONS.length - 1)];
  const healthyCount = state.party.filter((member) => member.condition === "Healthy").length;

  const wildPool = useMemo(() => {
    if (!catalogue.length) return [];
    const tier = Math.min(151, 25 + state.locationIndex * 14);
    return catalogue.filter((pokemon) => pokemon.id <= tier && !state.party.some((member) => member.pokemon.id === pokemon.id));
  }, [catalogue, state.locationIndex, state.party]);

  function patch(update: Partial<SaveState>) {
    setState((current) => ({ ...current, ...update }));
  }

  function addLog(message: string) {
    setState((current) => ({ ...current, log: [message, ...current.log].slice(0, 8) }));
  }

  function selectTrainer(trainer: string) {
    patch({ trainer, phase: "starter", log: [`${trainer} received a Pokédex from Professor Oak.`] });
  }

  function selectStarter(name: string) {
    const starter = catalogue.find((pokemon) => pokemon.name === name);
    if (!starter) return;
    patch({ party: [{ pokemon: starter, condition: "Healthy" }], phase: "journey", log: [`${name} joined your party. Your Kanto journey begins!`] });
  }

  function explore() {
    if (state.event || state.phase !== "journey") return;
    if (healthyCount === 0) {
      patch({ event: { kind: "centre", title: "Your party cannot continue", text: "All of your Pokémon have fainted. A nearby helper takes you to the Pokémon Centre." } });
      return;
    }

    const nextProgress = state.routeProgress + 1;
    if (nextProgress >= 3) {
      if (location.gym && !state.badges.includes(location.gym)) {
        patch({ routeProgress: nextProgress, event: { kind: "gym", title: `${location.name} Gym`, text: `The Gym Leader is ready. Win to earn the ${location.gym}.` } });
        return;
      }
      if (state.locationIndex === LOCATIONS.length - 1 && state.badges.length >= 8) {
        patch({ phase: "league", event: null });
        return;
      }
      const nextLocationIndex = Math.min(state.locationIndex + 1, LOCATIONS.length - 1);
      patch({ locationIndex: nextLocationIndex, routeProgress: 0, event: null });
      addLog(`Arrived near ${LOCATIONS[nextLocationIndex].name}.`);
      return;
    }

    patch({ routeProgress: nextProgress, event: rollEvent() });
  }

  function rollEvent(): AdventureEvent {
    const roll = Math.random();
    if (roll < 0.30) return { kind: "wild", title: "Wild Pokémon", text: "Something is moving in the tall grass." };
    if (roll < 0.52) {
      const trainerClass = TRAINER_CLASSES[Math.floor(Math.random() * TRAINER_CLASSES.length)];
      return { kind: "trainer", title: "Trainer Challenge", text: `A ${trainerClass.replaceAll("-", " ")} challenges you to battle.`, trainerClass };
    }
    if (roll < 0.64) return { kind: "item", title: "Hidden Item", text: "Your Pokémon noticed something beside the path." };
    if (roll < 0.74 || healthyCount <= Math.max(1, Math.floor(state.party.length / 2))) return { kind: "centre", title: "Pokémon Centre", text: "Nurse Joy offers to restore your entire party." };
    if (roll < 0.83) return { kind: "mart", title: "Poké Mart", text: "A travelling clerk has supplies for sale." };
    if (roll < 0.90) return { kind: "daycare", title: "Pokémon Day Care", text: "A caretaker offers to refresh one tired Pokémon." };
    if (roll < 0.96 && state.locationIndex >= 4) return { kind: "safari", title: "Safari Encounter", text: "A rare Pokémon has appeared in a protected habitat." };
    return { kind: "rival", title: "Gary Appears", text: "Gary has been tracking your progress and wants a battle." };
  }

  function finishEvent(message: string, updates: Partial<SaveState> = {}) {
    setState((current) => ({ ...current, ...updates, event: null, log: [message, ...current.log].slice(0, 8) }));
  }

  function wildEncounter(isSafari = false) {
    const candidate = wildPool[Math.floor(Math.random() * wildPool.length)];
    if (!candidate) return finishEvent("The grass went quiet before you could find anything.");
    const cost = 1;
    if (state.pokeballs < cost) return finishEvent(`${candidate.name} escaped because you had no Poké Balls.`);
    const catchChance = isSafari ? 0.7 : 0.55;
    if (Math.random() <= catchChance) {
      const nextMember = { pokemon: candidate, condition: "Healthy" as Condition };
      if (state.party.length < 6) {
        finishEvent(`${candidate.name} was caught and joined your party!`, { party: [...state.party, nextMember], pokeballs: state.pokeballs - cost });
      } else {
        finishEvent(`${candidate.name} was caught and sent to your storage box.`, { box: [...state.box, candidate], pokeballs: state.pokeballs - cost });
      }
    } else {
      finishEvent(`${candidate.name} broke free and escaped.`, { pokeballs: state.pokeballs - cost });
    }
  }

  function battle(kind: "trainer" | "rival" | "gym") {
    const strength = state.party.reduce((total, member) => total + member.pokemon.base_stat_total * (member.condition === "Healthy" ? 1 : member.condition === "Tired" ? 0.65 : 0), 0);
    const difficulty = 300 + state.locationIndex * 135 + (kind === "gym" ? 260 : kind === "rival" ? 170 : 0);
    const winChance = Math.max(0.25, Math.min(0.9, strength / Math.max(strength + difficulty, 1)));
    const won = Math.random() <= winChance;
    const nextParty = state.party.map((member, index) => {
      if (member.condition === "Fainted") return member;
      if (!won && index < 2) return { ...member, condition: "Fainted" as Condition };
      if (Math.random() < 0.35) return { ...member, condition: "Tired" as Condition };
      return member;
    });

    if (!won) return finishEvent("You lost the battle. Your weakened party needs a Pokémon Centre.", { party: nextParty });

    const reward = kind === "gym" ? 1500 : kind === "rival" ? 900 : 450;
    const updates: Partial<SaveState> = { party: nextParty, money: state.money + reward };
    if (kind === "gym" && location.gym) updates.badges = [...state.badges, location.gym];
    finishEvent(kind === "gym" ? `Victory! You earned the ${location.gym}.` : `You won the battle and received ₽${reward}.`, updates);
  }

  function healAll() {
    finishEvent("Nurse Joy restored your party to full health.", { party: state.party.map((member) => ({ ...member, condition: "Healthy" })) });
  }

  function buy(item: "ball" | "potion") {
    const price = item === "ball" ? 200 : 300;
    if (state.money < price) return;
    patch({ money: state.money - price, pokeballs: state.pokeballs + (item === "ball" ? 1 : 0), potions: state.potions + (item === "potion" ? 1 : 0) });
  }

  function usePotion(index: number) {
    if (state.potions <= 0 || state.party[index].condition === "Healthy") return;
    const party = [...state.party];
    party[index] = { ...party[index], condition: "Healthy" };
    patch({ party, potions: state.potions - 1 });
  }

  function completeLeague() {
    const ready = state.party.filter((member) => member.condition !== "Fainted").length >= 4;
    if (!ready) {
      patch({ event: { kind: "centre", title: "League preparation", text: "At least four Pokémon must be able to battle before entering the League." } });
      return;
    }
    patch({ phase: "complete", event: null });
    addLog(`${state.trainer} became the Champion of Kanto.`);
  }

  function resetAdventure() {
    window.localStorage.removeItem(SAVE_KEY);
    setState(EMPTY_SAVE);
  }

  if (!loaded) return <main className={styles.shell}><p>Loading adventure...</p></main>;

  if (state.phase === "trainer") return (
    <main className={styles.shell}>
      <header className={styles.hero}><p>Professor Oak's Laboratory</p><h1>Choose Your Trainer</h1><span>Your Kanto story will save automatically on this device.</span></header>
      <section className={styles.trainerGrid}>{TRAINERS.map((trainer) => <button key={trainer} className={styles.trainerCard} onClick={() => selectTrainer(trainer)}><span>{trainer[0]}</span><strong>{trainer}</strong><small>Begin Adventure</small></button>)}</section>
      <a className={styles.textLink} href="/">Return to Main Menu</a>
    </main>
  );

  if (state.phase === "starter") return (
    <main className={styles.shell}>
      <header className={styles.hero}><p>Professor Oak</p><h1>Choose Your First Pokémon</h1><span>This partner will begin the journey beside {state.trainer}.</span></header>
      <section className={styles.starterGrid}>{STARTERS.map((name) => { const pokemon = catalogue.find((entry) => entry.name === name); return <button key={name} className={styles.starterCard} disabled={!pokemon} onClick={() => selectStarter(name)}>{pokemon?.image ? <img src={pokemon.image} alt={name} /> : null}<strong>{name}</strong><small>{pokemon?.primary_type ?? "Loading"}</small></button>; })}</section>
    </main>
  );

  if (state.phase === "complete") return (
    <main className={styles.shell}><section className={styles.champion}><p>Kanto League Champion</p><h1>Congratulations, {state.trainer}!</h1><span>You collected all eight badges, crossed Victory Road and conquered the Pokémon League.</span><div className={styles.johto}>A radio signal from Johto has been detected...</div><button className={styles.primary} onClick={resetAdventure}>START A NEW ADVENTURE</button><a className={styles.textLink} href="/">Main Menu</a></section></main>
  );

  if (state.phase === "league") return (
    <main className={styles.shell}><header className={styles.hero}><p>Indigo Plateau</p><h1>The Pokémon League</h1><span>Four elite trainers and Champion Gary stand between you and history.</span></header><PartyPanel party={state.party} potions={state.potions} onPotion={usePotion} /><section className={styles.leagueCard}><img src="/images/trainers/gary.png" alt="Champion Gary" /><div><h2>Final Challenge</h2><p>Your full Kanto journey has prepared your team for this moment.</p><button className={styles.primary} onClick={completeLeague}>CHALLENGE THE LEAGUE</button></div></section></main>
  );

  return (
    <main className={styles.shell}>
      <header className={styles.topbar}><a href="/">POKÉMON 6</a><span>{state.trainer}</span><button onClick={resetAdventure}>New Run</button></header>
      <section className={styles.worldHeader}><div><p>{location.route}</p><h1>{location.name}</h1><span>Route progress {state.routeProgress}/3</span></div><div className={styles.resources}><b>₽{state.money}</b><b>◉ {state.pokeballs}</b><b>✚ {state.potions}</b><b>Badges {state.badges.length}/8</b></div></section>
      <div className={styles.progress}><i style={{ width: `${((state.locationIndex + state.routeProgress / 3) / (LOCATIONS.length - 1)) * 100}%` }} /></div>
      <PartyPanel party={state.party} potions={state.potions} onPotion={usePotion} />
      <section className={styles.actionPanel}><h2>{state.event ? state.event.title : `Explore ${location.route}`}</h2><p>{state.event ? state.event.text : "Move forward and discover a weighted Kanto encounter. Your party condition, supplies and choices persist."}</p>{state.event ? <EventActions event={state.event} state={state} onWild={() => wildEncounter(false)} onSafari={() => wildEncounter(true)} onBattle={battle} onHeal={healAll} onBuy={buy} onFinish={finishEvent} /> : <button className={styles.primary} onClick={explore}>CONTINUE JOURNEY</button>}</section>
      {state.event?.trainerClass ? <img className={styles.eventTrainer} src={`/images/trainers/adventure/${state.event.trainerClass}.png`} alt={state.event.trainerClass} /> : null}
      <section className={styles.log}><h3>Adventure Log</h3>{state.log.map((entry, index) => <p key={`${entry}-${index}`}>{entry}</p>)}</section>
    </main>
  );
}

function PartyPanel({ party, potions, onPotion }: { party: PartyMember[]; potions: number; onPotion: (index: number) => void }) {
  return <section className={styles.party}><h2>Your Party</h2><div>{party.map((member, index) => <article key={`${member.pokemon.id}-${index}`} className={styles[member.condition.toLowerCase()]}>{member.pokemon.image ? <img src={member.pokemon.image} alt={member.pokemon.name} /> : null}<strong>{member.pokemon.name}</strong><span>{member.condition}</span>{member.condition !== "Healthy" && potions > 0 ? <button onClick={() => onPotion(index)}>Use Potion</button> : null}</article>)}</div></section>;
}

function EventActions({ event, state, onWild, onSafari, onBattle, onHeal, onBuy, onFinish }: { event: AdventureEvent; state: SaveState; onWild: () => void; onSafari: () => void; onBattle: (kind: "trainer" | "rival" | "gym") => void; onHeal: () => void; onBuy: (item: "ball" | "potion") => void; onFinish: (message: string, updates?: Partial<SaveState>) => void }) {
  if (event.kind === "wild") return <div className={styles.actions}><button className={styles.primary} onClick={onWild}>THROW POKÉ BALL</button><button onClick={() => onFinish("You safely left the wild Pokémon behind.")}>Run</button></div>;
  if (event.kind === "safari") return <div className={styles.actions}><button className={styles.primary} onClick={onSafari}>SAFARI CATCH</button><button onClick={() => onFinish("You left the protected habitat undisturbed.")}>Leave</button></div>;
  if (event.kind === "trainer" || event.kind === "rival" || event.kind === "gym") return <button className={styles.primary} onClick={() => onBattle(event.kind)}>BATTLE</button>;
  if (event.kind === "centre") return <button className={styles.primary} onClick={onHeal}>HEAL PARTY</button>;
  if (event.kind === "mart") return <div className={styles.actions}><button disabled={state.money < 200} onClick={() => onBuy("ball")}>Poké Ball ₽200</button><button disabled={state.money < 300} onClick={() => onBuy("potion")}>Potion ₽300</button><button className={styles.primary} onClick={() => onFinish("You packed your supplies and continued.")}>LEAVE MART</button></div>;
  if (event.kind === "item") return <button className={styles.primary} onClick={() => onFinish("You found a Potion hidden beside the route.", { potions: state.potions + 1 })}>PICK UP ITEM</button>;
  if (event.kind === "daycare") return <button className={styles.primary} onClick={() => onFinish("The Day Care refreshed your most tired partner.", { party: state.party.map((member, index) => index === state.party.findIndex((entry) => entry.condition !== "Healthy") ? { ...member, condition: "Healthy" } : member) })}>VISIT DAY CARE</button>;
  return null;
}
