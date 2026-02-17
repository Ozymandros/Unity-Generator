"""
Unity Engine orchestrator service.

Manages headless Unity batch-mode execution: script injection, process
spawning, log capture/parsing, and cleanup.
"""

import logging
import os
import platform
import re
import shutil
import subprocess
import zipfile
from collections.abc import Callable
from dataclasses import dataclass, field
from pathlib import Path

from jinja2 import Environment, FileSystemLoader

from ..core.constants import DEFAULT_TIMEOUT

LOGGER = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------


@dataclass
class UnityRunResult:
    """Result of a Unity batch-mode execution."""

    success: bool
    exit_code: int
    stdout: str = ""
    stderr: str = ""
    editor_log: str = ""
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)


@dataclass
class FinalizeResult:
    """Result of the full finalize workflow."""

    success: bool
    project_path: str = ""
    zip_path: str = ""
    errors: list[str] = field(default_factory=list)
    logs: list[str] = field(default_factory=list)


# ---------------------------------------------------------------------------
# Error signature patterns in Unity Editor.log
# ---------------------------------------------------------------------------

_ERROR_PATTERNS = [
    re.compile(r"^Compilation failed:", re.MULTILINE),
    re.compile(r"^Assets[\\/].*\.cs\(\d+,\d+\): error CS\d+:", re.MULTILINE),
    re.compile(r"^error CS\d+:", re.MULTILINE),
    re.compile(r"^Fatal Error!", re.MULTILINE),
    re.compile(r"^Aborting batchmode", re.MULTILINE),
    re.compile(r"^Crash!!!", re.MULTILINE),
]

_WARNING_PATTERNS = [
    re.compile(r"^Assets[\\/].*\.cs\(\d+,\d+\): warning CS\d+:", re.MULTILINE),
]


# ---------------------------------------------------------------------------
# Editor.log location helpers
# ---------------------------------------------------------------------------


def _find_editor_log() -> Path | None:
    """
    Return the default Unity Editor.log path for the current platform.

    Returns:
        Path to the Editor.log file, or None if not determinable.
    """
    system = platform.system()
    if system == "Windows":
        local_app = os.environ.get("LOCALAPPDATA", "")
        if local_app:
            path = Path(local_app) / "Unity" / "Editor" / "Editor.log"
            if path.exists():
                return path
    elif system == "Darwin":
        path = Path.home() / "Library" / "Logs" / "Unity" / "Editor.log"
        if path.exists():
            return path
    elif system == "Linux":
        path = Path.home() / ".config" / "unity3d" / "Editor.log"
        if path.exists():
            return path
    return None


def _read_editor_log(log_path: Path | None = None) -> str:
    """
    Read the Unity Editor.log content.

    Args:
        log_path: Explicit path to the log file, or None for auto-detect.

    Returns:
        Log content string, or empty string if not found.
    """
    path = log_path or _find_editor_log()
    if path and path.exists():
        try:
            return path.read_text(encoding="utf-8", errors="replace")
        except OSError as exc:
            LOGGER.warning("Could not read Editor.log at %s: %s", path, exc)
    return ""


# ---------------------------------------------------------------------------
# Log parsing
# ---------------------------------------------------------------------------


def parse_editor_log(log_content: str) -> dict[str, list[str]]:
    """
    Parse Unity Editor.log content for errors and warnings.

    Args:
        log_content: Raw Editor.log text.

    Returns:
        Dictionary with 'errors' and 'warnings' lists.

    Example:
        >>> result = parse_editor_log("Assets/Foo.cs(10,5): error CS1002: ; expected")
        >>> len(result["errors"]) > 0
        True
    """
    errors: list[str] = []
    warnings: list[str] = []

    for line in log_content.splitlines():
        stripped = line.strip()
        if not stripped:
            continue
        for pattern in _ERROR_PATTERNS:
            if pattern.search(stripped):
                errors.append(stripped)
                break
        for pattern in _WARNING_PATTERNS:
            if pattern.search(stripped):
                warnings.append(stripped)
                break

    return {"errors": errors, "warnings": warnings}


# ---------------------------------------------------------------------------
# Template rendering
# ---------------------------------------------------------------------------


def render_template(
    template_name: str,
    context: dict,
    templates_dir: Path | None = None,
) -> str:
    """
    Render a Jinja2 C# template.

    Args:
        template_name: Template filename (e.g. ``AutomatedSetup.cs.j2``).
        context: Jinja2 template variables.
        templates_dir: Optional override for the templates directory.

    Returns:
        Rendered template string.
    """
    if templates_dir is None:
        # Default: backend/templates/unity
        templates_dir = Path(__file__).resolve().parents[3] / "templates" / "unity"

    env = Environment(
        loader=FileSystemLoader(str(templates_dir)),
        keep_trailing_newline=True,
        trim_blocks=True,
        lstrip_blocks=True,
    )
    template = env.get_template(template_name)
    return template.render(**context)


# ---------------------------------------------------------------------------
# Script injection / cleanup
# ---------------------------------------------------------------------------


def inject_editor_scripts(
    project_path: Path,
    scripts: dict[str, str],
) -> Path:
    """
    Inject temporary C# Editor scripts into a Unity project.

    Scripts are placed under ``Assets/Editor/AutoGenerated/`` so Unity
    compiles them only in the Editor context.

    Args:
        project_path: Root path of the Unity project.
        scripts: Mapping of filename to C# source content.

    Returns:
        Path to the injection directory (``Assets/Editor/AutoGenerated``).

    Example:
        >>> inject_dir = inject_editor_scripts(
        ...     Path("/tmp/proj"),
        ...     {"MySetup.cs": "using UnityEditor; ..."}
        ... )
        >>> inject_dir.name
        'AutoGenerated'
    """
    inject_dir = project_path / "Assets" / "Editor" / "AutoGenerated"
    inject_dir.mkdir(parents=True, exist_ok=True)
    for filename, content in scripts.items():
        script_path = inject_dir / filename
        script_path.write_text(content, encoding="utf-8")
        LOGGER.debug("Injected Editor script: %s", script_path)
    return inject_dir


def cleanup_injected_scripts(inject_dir: Path) -> None:
    """
    Remove the injected Editor scripts directory.

    Args:
        inject_dir: Path to the ``Assets/Editor/AutoGenerated`` directory.
    """
    if inject_dir.exists() and inject_dir.is_dir():
        shutil.rmtree(inject_dir, ignore_errors=True)
        LOGGER.debug("Cleaned up injected scripts at %s", inject_dir)
        # Also clean up the parent .meta if it exists
        meta = inject_dir.with_suffix(inject_dir.suffix + ".meta")
        if meta.exists():
            meta.unlink(missing_ok=True)


# ---------------------------------------------------------------------------
# Unity batch-mode runner
# ---------------------------------------------------------------------------


def run_unity_batch(
    unity_path: Path,
    project_path: Path,
    execute_method: str = "ProjectInitializer.Setup",
    extra_args: list[str] | None = None,
    timeout: int = DEFAULT_TIMEOUT,
    log_path: Path | None = None,
) -> UnityRunResult:
    """
    Launch Unity in headless batch mode and capture the result.

    Args:
        unity_path: Path to the Unity Editor executable.
        project_path: Root path of the Unity project.
        execute_method: Static method to invoke via ``-executeMethod``.
        extra_args: Additional CLI arguments for Unity.
        timeout: Maximum seconds to wait for Unity to exit.
        log_path: Optional override for the Editor.log path.

    Returns:
        UnityRunResult with exit code, output, and parsed errors.

    Example:
        >>> result = run_unity_batch(
        ...     Path("C:/Unity/Editor/Unity.exe"),
        ...     Path("C:/Projects/MyUnityProject"),
        ... )
        >>> isinstance(result.exit_code, int)
        True
    """
    cmd = [
        str(unity_path),
        "-batchmode",
        "-nographics",
        "-quit",
        "-projectPath",
        str(project_path),
        "-executeMethod",
        execute_method,
    ]
    if extra_args:
        cmd.extend(extra_args)

    LOGGER.info("Running Unity batch: %s", " ".join(cmd))

    try:
        proc = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout,
            cwd=str(project_path),
        )
        exit_code = proc.returncode
        stdout = proc.stdout or ""
        stderr = proc.stderr or ""
    except subprocess.TimeoutExpired:
        LOGGER.error("Unity batch timed out after %ds", timeout)
        return UnityRunResult(
            success=False,
            exit_code=-1,
            stderr=f"Unity batch timed out after {timeout}s",
            errors=[f"Process timed out after {timeout} seconds"],
        )
    except FileNotFoundError:
        LOGGER.error("Unity executable not found: %s", unity_path)
        return UnityRunResult(
            success=False,
            exit_code=-1,
            stderr=f"Unity not found at {unity_path}",
            errors=[f"Unity Editor executable not found: {unity_path}"],
        )

    # Read and parse Editor.log
    editor_log = _read_editor_log(log_path)
    parsed = parse_editor_log(editor_log)

    success = exit_code == 0 and len(parsed["errors"]) == 0

    return UnityRunResult(
        success=success,
        exit_code=exit_code,
        stdout=stdout,
        stderr=stderr,
        editor_log=editor_log[-5000:] if len(editor_log) > 5000 else editor_log,
        errors=parsed["errors"],
        warnings=parsed["warnings"],
    )


# ---------------------------------------------------------------------------
# Project zipping
# ---------------------------------------------------------------------------


def zip_project(project_path: Path, output_path: Path | None = None) -> Path:
    """
    Create a zip archive of a Unity project directory.

    Args:
        project_path: Root path of the Unity project.
        output_path: Optional destination zip path. Defaults to
                     ``<project_path>.zip``.

    Returns:
        Path to the created zip file.
    """
    if output_path is None:
        output_path = project_path.with_suffix(".zip")

    LOGGER.info("Zipping project %s -> %s", project_path, output_path)

    with zipfile.ZipFile(output_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for file in project_path.rglob("*"):
            if file.is_file():
                arcname = file.relative_to(project_path.parent)
                zf.write(file, arcname)

    return output_path


# ---------------------------------------------------------------------------
# High-level finalize orchestration
# ---------------------------------------------------------------------------


def run_finalize_job(
    project_path: Path,
    unity_path: Path,
    templates_dir: Path,
    *,
    install_packages: bool = False,
    generate_scene: bool = False,
    setup_urp: bool = False,
    packages: list[str] | None = None,
    scene_name: str = "MainScene",
    timeout: int = DEFAULT_TIMEOUT,
    on_progress: Callable[[str, int, str], None] | None = None,
) -> FinalizeResult:
    """
    Run the full finalize workflow on an existing scaffolded Unity project.

    Steps:
    1. Render and inject Editor automation scripts.
    2. Execute Unity in batch mode via ``-executeMethod``.
    3. Parse logs and collect errors.
    4. Cleanup injected scripts.
    5. Zip the project for download.

    Args:
        project_path: Root of the scaffolded Unity project.
        unity_path: Path to the Unity Editor executable.
        templates_dir: Path to the Jinja2 template directory.
        install_packages: Whether to install UPM packages.
        generate_scene: Whether to generate a default scene.
        setup_urp: Whether to set up Universal Render Pipeline.
        packages: List of UPM package identifiers to install.
        scene_name: Name of the scene to create.
        timeout: Batch-mode timeout in seconds.
        on_progress: Optional callback ``(step: str, progress: int, log: str) -> None``.

    Returns:
        FinalizeResult with paths and any errors.
    """
    logs: list[str] = []
    errors: list[str] = []

    def _progress(step: str, pct: int, msg: str) -> None:
        logs.append(f"[{step}] {msg}")
        if on_progress:
            on_progress(step, pct, msg)

    inject_dir: Path | None = None

    try:
        # Step 1: Render templates
        _progress("render", 10, "Rendering Editor automation scripts...")
        scripts: dict[str, str] = {}

        template_context = {
            "install_packages": install_packages,
            "generate_scene": generate_scene,
            "setup_urp": setup_urp,
            "packages": packages or [],
            "scene_name": scene_name,
        }

        # Always include the main setup entrypoint
        scripts["AutomatedSetup.cs"] = render_template("AutomatedSetup.cs.j2", template_context, templates_dir)

        if install_packages and packages:
            scripts["PackageSetup.cs"] = render_template("PackageSetup.cs.j2", template_context, templates_dir)

        if generate_scene:
            scripts["ScenePrefabSetup.cs"] = render_template("ScenePrefabSetup.cs.j2", template_context, templates_dir)

        if setup_urp:
            scripts["ProjectSettingsSetup.cs"] = render_template(
                "ProjectSettingsSetup.cs.j2", template_context, templates_dir
            )

        # Always include import validation
        scripts["ImportValidation.cs"] = render_template("ImportValidation.cs.j2", template_context, templates_dir)

        # Step 2: Inject scripts
        _progress("inject", 20, "Injecting Editor scripts into project...")
        inject_dir = inject_editor_scripts(project_path, scripts)

        # Step 3: Run Unity batch
        _progress("unity_run", 30, "Launching Unity in batch mode...")
        unity_result = run_unity_batch(
            unity_path=unity_path,
            project_path=project_path,
            execute_method="AutoGenerated.ProjectInitializer.Setup",
            timeout=timeout,
        )

        _progress("unity_run", 70, f"Unity exited with code {unity_result.exit_code}")

        if unity_result.stdout:
            logs.append(f"[stdout] {unity_result.stdout[:2000]}")
        if unity_result.stderr:
            logs.append(f"[stderr] {unity_result.stderr[:2000]}")

        if not unity_result.success:
            errors.extend(unity_result.errors)
            if not errors:
                errors.append(f"Unity batch failed with exit code {unity_result.exit_code}")
            _progress("parse", 80, f"Found {len(errors)} error(s)")
            return FinalizeResult(
                success=False,
                project_path=str(project_path),
                errors=errors,
                logs=logs,
            )

        if unity_result.warnings:
            for w in unity_result.warnings[:20]:
                logs.append(f"[warning] {w}")

        _progress("parse", 80, "Unity batch completed successfully")

        # Step 4 is in the finally block (cleanup)

        # Step 5: Zip
        _progress("zip", 90, "Zipping project for download...")
        zip_path = zip_project(project_path)

        _progress("done", 100, "Finalization complete")

        return FinalizeResult(
            success=True,
            project_path=str(project_path),
            zip_path=str(zip_path),
            errors=errors,
            logs=logs,
        )

    except Exception as exc:
        LOGGER.exception("Finalize job failed unexpectedly")
        errors.append(f"Unexpected error: {exc}")
        return FinalizeResult(
            success=False,
            project_path=str(project_path),
            errors=errors,
            logs=logs,
        )

    finally:
        # Always cleanup injected scripts
        if inject_dir:
            try:
                cleanup_injected_scripts(inject_dir)
                logs.append("[cleanup] Removed injected Editor scripts")
            except Exception as exc:
                LOGGER.warning("Cleanup failed: %s", exc)
                logs.append(f"[cleanup] Warning: {exc}")

