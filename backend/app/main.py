import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.health import router as health_router
from app.routes.pokemon import router as pokemon_router
from app.routes.teams import router as teams_router
from app.routes.trainers import router as trainers_router


app = FastAPI(title="Pokemon 6 API")


DEFAULT_CORS_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://192.168.1.126:3000",
]


def get_cors_origins() -> list[str]:
    configured_origins = os.getenv("POKEMON6_CORS_ORIGINS", "")
    extra_origins = [
        origin.strip()
        for origin in configured_origins.split(",")
        if origin.strip()
    ]

    return list(dict.fromkeys([*DEFAULT_CORS_ORIGINS, *extra_origins]))


app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_origin_regex=r"^http://192\.168\.\d{1,3}\.\d{1,3}:3000$",
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)

app.include_router(health_router)
app.include_router(pokemon_router)
app.include_router(teams_router)
app.include_router(trainers_router)
