import json
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter
from pydantic import BaseModel, Field, field_validator


DATA_DIR = Path(__file__).resolve().parent.parent / "data"
TRAINERS_PATH = DATA_DIR / "pokemon_trainers.json"

router = APIRouter(prefix="/trainers", tags=["trainers"])


class TrainerCreateRequest(BaseModel):
    name: str = Field(min_length=1)
    dob: str = Field(min_length=1)
    email: str = Field(min_length=1)
    hometown: str = Field(min_length=1)
    sprite: str = Field(min_length=1)
    created_at: str = Field(min_length=1)

    @field_validator("name", "dob", "email", "hometown", "sprite", "created_at")
    @classmethod
    def reject_blank_values(cls, value: str) -> str:
        stripped_value = value.strip()
        if not stripped_value:
            raise ValueError("Field cannot be empty.")
        return stripped_value

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        if "@" not in value:
            raise ValueError("Email must contain @.")
        return value


@router.post("")
def save_trainer(request: TrainerCreateRequest) -> dict:
    profile = request.model_dump()
    saved_profile = {
        "id": str(uuid4()),
        **profile,
    }

    trainers = _read_trainers()
    trainers.append(saved_profile)
    _write_trainers(trainers)

    return saved_profile


def _read_trainers() -> list[dict]:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if not TRAINERS_PATH.exists():
        _write_trainers([])
        return []

    with TRAINERS_PATH.open("r", encoding="utf-8") as trainers_file:
        data = json.load(trainers_file)

    if not isinstance(data, list):
        return []

    return data


def _write_trainers(trainers: list[dict]) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with TRAINERS_PATH.open("w", encoding="utf-8") as trainers_file:
        json.dump(trainers, trainers_file, indent=2)
        trainers_file.write("\n")
