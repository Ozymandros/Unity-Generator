import logging
import sqlite3
import json
from typing import Dict, List, Any
from .db import get_all_prefs, set_pref, get_db_path # keep for legacy migration if needed
from ..repositories import (
    get_provider_repo,
    get_model_repo,
    get_api_key_repo,
    get_system_prompt_repo
)
from ..services.providers.capabilities import ProviderCapabilities, Modality

LOGGER = logging.getLogger(__name__)

DEFAULT_SYSTEM_PROMPTS = {
    "code": "You are an expert Unity C# developer. Generate clean, efficient, and well-commented code.",
    "text": "You are a helpful assistant providing concise and accurate information.",
    "image": "You are a creative prompt engineer for image generation AI.",
    "audio": "You are an expert at generating high-quality speech and sound effects.",
    "music": "You are a talented AI composer creating atmospheric game music.",
    "sprite": "You are a skilled pixel artist creating 2D game assets."
}

def seed_database():
    """
    Seed providers, models, keys, and prompts if the database is empty.
    """
    provider_repo = get_provider_repo()
    model_repo = get_model_repo()
    api_key_repo = get_api_key_repo()
    prompt_repo = get_system_prompt_repo()

    # 1. Seed Providers and Models from registry defaults
    existing_providers = provider_repo.get_all()
    if not existing_providers:
        LOGGER.info("Seeding default providers and models...")
        from ..services.providers.registry import _build_default_registry
        default_registry = _build_default_registry()
        
        for caps in default_registry.all_providers():
            provider_repo.save(caps)
            # Default models for this provider? 
            # The registry doesn't store all available models, just defaults.
            # We should probably seed some well-known ones or just use the defaults as a starting point.
            for modality, model_id in caps.default_models.items():
                try:
                    # Use model name as label if we don't have better
                    label = model_id.split("/")[-1].replace("-", " ").title()
                    model_repo.add(caps.name, model_id, label, modality.value)
                except Exception:
                    pass # Probably already exists

    # 2. Seed System Prompts
    existing_prompts = prompt_repo.get_all()
    if not existing_prompts:
        LOGGER.info("Seeding default system prompts...")
        for modality, content in DEFAULT_SYSTEM_PROMPTS.items():
            prompt_repo.save(modality, content)

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
                with open(config_path, "r", encoding="utf-8") as f:
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
    model_repo = get_model_repo()
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
        provider_caps: Dict[str, ProviderCapabilities] = {p.name: p for p in provider_repo.get_all()}
        
        updates = []
        for row_id, provider_name, model_value, current_modality in llm_models:
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
