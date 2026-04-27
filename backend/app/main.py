from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from app.api.routes import auth, comments, files, notifications, requests, users
from app.core.config import settings
from app.db.database import engine

app = FastAPI(title="RepairFlow API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.frontend_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(requests.router)
app.include_router(comments.router)
app.include_router(files.router)
app.include_router(notifications.router)
app.include_router(users.router)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.get("/health")
async def health_check():
    try:
        async with engine.connect() as connection:
            await connection.execute(text("select 1"))
    except Exception:
        return {"status": "degraded", "database": "unavailable"}

    return {"status": "ok", "database": "connected"}
