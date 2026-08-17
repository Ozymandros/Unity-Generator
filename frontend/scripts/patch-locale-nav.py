"""Add Godot-parity nav keys to all non-English locale files."""

from __future__ import annotations

import re
from pathlib import Path

LOCALES_DIR = Path(__file__).resolve().parents[1] / "src" / "i18n" / "locales"

NEW_NAV_MULTILINE = """
      wizard: "Wizard",
      video: "Video",
      unityMcp: "Unity MCP",
      unityLighting: "Unity Lighting",
      unityCamera: "Unity Camera",
      unityMaterials: "Unity Materials",
      unityAnimations: "Unity Animations","""

NEW_NAV_INLINE = (
    ' wizard: "Wizard", video: "Video", unityMcp: "Unity MCP",'
    ' unityLighting: "Unity Lighting", unityCamera: "Unity Camera",'
    ' unityMaterials: "Unity Materials", unityAnimations: "Unity Animations",'
)


def patch_file(path: Path) -> bool:
    text = path.read_text(encoding="utf-8")
    original = text

    nav_match = re.search(r"nav:\s*\{([^}]*)\}", text, re.DOTALL)
    if not nav_match:
        return False

    nav_body = nav_match.group(1)
    if "wizard:" not in nav_body:
        if "\n" in nav_body:
            text = re.sub(
                r"(audio:\s*[^,\n]+,)(\s*\n\s*unityUi:)",
                r"\1" + NEW_NAV_MULTILINE + r"\2",
                text,
                count=1,
            )
        else:
            text = re.sub(
                r"(audio:\s*[^,]+,)(\s*unityUi:)",
                r"\1" + NEW_NAV_INLINE + r"\2",
                text,
                count=1,
            )

    if "logs:" not in re.search(r"nav:\s*\{([^}]*)\}", text, re.DOTALL).group(1):
        text = re.sub(
            r"(unityProject:\s*[^,\n]+,)(\s*\n\s*\},)",
            r'\1\n      logs: "Logs",\2',
            text,
            count=1,
        )
        text = re.sub(
            r"(unityProject:\s*[^,]+,)(\s*\},)",
            r'\1 logs: "Logs",\2',
            text,
            count=1,
        )

    if text != original:
        path.write_text(text, encoding="utf-8")
        return True
    return False


def main() -> None:
    for path in sorted(LOCALES_DIR.glob("*.ts")):
        if path.name == "en.ts":
            continue
        changed = patch_file(path)
        print(("updated" if changed else "skipped"), path.name)


if __name__ == "__main__":
    main()
