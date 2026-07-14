# Pokémon 6 — Agent Instructions

## Purpose
Build and maintain Pokémon 6, a Generation 1 team-building strategy game where a player selects six Pokémon and attempts an undefeated run through the Gym Leaders, Elite Four, and Champion.

## Source of truth
- Repository: `reinholdkamilo/pokemon-6`
- Default working branch: `dev`
- Frontend: `frontend/` (Next.js, Node 20+)
- Backend: `backend/` (FastAPI, Python)
- Roadmap: `docs/ROADMAP.md`
- Current state: `docs/PROJECT_STATE.md`

## Working rules
1. Inspect existing code before creating or replacing files.
2. Make the smallest complete change that satisfies the task.
3. Reuse existing patterns, components, data, and styles.
4. Keep frontend and backend responsibilities separated.
5. Do not expose private trainer data, credentials, or secrets.
6. Avoid official Pokémon images, logos, or copyrighted assets.
7. Do not commit broken code.
8. Use feature branches for normal product work and target `dev`.
9. Keep commits focused and messages clear.
10. Update roadmap or project state only when the task materially changes them.
11. Keep documentation and responses concise; avoid repeated context.

## Validation
Run only checks relevant to the change, then expand if failures suggest broader impact.

Backend:
```bash
backend/.venv/bin/python -m pytest
```

Frontend:
```bash
cd frontend
npm run build
```

## Definition of done
- Acceptance criteria are met.
- Relevant tests/build checks pass, or unrun checks are explicitly reported.
- No unrelated files are changed.
- Privacy and existing gameplay behaviour are preserved.
- The change is committed and ready for review.

## Execution preference
Use the shortest reliable route. Prefer direct GitHub edits for small, clear changes. Use a runnable environment only when execution, broad refactoring, package installation, browser verification, or repeated edit-test cycles materially improve reliability. Ask before paid, destructive, production, deployment, merge, or data-migration actions unless explicitly authorised.