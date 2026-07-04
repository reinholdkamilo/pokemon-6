from fastapi import APIRouter, Query

from app.services.pokemon_service import get_all_pokemon, search_pokemon


router = APIRouter(prefix="/pokemon", tags=["pokemon"])


@router.get("")
def list_pokemon() -> list[dict]:
    return get_all_pokemon()


@router.get("/search")
def find_pokemon(query: str = Query(..., min_length=1)) -> list[dict]:
    return search_pokemon(query)
