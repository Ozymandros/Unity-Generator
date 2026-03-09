"""
Entrypoint for PyInstaller-packaged backend executable.

This module runs the FastAPI application using uvicorn when executed as a standalone binary.
PyInstaller packages this as __main__, so we use standard imports without relative paths.
"""
import uvicorn


def main() -> None:
    """
    Run the FastAPI application with uvicorn.
    
    The app is imported inside main() to ensure all dependencies are properly loaded
    when running as a PyInstaller bundle.
    """
    from app.main import app
    
    uvicorn.run(app, host="127.0.0.1", port=8000)


if __name__ == "__main__":
    main()
