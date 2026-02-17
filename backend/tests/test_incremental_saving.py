
import pytest

from app.asset_saver import save_asset_to_project
from app.schemas import AgentResult


@pytest.fixture
def temp_project(tmp_path):
    project_dir = tmp_path / "TestProject"
    project_dir.mkdir()
    (project_dir / "Assets").mkdir()
    return project_dir


def test_save_code_asset(temp_project):
    result = AgentResult(
        content="using UnityEngine;\npublic class Test : MonoBehaviour {}",
        provider="openai",
        raw={"filename": "TestScript.cs"},
    )
    save_asset_to_project(str(temp_project), "code", result)

    script_path = temp_project / "Assets" / "Scripts" / "TestScript.cs"
    meta_path = temp_project / "Assets" / "Scripts" / "TestScript.cs.meta"

    assert script_path.exists()
    assert meta_path.exists()
    assert "MonoImporter" in meta_path.read_text()


def test_save_text_asset(temp_project):
    result = AgentResult(content="Some game story text", provider="openai", raw={"filename": "Story.txt"})
    save_asset_to_project(str(temp_project), "text", result)

    text_path = temp_project / "Assets" / "Text" / "Story.txt"
    meta_path = temp_project / "Assets" / "Text" / "Story.txt.meta"

    assert text_path.exists()
    assert meta_path.exists()


def test_save_image_asset(temp_project):
    # Mocking b64 image data
    img_b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
    result = AgentResult(image=img_b64, provider="stability", raw={"filename": "Icon.png"})
    save_asset_to_project(str(temp_project), "image", result)

    img_path = temp_project / "Assets" / "Sprites" / "Icon.png"
    meta_path = temp_project / "Assets" / "Sprites" / "Icon.png.meta"

    assert img_path.exists()
    assert meta_path.exists()
    assert "TextureImporter" in meta_path.read_text()


def test_save_audio_asset(temp_project):
    # Mocking b64 audio data
    audio_b64 = "SUQzBAAAAAAAF1RTU0UAAAANAAADRmx1eHRyYWNrZXIAAA=="
    result = AgentResult(audio=audio_b64, provider="elevenlabs", raw={"filename": "Jump.mp3"})
    save_asset_to_project(str(temp_project), "audio", result)

    audio_path = temp_project / "Assets" / "Audio" / "Jump.mp3"
    meta_path = temp_project / "Assets" / "Audio" / "Jump.mp3.meta"

    assert audio_path.exists()
    assert meta_path.exists()
    assert "AudioImporter" in meta_path.read_text()


if __name__ == "__main__":
    import pytest

    pytest.main([__file__])
