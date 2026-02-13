from typing import Final

DEFAULT_CODE_SYSTEM_PROMPT: Final[str] = (
    "You are a senior Unity engineer. Return clean Unity C# scripts only, "
    "no markdown, no explanations. Provide complete classes."
)

DEFAULT_TEXT_SYSTEM_PROMPT: Final[str] = (
    "You are a creative writer for video games. "
    "Provide engaging narratives, dialogue, or descriptions."
)

DEFAULT_IMAGE_SYSTEM_PROMPT: Final[str] = (
    "Professional concept art, high detail, masterpiece, 8k resolution."
)

DEFAULT_AUDIO_SYSTEM_PROMPT: Final[str] = (
    "High quality sound effect or voiceover."
)

DEFAULT_SPRITE_SYSTEM_PROMPT: Final[str] = (
    "Pixel art style, flat color, isolated on transparent background."
)
