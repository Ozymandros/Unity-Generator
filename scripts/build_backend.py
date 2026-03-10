from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path


def run_command(command: list[str], cwd: Path) -> None:
    subprocess.run(command, cwd=cwd, check=True)


def run_pip_command(command: list[str], cwd: Path) -> None:
    """Run pip command with --break-system-packages flag for Docker/CI environments."""
    subprocess.run(command, cwd=cwd, check=True)


def main() -> int:
    repo_root = Path(__file__).resolve().parent.parent
    backend_dir = repo_root / "backend"

    run_pip_command([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], backend_dir)
    run_pip_command([sys.executable, "-m", "pip", "install", "pyinstaller"], backend_dir)
    run_command(
        [
            sys.executable,
            "-m",
            "PyInstaller",
            "--clean",
            "--onefile",
            "--name",
            "unity-generator-backend",
            "--hidden-import=app",
            "--hidden-import=app.main",
            "--hidden-import=uvicorn.logging",
            "--hidden-import=uvicorn.loops",
            "--hidden-import=uvicorn.loops.auto",
            "--hidden-import=uvicorn.protocols",
            "--hidden-import=uvicorn.protocols.http",
            "--hidden-import=uvicorn.protocols.http.auto",
            "--hidden-import=uvicorn.protocols.websockets",
            "--hidden-import=uvicorn.protocols.websockets.auto",
            "--hidden-import=uvicorn.lifespan",
            "--hidden-import=uvicorn.lifespan.on",
            "app/entrypoint.py",
        ],
        backend_dir,
    )

    dist_dir = backend_dir / "dist"
    expected_binary = dist_dir / (
        "unity-generator-backend.exe" if sys.platform == "win32" else "unity-generator-backend"
    )

    if not expected_binary.exists():
        raise FileNotFoundError(f"Expected backend sidecar not found: {expected_binary}")

    if sys.platform == "win32":
        extensionless_alias = dist_dir / "unity-generator-backend"
        if not extensionless_alias.exists():
            shutil.copy2(expected_binary, extensionless_alias)

    print(f"Backend sidecar built successfully: {expected_binary}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
