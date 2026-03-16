import json
import logging
import sqlite3

from ..repositories import get_api_key_repo, get_model_repo, get_provider_repo, get_system_prompt_repo
from ..services.providers.capabilities import Modality, ProviderCapabilities
from .db import get_all_prefs, get_db_path, get_unity_versions, seed_unity_versions

LOGGER = logging.getLogger(__name__)


def _default_providers() -> list[ProviderCapabilities]:
    """Default provider capabilities for initial DB seed. api_key_name = provider name for all."""
    return [
        ProviderCapabilities(
            name="google",
            api_key_name="google",
            modalities={Modality.LLM, Modality.IMAGE, Modality.AUDIO},
            default_models={
                Modality.LLM: "gemini-1.5-flash",
                Modality.IMAGE: "imagen-3.0-generate-002",
                Modality.AUDIO: "google-tts",
            },
            supports_vision=True,
            supports_streaming=True,
            supports_function_calling=True,
            supports_tool_use=True,
            openai_compatible=False,
        ),
        ProviderCapabilities(
            name="anthropic",
            api_key_name="anthropic",
            modalities={Modality.LLM},
            default_models={Modality.LLM: "claude-3-5-sonnet-20240620"},
            supports_vision=True,
            supports_streaming=True,
            supports_function_calling=True,
            supports_tool_use=True,
            openai_compatible=False,
        ),
        ProviderCapabilities(
            name="deepseek",
            api_key_name="deepseek",
            modalities={Modality.LLM},
            default_models={Modality.LLM: "deepseek-chat"},
            base_url="https://api.deepseek.com",
            supports_function_calling=True,
            supports_tool_use=True,
            openai_compatible=True,
        ),
        ProviderCapabilities(
            name="openrouter",
            api_key_name="openrouter",
            modalities={Modality.LLM},
            default_models={Modality.LLM: "openrouter/auto"},
            base_url="https://openrouter.ai/api/v1",
            supports_function_calling=True,
            supports_streaming=True,
            supports_tool_use=True,
            openai_compatible=True,
        ),
        ProviderCapabilities(
            name="openai",
            api_key_name="openai",
            modalities={Modality.LLM, Modality.IMAGE, Modality.AUDIO},
            default_models={
                Modality.LLM: "gpt-4o",
                Modality.IMAGE: "dall-e-3",
                Modality.AUDIO: "tts-1",
            },
            extra={"is_tts": True},
            supports_function_calling=True,
            supports_vision=True,
            supports_json_mode=True,
            supports_streaming=True,
            supports_tool_use=True,
            openai_compatible=True,
        ),
        ProviderCapabilities(
            name="groq",
            api_key_name="groq",
            modalities={Modality.LLM},
            default_models={Modality.LLM: "llama-3.1-8b-instant"},
            base_url="https://api.groq.com/openai/v1",
            supports_function_calling=True,
            supports_streaming=True,
            supports_tool_use=True,
            openai_compatible=True,
        ),
        ProviderCapabilities(
            name="huggingface",
            api_key_name="huggingface",
            modalities={Modality.LLM},
            default_models={Modality.LLM: "google/gemma-2b"},
            base_url="https://router.huggingface.co/v1",
            supports_function_calling=False,
            supports_streaming=True,
            openai_compatible=True,
            requires_api_key=False,
        ),
        ProviderCapabilities(
            name="ollama",
            api_key_name="ollama",
            modalities={Modality.LLM},
            default_models={Modality.LLM: "qwen2.5-coder:latest"},
            base_url="http://localhost:11434/v1",
            supports_function_calling=False,
            supports_streaming=True,
            openai_compatible=True,
            requires_api_key=False,
        ),
        ProviderCapabilities(
            name="stability",
            api_key_name="stability",
            modalities={Modality.IMAGE},
            default_models={Modality.IMAGE: "stable-diffusion-xl-1024-v1-0"},
            openai_compatible=False,
        ),
        ProviderCapabilities(
            name="flux",
            api_key_name="flux",
            modalities={Modality.IMAGE},
            default_models={Modality.IMAGE: "flux-1.1-pro"},
            openai_compatible=False,
        ),
        ProviderCapabilities(
            name="elevenlabs",
            api_key_name="elevenlabs",
            modalities={Modality.AUDIO},
            default_models={Modality.AUDIO: "eleven_multilingual_v2"},
            openai_compatible=False,
            extra={"is_tts": True},
        ),
        ProviderCapabilities(
            name="playht",
            api_key_name="playht",
            modalities={Modality.AUDIO},
            default_models={Modality.AUDIO: "playht-default"},
            openai_compatible=False,
            extra={"is_tts": True},
        ),
        ProviderCapabilities(
            name="replicate",
            api_key_name="replicate",
            modalities={Modality.LLM, Modality.IMAGE, Modality.AUDIO, Modality.MUSIC},
            default_models={
                Modality.LLM: "meta/llama-2-7b",
                Modality.IMAGE: "black-forest-labs/flux-schnell",
                Modality.AUDIO: "facebookresearch/musicgen",
                Modality.MUSIC: "facebookresearch/musicgen",
            },
            openai_compatible=False,
            base_url="https://api.replicate.com/v1",
            supports_function_calling=False,
            supports_streaming=True,
            supports_tool_use=False,
            extra={"is_music": True},
        ),
        ProviderCapabilities(
            name="runway",
            api_key_name="runway",
            modalities={Modality.VIDEO},
            default_models={Modality.VIDEO: "gen-3-alpha"},
            openai_compatible=False,
        ),
        ProviderCapabilities(
            name="pika",
            api_key_name="pika",
            modalities={Modality.VIDEO},
            default_models={Modality.VIDEO: "pika-1.0"},
            openai_compatible=False,
        ),
        ProviderCapabilities(
            name="luma",
            api_key_name="luma",
            modalities={Modality.VIDEO},
            default_models={Modality.VIDEO: "dream-machine"},
            openai_compatible=False,
        ),
    ]


DEFAULT_SYSTEM_PROMPTS = {
    "code": (
        "You are an expert Unity C# developer specialising in indie game development. "
        "Generate clean, efficient, well-commented MonoBehaviour scripts and editor tools. "
        "Follow Unity best practices: use SerializeField, avoid FindObjectOfType in Update, "
        "prefer coroutines over Update for timed logic, and use Unity's built-in physics and input systems. "
        "Return ONLY the C# code — no markdown fences, no explanations."
    ),
    "text": (
        "You are a game writer and narrative designer for indie Unity games. "
        "Write concise, engaging content: UI labels, item descriptions, dialogue lines, tutorial hints, "
        "and lore snippets. Match the tone requested (serious, humorous, dark, whimsical). "
        "Keep output short and game-ready unless a longer format is explicitly requested."
    ),
    "image": (
        "You are a concept art director for indie Unity games. "
        "Generate vivid, specific image prompts optimised for game asset generation. "
        "Describe style (pixel art, stylized 3D, painterly), lighting, palette, and composition. "
        "Favour clean silhouettes and strong readability at small sizes. "
        "Avoid photorealism unless explicitly requested."
    ),
    "audio": (
        "You are a game audio designer for indie Unity projects. "
        "Generate clear, functional sound effect and voice-over prompts. "
        "Describe the sound source, duration, intensity, and any processing (reverb, distortion). "
        "Optimise for Unity AudioSource playback: short, punchy SFX and clean TTS narration."
    ),
    "music": (
        "You are a game music composer for indie Unity projects. "
        "Generate atmospheric, loopable music prompts suited to game contexts "
        "(exploration, combat, menu, cutscene). "
        "Specify tempo, key mood, instrumentation, and loop structure. "
        "Favour dynamic range and emotional clarity over complexity."
    ),
    "sprite": (
        "You are a 2D game artist specialising in Unity sprite assets. "
        "Generate sprite prompts with a clear style (pixel art, vector, hand-drawn), "
        "transparent background, strong silhouette, and consistent scale. "
        "Describe the subject, pose, colour palette, and outline style. "
        "Assets must be immediately usable in a Unity SpriteRenderer."
    ),
    "video": (
        "You are a game cinematic director for indie Unity trailers and cutscenes. "
        "Generate vivid, cinematic video prompts with dynamic camera movement, "
        "dramatic lighting, and clear subject focus. "
        "Keep clips short (3–10 seconds), visually punchy, and suitable for in-engine cutscenes "
        "or promotional trailers."
    ),
    "unity_ui": (
        "You are a senior Unity UI engineer specialising in game UI development. "
        "Generate clean, well-commented, production-ready Unity UI code. "
        "Default to uGUI (Canvas/RectTransform) unless UI Toolkit is explicitly requested. "
        "Use TMP_Text for all text, RectTransform anchors for layout, and follow Unity UI best practices."
    ),
    "unity_physics": (
        "You are a senior Unity physics engineer specialising in game physics configuration. "
        "Generate clean, well-commented, production-ready Unity physics code. "
        "Default to PhysX (built-in) unless DOTS physics is explicitly requested. "
        "Always include Rigidbody setup, appropriate collider selection, and PhysicMaterial configuration."
    ),
}

def seed_database():
    """
    Seed providers, models, keys, and prompts if the database is empty.
    """
    provider_repo = get_provider_repo()
    api_key_repo = get_api_key_repo()
    prompt_repo = get_system_prompt_repo()

    # 1. Seed Providers and Models (default list; api_key_name = provider name for all)
    existing_providers = provider_repo.get_all()
    if not existing_providers:
        LOGGER.info("Seeding default providers and models...")
        for caps in _default_providers():
            provider_repo.save(caps)
            for modality, model_id in caps.default_models.items():
                try:
                    label = model_id.split("/")[-1].replace("-", " ").title()
                    get_model_repo().add(caps.name, model_id, label, modality.value)
                except Exception:
                    pass

    # 2. Seed System Prompts
    existing_prompts = prompt_repo.get_all()
    if not existing_prompts:
        LOGGER.info("Seeding default system prompts...")
        for modality, content in DEFAULT_SYSTEM_PROMPTS.items():
            prompt_repo.save(modality, content)

    # 2b. Seed Unity versions (initial default 6000.3.2f1; user can add more)
    if not get_unity_versions():
        LOGGER.info("Seeding default Unity version 6000.3.2f1...")
        seed_unity_versions([{"value": "6000.3.2f1", "label": "6000.3.2f1"}])

    # 2c. Seed default locale preference if not already set
    from .db import get_pref
    from .db import set_pref as db_set_pref
    if get_pref("preferred_locale") is None:
        LOGGER.info("Seeding default preferred_locale = 'en'...")
        db_set_pref("preferred_locale", "en")

    # 3. Migrate API keys from legacy storage
    existing_keys = api_key_repo.get_all()
    if not existing_keys:
        LOGGER.info("No API keys in new storage. Checking legacy sources...")
        migrated_count = 0

        # Source A: Legacy user_prefs table (where config.py used to store them)
        all_prefs = get_all_prefs()
        for k, v in all_prefs.items():
            if k.endswith("_api_key"):
                service_name = k.replace("_api_key", "")
                if v:
                    api_key_repo.save(service_name, v)
                    migrated_count += 1

        # Source B: Legacy api_keys.json file
        from .config import get_config_dir
        config_path = get_config_dir() / "api_keys.json"
        if config_path.exists():
            try:
                LOGGER.info(f"Found legacy api_keys.json at {config_path}. Migrating...")
                with open(config_path, encoding="utf-8") as f:
                    legacy_data = json.load(f)
                    for k, v in legacy_data.items():
                        if v:
                            # Normalize key name (remove _api_key suffix if present)
                            service_name = k.replace("_api_key", "")
                            # Only save if we haven't already migrated it from Source A
                            if service_name not in api_key_repo.get_all():
                                api_key_repo.save(service_name, v)
                                migrated_count += 1

                # Optionally rename the file to avoid re-migration
                backup_path = config_path.with_suffix(".json.bak")
                if not backup_path.exists():
                    config_path.rename(backup_path)
                    LOGGER.info(f"Renamed legacy file to {backup_path}")
            except Exception as e:
                LOGGER.error(f"Error during legacy JSON migration: {e}")

        if migrated_count > 0:
            LOGGER.info(f"Successfully migrated {migrated_count} API keys to the new database.")

    # 4. Migrate model modalities if needed
    migrate_modalities()

def migrate_modalities():
    """
    Infers and updates modalities for models that are stuck on the default 'llm'.
    """
    provider_repo = get_provider_repo()
    conn = sqlite3.connect(get_db_path())

    try:
        cursor = conn.cursor()
        # Find all models with modality 'llm'
        cursor.execute("SELECT id, provider, model_value, modality FROM provider_models WHERE modality = 'llm'")
        llm_models = cursor.fetchall()

        if not llm_models:
            return

        LOGGER.info(f"Checking {len(llm_models)} models for modality migration...")

        # Cache provider capabilities to avoid repeated repo calls
        provider_caps: dict[str, ProviderCapabilities] = {p.name: p for p in provider_repo.get_all()}

        updates = []
        for row_id, provider_name, model_value, _current_modality in llm_models:
            caps = provider_caps.get(provider_name)
            if not caps:
                continue

            # If the model matches a default for a specific modality, use that
            inferred_modality = None
            for mod, default_id in caps.default_models.items():
                if default_id == model_value:
                    inferred_modality = mod.value
                    break

            # Smart inference: Check keywords in model name if still unknown
            if not inferred_modality:
                name_lower = model_value.lower()
                if any(x in name_lower for x in ["dall-e", "stable-diffusion", "flux", "midjourney"]):
                    inferred_modality = "image"
                elif any(x in name_lower for x in ["tts", "whisper", "elevenlabs", "speech"]):
                    inferred_modality = "audio"
                elif any(x in name_lower for x in ["musicgen", "riffusion", "music"]):
                    inferred_modality = "music"
                elif any(x in name_lower for x in ["video", "sora", "runway"]):
                    inferred_modality = "video"

            if inferred_modality and inferred_modality != "llm":
                updates.append((inferred_modality, row_id))

        if updates:
            LOGGER.info(f"Migrating {len(updates)} models to correct modalities...")
            cursor.executemany("UPDATE provider_models SET modality = ? WHERE id = ?", updates)
            conn.commit()

    except Exception as e:
        LOGGER.error(f"Error during modality migration: {e}")
    finally:
        conn.close()
