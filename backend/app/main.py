"""
Main FastAPI application for the Unity Generator backend.

This module defines the API application and includes routers for various features.
"""

import logging
import os
from typing import Any

from app.core.config import get_logs_dir
from app.core.logging import setup_logging

setup_logging(get_logs_dir())

# Configure logging early: root logger so all app loggers (e.g. app.agents.unity_agent) emit
_root = logging.getLogger()
_root.setLevel(logging.INFO)
if not _root.handlers:
    _handler = logging.StreamHandler()
    _handler.setFormatter(logging.Formatter("[%(asctime)s] %(levelname)s %(name)s: %(message)s"))
    _root.addHandler(_handler)

logger = logging.getLogger("unity_generator")
logger.setLevel(logging.INFO)
logger.propagate = True

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.db import init_db
from app.routers import config, finalize, generation, prefs, projects, scenes

# Import singleton for compatibility if tests rely on app.main.agent_manager

# Initialize database
logger.info("Initializing database...")
init_db()

from app.core.seeder import seed_database

seed_database()

from app.services.providers.registry import provider_registry

provider_registry.load_from_db()
logger.info("Database initialized, seeded, and registry loaded.")

# FastAPI app instance
app = FastAPI()
logger.info("FastAPI app instance created.")

# CORS: The port is configured via PORT env var (from entrypoint.py DEFAULT_PORT = 35421).
# This ensures CORS allows the backend's own origin regardless of what port it runs on.
_default_port = "35421"
_backend_port = os.environ.get("PORT", _default_port)

_cors_origins: list[str] = [
    # Vite dev server
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    # Backend's own origin (matches the port it's actually running on)
    f"http://localhost:{_backend_port}",
    f"http://127.0.0.1:{_backend_port}",
    # Electron file:// origin
    "null",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


if os.environ.get("DEBUG_SYS") == "1":
    @app.get("/debug/sys")
    def debug_sys() -> dict[str, Any]:
        """
        Debug-only endpoint. Enabled only when DEBUG_SYS=1.

        Returns:
            dict[str, Any]: Process/runtime diagnostics (no secrets).
        """
        import sys
        return {
            "sys_path": sys.path,
            "cwd": os.getcwd(),
            "executable": sys.executable,
            "modules_app": [k for k in sys.modules if k.startswith("app")],
            "env": {k: v for k, v in os.environ.items() if "KEY" not in k and "TOKEN" not in k},
        }


@app.get("/health")
def health() -> dict[str, Any]:
    """
    Health check endpoint for the Unity Generator backend.

    Returns:
        dict[str, Any]: Status and a hint that management routes (e.g. system-prompts reset) are available.
    """
    return {"status": "ok", "management": True}


from app.routers import management, unity_versions

# Include routers
logger.info("Including routers...")
app.include_router(generation.router)
app.include_router(config.router)
app.include_router(prefs.router)
app.include_router(projects.router)
app.include_router(scenes.router)
app.include_router(finalize.router)
app.include_router(management.router)
app.include_router(unity_versions.router)
