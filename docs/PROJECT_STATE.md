# Pokémon 6 Project State

## Repository
- Source: `reinholdkamilo/pokemon-6`
- Working branch: `dev`
- Architecture: FastAPI backend and Next.js frontend

## Current product
- Generation 1 team-building challenge
- Local Trainer Card creation
- Six unique Pokémon card selections with re-spins
- Gym Leader progression
- Elite Four progression
- Champion Gary battle
- End-results screen and retry flow

## Frontend
- Location: `frontend/`
- Runtime: Node.js 20+
- Validation: `cd frontend && npm run build`
- Local Pokémon, trainer, and badge assets are used

## Backend
- Location: `backend/`
- Framework: FastAPI
- Validation: `backend/.venv/bin/python -m pytest`
- Local trainer records are excluded from Git; only the example template is tracked

## Deployment
- GitHub is the source of truth
- Vercel project connection: not yet verified in this workflow
- Render backend connection: not yet verified in this workflow

## Current focus
Continue MVP polish through small, tested milestones. Use `AGENTS.md` for operating rules and `docs/ROADMAP.md` for priorities.

## Known blockers
None recorded.
