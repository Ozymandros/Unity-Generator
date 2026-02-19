"""
Main FastAPI application for the Unity Generator backend.

This module defines the API application and includes routers for various features.
"""

import logging
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.db import init_db
from app.routers import config, finalize, generation, prefs, projects, scenes

# Import singleton for compatibility if tests rely on app.main.agent_manager

# Initialize database
init_db()

# FastAPI app instance
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "tauri://localhost",
        "http://tauri.localhost",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, Any]:
    """
    Health check endpoint for the Unity Generator backend.

    Returns:
        dict[str, Any]: A simple status dictionary indicating the service is running.
    """
    return {"status": "ok"}


# Include routers
app.include_router(generation.router)
app.include_router(config.router)
app.include_router(prefs.router)
app.include_router(projects.router)
app.include_router(scenes.router)
app.include_router(finalize.router)

# Configure logging
logging.basicConfig(level=logging.INFO)
logging.getLogger("uvicorn.error").setLevel(logging.INFO)
