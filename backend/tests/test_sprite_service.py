import base64
import io
from unittest.mock import MagicMock, patch

from PIL import Image

from app.schemas import AgentResult
from app.services.sprite_service import generate_sprite, process_pixel_art


def test_process_pixel_art_resizing() -> None:
    # Create a 100x100 red square image
    img = Image.new("RGBA", (100, 100), (255, 0, 0, 255))

    # Process with 32x32 target
    processed = process_pixel_art(img, 32, {"palette_size": None, "auto_crop": False})

    assert processed.size == (32, 32)
    assert processed.getpixel((0, 0)) == (255, 0, 0, 255)


def test_process_pixel_art_quantization() -> None:
    # Create a gradient image with many colors
    img = Image.new("RGBA", (64, 64))
    for x in range(64):
        for y in range(64):
            img.putpixel((x, y), (x * 4, y * 4, 100, 255))

    # Process with 8 colors
    processed = process_pixel_art(img, 64, {"palette_size": 8, "auto_crop": False})

    # Check number of colors in RGB part
    colors = processed.convert("RGB").getcolors()
    assert colors is not None and len(colors) <= 8


def test_process_pixel_art_autocrop() -> None:
    # Create a 64x64 image with a 10x10 red square in the middle
    img = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
    for x in range(27, 37):
        for y in range(27, 37):
            img.putpixel((x, y), (255, 0, 0, 255))

    # Process with autocrop
    processed = process_pixel_art(img, 64, {"palette_size": None, "auto_crop": True})

    # The image should be cropped to the 10x10 area (after resizing)
    # Since we resize to 64 first (no change), it should be 10x10
    assert processed.size == (10, 10)


@patch("app.services.sprite_service.generate_image")
def test_generate_sprite_workflow(
    mock_gen_image: MagicMock
) -> None:
    from app.repositories import get_api_key_repo
    repo = get_api_key_repo()

    with patch.object(repo, "get_all", return_value={"openai": "test"}):
        # Create a fake response image
        img = Image.new("RGBA", (1024, 1024), (0, 255, 0, 255))
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")

        mock_gen_image.return_value = AgentResult(image=img_str, provider="openai")

        result = generate_sprite(
            prompt="A green square",
            provider="openai",
            api_key=None,
            resolution=16,
            options={"palette_size": 16, "auto_crop": False},
        )

        assert result.raw is not None
        assert result.raw["resolution"] == 16
        assert result.image is not None and len(result.image) > 100
        # Decode result image and check size
        if result.image is not None:
            res_img = Image.open(io.BytesIO(base64.b64decode(result.image)))
            assert res_img.size == (16, 16)


@patch("app.services.sprite_service.unity_mcp_plugin_available_for_writing", return_value=True)
@patch("app.services.sprite_service.generate_image")
def test_generate_sprite_skips_save_when_mcp_live(
    mock_gen_image: MagicMock, mock_mcp_available: MagicMock, tmp_path
) -> None:
    """When MCP is live, sprite is not written to disk (no saved_path in result)."""
    from app.repositories import get_api_key_repo

    (tmp_path / "Assets").mkdir()
    img = Image.new("RGBA", (64, 64), (0, 255, 0, 255))
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
    mock_gen_image.return_value = AgentResult(image=img_str, provider="openai")

    with patch.object(get_api_key_repo(), "get_all", return_value={"openai": "test"}):
        result = generate_sprite(
            prompt="A green square",
            provider="openai",
            api_key=None,
            resolution=16,
            options={"palette_size": 16, "auto_crop": False},
            project_path=str(tmp_path),
        )

    mock_mcp_available.assert_called_once()
    assert "saved_path" not in (result.raw or {})
    assert not list((tmp_path / "Assets").rglob("*.png"))
