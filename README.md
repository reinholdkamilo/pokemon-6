# Pokémon 6

Pokémon 6 is a fan-made team-building strategy game where players build a team of six Generation 1 Pokémon to defeat the 8 gym leaders, collect all 8 badges, defeat the Elite Four, and beat the Pokémon Champion without losing a battle.

## MVP Challenge

Draw six Generation 1 Pokémon cards, then submit that team to see
whether it is strong and balanced enough to win the Champion run.

## Core Features

- Card-based Pokémon selection
- Pokémon search as a secondary/debug tool
- Team of six selection slots
- Challenge rules
- Submit team
- Win/Lose result
- Pokémon details for each selected pick
- Simple local Pokémon data
- Clean GitHub and Codex workflow

## Development Rules

- Use GitHub from day one
- Commit small working changes
- Keep backend and frontend separated
- Do not commit broken code to main
- Use feature branches for new work
- Keep project documentation updated

## Running the Backend

From the repository root:

```bash
cd backend
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API runs at `http://127.0.0.1:8000`.

## Running Backend Tests

From the repository root, after installing the backend requirements:

```bash
backend/.venv/bin/python -m pytest
```

Or from inside `backend` with the virtualenv activated:

```bash
python -m pytest
```

## Running the Frontend

From the repository root:

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:3000` and calls the backend at
`http://127.0.0.1:8000`. Use Node.js 20 or newer.

## Building the Frontend

From the repository root:

```bash
cd frontend
npm install
npm run build
```

## Local Sprite Assets

Download the local Generation 1 Pokémon sprites with:

```bash
python3 scripts/download_pokemon_images.py
```

The script saves `1.png` through `151.png` in
`frontend/public/images/pokemon/` and skips files that already exist.
Pokémon sprites are locally stored in that folder, so the app does not rely on
official artwork or remote image services at runtime.

The current trainer and badge assets are original fan-made placeholder SVGs.
They are simple local sprites for the MVP and are not official artwork, logos,
trainer sprites, or badge sprites.

Badge placeholder files live in `frontend/public/images/badges/`:

- `boulder.svg`
- `cascade.svg`
- `thunder.svg`
- `rainbow.svg`
- `soul.svg`
- `marsh.svg`
- `volcano.svg`
- `earth.svg`

Trainer placeholder files live in `frontend/public/images/trainers/`:

- `brock.svg`
- `misty.svg`
- `lt-surge.svg`
- `erika.svg`
- `koga.svg`
- `sabrina.svg`
- `blaine.svg`
- `giovanni.svg`
- `lorelei.svg`
- `bruno.svg`
- `agatha.svg`
- `lance.svg`
- `gary.svg`

These placeholders can later be replaced by placing correctly named files in
the same folders and updating `frontend/lib/imagePaths.ts` if the file extension
changes. Missing or failed badge and trainer images are handled by styled local
fallbacks, so the app does not show broken image icons.

Sprite display sizing is handled by CSS in `frontend/app/globals.css`. Pokémon,
trainer, and badge images are scaled within their existing card, avatar, and
badge areas, so improving sprite fit should not require resizing card layouts,
grids, buttons, headings, or panels.

## Manual MVP Test

1. Start the backend.
2. Start the frontend.
3. Open `http://localhost:3000`.
4. Confirm the title screen uses the local background image and card backs.
5. Press CATCH EM ALL and confirm the six-card selection screen appears.
6. Tap any unrevealed card and confirm it cycles through Pokemon names and types.
7. Confirm the revealed card can be tapped again to re-spin that same team slot.
8. Confirm duplicate Pokemon are not drawn across the six card slots.
9. Repeat until all six cards are filled.
10. Confirm I CHOOSE YOU appears only after six Pokemon are selected.
11. Submit the complete team and confirm the button shows a scoring state.
12. Confirm the Gym Leader journey screen marks earned badges as cleared.
13. Confirm the result panel shows badges, journey progress, stage scores, total
   score, Win/Lose result, score breakdown, explanation, and warnings.
