"""
Entrypoint for PyInstaller-packaged backend executable.

This module runs the FastAPI application using uvicorn when executed as a standalone binary.
PyInstaller packages this as __main__, so we use standard imports without relative paths.
The main process passes PORT via env; this default must match main.js DEFAULT_BACKEND_PORT.
"""
import os

import uvicorn

DEFAULT_PORT = 35421


def _get_port() -> int:
    """Port for uvicorn: PORT env if set and valid, else DEFAULT_PORT."""
    raw = os.environ.get("PORT")
    if not raw:
        return DEFAULT_PORT
    try:
        port = int(raw, 10)
    except ValueError:
        return DEFAULT_PORT
    if port < 1 or port > 65535:
        return DEFAULT_PORT
    return port


def main() -> None:
    """
    Run the FastAPI application with uvicorn.

    The app is imported inside main() to ensure all dependencies are properly loaded
    when running as a PyInstaller bundle.
    """
    from app.main import app

    port = _get_port()
    uvicorn.run(app, host="127.0.0.1", port=port)


if __name__ == "__main__":
    main()
