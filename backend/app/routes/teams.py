from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.team_scoring import score_team


router = APIRouter(prefix="/teams", tags=["teams"])


class TeamScoreRequest(BaseModel):
    pokemon_names: list[str]


@router.post("/score")
def score_pokemon_team(request: TeamScoreRequest) -> dict:
    try:
        return score_team(request.pokemon_names)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
