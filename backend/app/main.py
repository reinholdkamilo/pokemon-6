from fastapi import FastAPI

from app.routes.health import router as health_router
from app.routes.pokemon import router as pokemon_router


app = FastAPI(title="Pokemon 6 API")

app.include_router(health_router)
app.include_router(pokemon_router)
