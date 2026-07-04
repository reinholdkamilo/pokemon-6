# Pokémon 6

Pokémon 6 is a fan-made team-building strategy game where players build a team of six Generation 1 Pokémon to defeat the 8 gym leaders, collect all 8 badges, defeat the Elite Four, and beat the Pokémon Champion without losing a battle.

## MVP Challenge

Build a team of the six strongest Generation 1 Pokémon with balanced primary types.

## Core Features

- Pokémon search
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
4. Search for a Pokemon by name.
5. Add six different Pokemon to the team slots.
6. Remove one Pokemon and add another to confirm team editing works.
7. Submit the complete team.
8. Confirm the result panel shows total score, Win/Lose result, score breakdown,
   explanation, and warnings.
