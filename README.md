# Pokémon 6

Pokémon 6 is a fan-made team-building strategy game where players build a team of six Generation 1 Pokémon to defeat the 8 gym leaders, collect all 8 badges, defeat the Elite Four, and beat the Pokémon Champion without losing a battle.

## MVP Challenge

Spin to randomly receive six Generation 1 Pokémon, then submit that team to see
whether it is strong and balanced enough to win the Champion run.

## Core Features

- Spin-based Pokémon selection
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

## Running the Frontend

From the repository root:

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:3000` and calls the backend at
`http://127.0.0.1:8000`. Use Node.js 20 or newer.

## Manual MVP Test

1. Start the backend.
2. Start the frontend.
3. Open `http://localhost:3000`.
4. Press Spin and confirm the name and type boxes cycle quickly.
5. Confirm the stopped Pokemon is added to the next team slot automatically.
6. Repeat until all six slots are filled.
7. Confirm Spin is disabled once the team has six Pokemon.
8. Remove one Pokemon or press Reset Team to confirm the team can be changed.
9. Submit the complete team.
10. Confirm the result panel shows total score, Win/Lose result, score breakdown,
   explanation, and warnings.
