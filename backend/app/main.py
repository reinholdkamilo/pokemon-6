from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.health import router as health_router
from app.routes.pokemon import router as pokemon_router
from app.routes.teams import router as teams_router
from app.routes.trainers import router as trainers_router


app = FastAPI(title="Pokemon 6 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(pokemon_router)
app.include_router(teams_router)
app.include_router(trainers_router)
