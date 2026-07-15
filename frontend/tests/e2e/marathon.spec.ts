import { expect, test, type Page } from "@playwright/test";

const pokemon = [
  makePokemon(1, "Bulbasaur", 318),
  makePokemon(4, "Charmander", 309),
  makePokemon(7, "Squirtle", 314),
  makePokemon(25, "Pikachu", 320),
  makePokemon(39, "Jigglypuff", 270),
  makePokemon(52, "Meowth", 290),
  makePokemon(54, "Psyduck", 320),
  makePokemon(58, "Growlithe", 350),
  makePokemon(63, "Abra", 310),
  makePokemon(66, "Machop", 305),
  makePokemon(74, "Geodude", 300),
  makePokemon(92, "Gastly", 310),
];

const spriteAlphaBounds: Record<string, [number, number, number, number]> = {
  "/images/trainers/player/Chaz.PNG": [20, 39, 366, 693],
  "/images/trainers/player/Laga.PNG": [20, 38, 355, 687],
  "/images/trainers/player/Kevin.PNG": [18, 38, 320, 677],
  "/images/trainers/player/GJ.PNG": [19, 38, 339, 685],
};

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.route(/http:\/\/[^/]+:8000\/pokemon$/, (route) => route.fulfill({ json: pokemon }));
  await page.route(/http:\/\/[^/]+:8000\/teams\/score$/, (route) =>
    route.fulfill({
      json: {
        score: 900,
        team_score: 900,
        total_score: 900,
        badges_earned: [],
        badges_required: 8,
        opponent_breakdown: {
          gym_leaders: [
            {
              opponent_name: "Brock",
              stage: "Gym Leader",
              matchup_score: 900,
              outcome: "Lost",
              win_type: "loss",
            },
          ],
          elite_four: [],
          champion: [],
        },
      },
    }),
  );
  await page.addInitScript(() => {
    Math.random = () => 0.42;
  });
  await page.exposeFunction("__browserErrors", () => errors);
});

test("title screen exposes Arcade and Marathon only, with route mapping", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Arcade Mode" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Marathon Mode" })).toBeVisible();
  await expect(page.getByText("Adventure Mode")).toHaveCount(0);

  await page.getByRole("button", { name: "Arcade Mode" }).click();
  await expect(page.getByText("Arcade Mode")).toBeVisible();
  await expect(page.getByLabel("Arcade Mode player card")).toBeVisible();

  await page.goto("/");
  await page.getByRole("button", { name: "Marathon Mode" }).click();
  await expect(page).toHaveURL(/\/marathon$/);
  await expect(page.getByText("Marathon Mode").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Choose Your Character" })).toBeVisible();

  await page.goto("/arcade");
  await expect(page).toHaveURL(/\/marathon$/);
});

for (const viewport of [
  { name: "iphone-se", width: 375, height: 667 },
  { name: "iphone-12-13", width: 390, height: 844 },
  { name: "iphone-14-pro-max", width: 430, height: 932 },
  { name: "android-small", width: 360, height: 740 },
  { name: "android-standard", width: 412, height: 915 },
]) {
  test(`Marathon mobile flow is stable at ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openMarathonRoundOne(page, viewport.name);

    await expect(page.getByRole("heading", { name: "Round 1" })).toBeVisible();
    await assertNoHorizontalOverflow(page);
    await assertFullBodySpritesInsideContainers(page);
    await page.screenshot({ path: `test-results/screenshots/${viewport.name}-round-1-matchup.png`, fullPage: true });

    await page.getByRole("button", { name: "BATTLE" }).click();
    await page.getByRole("button", { name: /SKIP ANIMATION|CONTINUE/ }).click();
    await expect(page.getByRole("heading", { name: "Round 1" })).toBeVisible();

    const cards = page.locator(".marathon-matchup-grid .progression-card");
    await expect(cards.nth(0).locator(".result-stamp")).toHaveCount(0);
    await expect(cards.nth(1).locator(".result-stamp")).toHaveText("DEFEATED");
    await expect(cards.nth(1).locator(".result-stamp")).toHaveClass(/result-stamp--success/);
    await page.screenshot({ path: `test-results/screenshots/${viewport.name}-player-win-result.png`, fullPage: true });

    await page.getByRole("button", { name: "NEXT BATTLE" }).click();
    await expect(page.getByRole("heading", { name: "Round 2" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Round 1" })).toHaveCount(0);
    await assertNoHorizontalOverflow(page);
    await assertFullBodySpritesInsideContainers(page);
    await page.screenshot({ path: `test-results/screenshots/${viewport.name}-round-2-matchup.png`, fullPage: true });

    await page.getByRole("button", { name: "BATTLE" }).click();
    await page.getByRole("button", { name: /SKIP ANIMATION|CONTINUE/ }).click();
    await page.getByRole("button", { name: "NEXT BATTLE" }).click();
    await expect(page.getByRole("heading", { name: "Round 3" })).toBeVisible();
    await assertNoHorizontalOverflow(page);

    const browserErrors = await page.evaluate(async () => (window as unknown as { __browserErrors: () => Promise<string[]> }).__browserErrors());
    expect(browserErrors).toEqual([]);
  });
}

async function openMarathonRoundOne(page: Page, viewportName: string) {
  await page.goto("/marathon");
  const characterCard = page.locator(".marathon-character-card");
  const previousButton = page.getByRole("button", { name: "Previous player character" });
  const nextButton = page.getByRole("button", { name: "Next player character" });

  await expect(characterCard).toHaveCount(1);
  await expect(previousButton).toBeVisible();
  await expect(nextButton).toBeVisible();
  await expect(page.locator(".player-character-selector__position")).toHaveText("1 / 4");

  await nextButton.click();
  await expect(page.locator(".player-character-selector__position")).toHaveText("2 / 4");

  await nextButton.click();
  await expect(page.locator(".player-character-selector__position")).toHaveText("3 / 4");

  await nextButton.click();
  await expect(page.locator(".player-character-selector__position")).toHaveText("4 / 4");

  await nextButton.click();
  await expect(page.locator(".player-character-selector__position")).toHaveText("1 / 4");

  await assertNoHorizontalOverflow(page);
  await assertCardsFitViewport(page, ".marathon-character-card");
  await assertFullBodySpritesInsideContainers(page);
  await expect(page.getByRole("button", { name: "CONTINUE" })).toBeVisible();
  await page.screenshot({ path: `test-results/screenshots/${viewportName}-character-select.png`, fullPage: true });

  await page.getByRole("button", { name: "CONTINUE" }).click();
  await page.getByRole("button", { name: "AUTO PICK" }).click();
  await expect(page.getByRole("button", { name: "I CHOOSE YOU!" })).toBeVisible();
  await page.getByRole("button", { name: "I CHOOSE YOU!" }).click();
}

async function assertNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

async function assertCardsFitViewport(page: Page, selector: string) {
  const failures = await page.locator(selector).evaluateAll((cards) =>
    cards
      .map((card) => card.getBoundingClientRect())
      .filter((rect) => rect.left < -1 || rect.right > window.innerWidth + 1)
      .map((rect) => ({ left: rect.left, right: rect.right, width: window.innerWidth })),
  );
  expect(failures).toEqual([]);
}

async function assertFullBodySpritesInsideContainers(page: Page) {
  const failures = await page.locator(".progression-card--sprite-full-body").evaluateAll((cards, alphaBounds) =>
    cards
      .map((card) => {
        const area = card.getElementsByClassName("progression-sprite-area")[0];
        const image = card.getElementsByClassName("trainer-sprite")[0];
        if (!area || !(image instanceof HTMLImageElement)) return null;
        const areaRect = area.getBoundingClientRect();
        const imageRect = image.getBoundingClientRect();
        const naturalRatio = image.naturalWidth / image.naturalHeight;
        const renderedRatio = imageRect.width / imageRect.height;
        const url = new URL(image.currentSrc || image.src);
        const alpha = (alphaBounds as Record<string, [number, number, number, number]>)[url.pathname];
        if (!alpha) {
          return { src: url.pathname, clipped: true, ratioChanged: false, intersectsBottom: true };
        }
        const [left, top, right, bottom] = alpha;
        const visibleRect = {
          left: imageRect.left + (left / image.naturalWidth) * imageRect.width,
          top: imageRect.top + (top / image.naturalHeight) * imageRect.height,
          right: imageRect.left + (right / image.naturalWidth) * imageRect.width,
          bottom: imageRect.top + (bottom / image.naturalHeight) * imageRect.height,
        };
        return {
          src: url.pathname,
          areaRect,
          visibleRect,
          clipped:
            visibleRect.left < areaRect.left - 1 ||
            visibleRect.right > areaRect.right + 1 ||
            visibleRect.top < areaRect.top - 1 ||
            visibleRect.bottom > areaRect.bottom + 1,
          ratioChanged: Math.abs(naturalRatio - renderedRatio) > 0.02,
          intersectsBottom: Math.abs(visibleRect.bottom - areaRect.bottom) <= 1,
        };
      })
      .filter(Boolean)
      .filter((result) => result?.clipped || result?.ratioChanged || result?.intersectsBottom),
    spriteAlphaBounds,
  );
  expect(failures).toEqual([]);
}

function makePokemon(id: number, name: string, baseStatTotal: number) {
  return {
    id,
    name,
    primary_type: "Normal",
    types: ["Normal"],
    image: `/images/pokemon-cards-hd/${String(id).padStart(3, "0")}_${slugifyPokemonName(name)}.png`,
    sprite: `/images/pokemon-cards-hd/${String(id).padStart(3, "0")}_${slugifyPokemonName(name)}.png`,
    base_stat_total: baseStatTotal,
    hp: 50,
    attack: 50,
    defense: 50,
    special_attack: 50,
    special_defense: 50,
    speed: 50,
  };
}

function slugifyPokemonName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}
