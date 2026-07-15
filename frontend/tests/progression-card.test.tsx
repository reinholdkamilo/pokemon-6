import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ProgressionCard } from "@/components/ProgressionCard";
import type { OpponentMeta } from "@/lib/progression";

const player: OpponentMeta = {
  name: "Chaz",
  stage: "Player",
  number: 1,
  specialty: "Player",
  pokemonCount: 6,
  pokemonTeam: ["Pikachu", "Charizard", "Blastoise", "Venusaur", "Snorlax", "Lapras"],
  fallback: "C",
};

const opponent: OpponentMeta = {
  name: "Brock",
  stage: "Gym Leader",
  number: 1,
  specialty: "Rock",
  pokemonCount: 2,
  pokemonTeam: ["Geodude", "Onix"],
  fallback: "B",
};

describe("ProgressionCard result presentation", () => {
  it("suppresses automatic player stamps for Marathon results", () => {
    const html = renderToStaticMarkup(
      <ProgressionCard
        explicitResultStamp={null}
        meta={player}
        spritePresentation="full-body"
        status="cleared"
        suppressAutomaticStamp
      />,
    );

    expect(html).not.toContain("result-stamp");
    expect(html).toContain("progression-card--sprite-full-body");
  });

  it("renders opponent victory stamp as success", () => {
    const html = renderToStaticMarkup(
      <ProgressionCard
        explicitResultStamp={{ text: "DEFEATED", tone: "success" }}
        meta={opponent}
        spritePresentation="pixel-trainer"
        status="cleared"
        suppressAutomaticStamp
      />,
    );

    expect(html).toContain("DEFEATED");
    expect(html).toContain("result-stamp--success");
    expect(html).toContain("progression-card--sprite-pixel-trainer");
  });

  it("renders opponent loss stamp as danger", () => {
    const html = renderToStaticMarkup(
      <ProgressionCard
        explicitResultStamp={{ text: "WIPED OUT", tone: "danger" }}
        meta={opponent}
        spritePresentation="pixel-trainer"
        status="failed"
        suppressAutomaticStamp
      />,
    );

    expect(html).toContain("WIPED OUT");
    expect(html).toContain("result-stamp--danger");
  });

  it("preserves automatic Battle/Arcade stamps by default", () => {
    const html = renderToStaticMarkup(
      <ProgressionCard
        breakdown={{ opponent_name: "Brock", stage: "Gym Leader", outcome: "Beat", win_type: "normal" }}
        meta={opponent}
        status="cleared"
      />,
    );

    expect(html).toContain("DEFEATED");
    expect(html).toContain("result-stamp--success");
  });
});
