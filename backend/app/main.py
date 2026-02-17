import os
import sys
from fastapi import FastAPI
from .core.db import init_db, get_pref, set_pref
from .core.config import get_repo_root, resolve_unity_editor_path
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from .routers import config, finalize, generation, prefs, projects, scenes
from .services import agent_manager_instance as agent_manager, finalize_store_instance as finalize_store

# Add project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../")))

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize the database
    init_db()
    yield
    # Shutdown logic (none required yet)

app = FastAPI(
    title="Unity Content Generator API",
    description="Backend for generating Unity scenes, code, images, and audio via AI agents.",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if os.getenv("ENV") == "dev" else [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_origin_regex="http://(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include modular routers
app.include_router(generation.router)
app.include_router(scenes.router)
app.include_router(config.router)
app.include_router(prefs.router)
app.include_router(projects.router)
app.include_router(finalize.router)

@app.get("/health")
def health_check():
    return {"status": "ok"}
