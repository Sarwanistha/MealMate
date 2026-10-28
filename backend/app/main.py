import asyncio
import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from . import models  # noqa: F401  (registers tables on Base)
from .database import Base, engine
from .routers import auth, listings, order_actions, orders
from .services import run_expiry

log = logging.getLogger("mealmate")
EXPIRY_INTERVAL_SECONDS = 60

Base.metadata.create_all(bind=engine)


async def _expiry_loop():
    while True:
        try:
            await asyncio.to_thread(run_expiry)
        except Exception:  # never let the loop die
            log.exception("expiry job failed")
        await asyncio.sleep(EXPIRY_INTERVAL_SECONDS)


@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(_expiry_loop())
    try:
        yield
    finally:
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass


app = FastAPI(title="MealMate API", description="Marketplace for surplus food.", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(listings.router)
app.include_router(orders.router)
app.include_router(order_actions.router)


@app.get("/api/health", tags=["meta"])
def health():
    return {"status": "ok"}


# Production: serve the built React app from the same origin (no CORS / API URL config needed).
# In dev the dist folder is absent (or ignored) and Vite serves the frontend instead.
FRONTEND_DIST = Path(os.getenv("FRONTEND_DIST", Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"))

if (FRONTEND_DIST / "index.html").is_file():

    @app.get("/{full_path:path}", include_in_schema=False)
    def spa(full_path: str):
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="Not found")
        target = (FRONTEND_DIST / full_path).resolve()
        if full_path and target.is_file() and FRONTEND_DIST.resolve() in target.parents:
            return FileResponse(target)
        return FileResponse(FRONTEND_DIST / "index.html")
