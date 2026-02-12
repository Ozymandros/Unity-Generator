from pathlib import Path
from tempfile import TemporaryDirectory
from typing import Any

import pytest
from agents.plugins.native.memory_prefs_plugin import MemoryPrefsPlugin
from agents.plugins.native.unity_project_plugin import UnityProjectPlugin


class TestUnityProjectPlugin:
    def test_create_folder_structure(self) -> None:
        with TemporaryDirectory() as tmpdir:
            plugin = UnityProjectPlugin(output_root=Path(tmpdir))
            project_path = plugin.create_folder_structure("TestProject")

            assert Path(project_path).exists()
            assert Path(project_path).name == "TestProject"
            assert (Path(project_path) / "Assets" / "Scripts").exists()
            assert (Path(project_path) / "Assets" / "Textures").exists()
            assert (Path(project_path) / "Assets" / "Scripts.meta").exists()

    def test_write_csharp_script(self) -> None:
        with TemporaryDirectory() as tmpdir:
            plugin = UnityProjectPlugin(output_root=Path(tmpdir))
            project_path = plugin.create_folder_structure("TestProject")

            script_path = plugin.write_csharp_script(
                project_path,
                "PlayerController",
                "public class PlayerController : MonoBehaviour {}",
            )

            assert Path(script_path).exists()
            assert "PlayerController.cs" in script_path
            assert (Path(script_path).parent / "PlayerController.cs.meta").exists()

    def test_write_script_security_traversal(self) -> None:
        with TemporaryDirectory() as tmpdir:
            plugin = UnityProjectPlugin(output_root=Path(tmpdir))
            project_path = plugin.create_folder_structure("TestProject")

            with pytest.raises(ValueError, match="escape"):
                # Use traversal in relative_path which is NOT cleaned
                plugin.write_csharp_script(
                    project_path,
                    "NormalScript",
                    "void main() {}",
                    relative_path="../../../../../../../../../../..",
                )


class TestMemoryPrefsPlugin:
    @pytest.fixture
    def mock_db(self, monkeypatch: pytest.MonkeyPatch) -> dict[str, str]:
        # Mock database calls for MemoryPrefsPlugin
        prefs = {"preferred_llm_provider": "openai", "unity_version": "2022.3"}

        def mock_get_pref(key: str) -> Any:
            return prefs.get(key)

        def mock_set_pref(key: str, value: Any) -> None:
            prefs[key] = value

        monkeypatch.setattr(
            "agents.plugins.native.memory_prefs_plugin.get_pref", mock_get_pref
        )
        monkeypatch.setattr(
            "agents.plugins.native.memory_prefs_plugin.set_pref", mock_set_pref
        )
        return prefs

    def test_get_user_preference(self, mock_db: dict[str, str]) -> None:
        plugin = MemoryPrefsPlugin()
        assert plugin.get_user_preference("preferred_llm_provider") == "openai"
        assert plugin.get_user_preference("missing") is None

    def test_set_user_preference(self, mock_db: dict[str, str]) -> None:
        plugin = MemoryPrefsPlugin()
        plugin.set_user_preference("test_key", "test_value")
        assert mock_db["test_key"] == "test_value"

    def test_convenience_methods(self, mock_db: dict[str, str]) -> None:
        plugin = MemoryPrefsPlugin()
        assert plugin.get_preferred_provider("llm") == "openai"
        assert plugin.get_unity_version() == "2022.3"
