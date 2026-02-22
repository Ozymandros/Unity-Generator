import sqlite3
import json
from typing import List, Dict, Optional
from ..core.db import get_db_path
from .base import IProviderRepository, IModelRepository, IApiKeyRepository, ISystemPromptRepository
from ..services.providers.capabilities import ProviderCapabilities, Modality

class SqliteProviderRepository(IProviderRepository):
    def get_all(self) -> List[ProviderCapabilities]:
        conn = sqlite3.connect(get_db_path())
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT name, api_key_name, base_url, openai_compatible, requires_api_key, supports_vision, supports_streaming, supports_function_calling, supports_tool_use, modalities, default_models, extra FROM providers")
            providers = []
            for row in cursor.fetchall():
                providers.append(self._row_to_caps(row))
            return providers
        finally:
            conn.close()

    def get_by_name(self, name: str) -> Optional[ProviderCapabilities]:
        conn = sqlite3.connect(get_db_path())
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT name, api_key_name, base_url, openai_compatible, requires_api_key, supports_vision, supports_streaming, supports_function_calling, supports_tool_use, modalities, default_models, extra FROM providers WHERE name = ?", (name.lower(),))
            row = cursor.fetchone()
            return self._row_to_caps(row) if row else None
        finally:
            conn.close()

    def save(self, capabilities: ProviderCapabilities) -> None:
        conn = sqlite3.connect(get_db_path())
        try:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO providers (name, api_key_name, base_url, openai_compatible, requires_api_key, supports_vision, supports_streaming, supports_function_calling, supports_tool_use, modalities, default_models, extra)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(name) DO UPDATE SET
                    api_key_name = excluded.api_key_name,
                    base_url = excluded.base_url,
                    openai_compatible = excluded.openai_compatible,
                    requires_api_key = excluded.requires_api_key,
                    supports_vision = excluded.supports_vision,
                    supports_streaming = excluded.supports_streaming,
                    supports_function_calling = excluded.supports_function_calling,
                    supports_tool_use = excluded.supports_tool_use,
                    modalities = excluded.modalities,
                    default_models = excluded.default_models,
                    extra = excluded.extra
                """,
                (
                    capabilities.name.lower(),
                    capabilities.api_key_name,
                    capabilities.base_url,
                    1 if capabilities.openai_compatible else 0,
                    1 if capabilities.requires_api_key else 0,
                    1 if capabilities.supports_vision else 0,
                    1 if capabilities.supports_streaming else 0,
                    1 if capabilities.supports_function_calling else 0,
                    1 if capabilities.supports_tool_use else 0,
                    json.dumps([m.value for m in capabilities.modalities]),
                    json.dumps({m.value: model for m, model in capabilities.default_models.items()}),
                    json.dumps(capabilities.extra)
                ),
            )
            conn.commit()
        finally:
            conn.close()

    def delete(self, name: str) -> bool:
        conn = sqlite3.connect(get_db_path())
        try:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM providers WHERE name = ?", (name.lower(),))
            conn.commit()
            return cursor.rowcount > 0
        finally:
            conn.close()

    def _row_to_caps(self, row: tuple) -> ProviderCapabilities:
        modalities_list = json.loads(row[9])
        modalities = {Modality(m) for m in modalities_list}
        
        default_models_dict = json.loads(row[10])
        default_models = {Modality(m): model for m, model in default_models_dict.items()}
        
        return ProviderCapabilities(
            name=row[0],
            api_key_name=row[1],
            base_url=row[2],
            openai_compatible=bool(row[3]),
            requires_api_key=bool(row[4]),
            supports_vision=bool(row[5]),
            supports_streaming=bool(row[6]),
            supports_function_calling=bool(row[7]),
            supports_tool_use=bool(row[8]),
            modalities=modalities,
            default_models=default_models,
            extra=json.loads(row[11]) if row[11] else {}
        )

class SqliteModelRepository(IModelRepository):
    def get_by_provider(self, provider: str) -> List[Dict[str, str]]:
        conn = sqlite3.connect(get_db_path())
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT model_value, model_label, modality FROM provider_models WHERE provider = ?", (provider.lower(),))
            return [{"value": row[0], "label": row[1], "modality": row[2]} for row in cursor.fetchall()]
        finally:
            conn.close()

    def add(self, provider: str, value: str, label: str, modality: str) -> None:
        conn = sqlite3.connect(get_db_path())
        try:
            cursor = conn.cursor()
            cursor.execute("INSERT INTO provider_models (provider, model_value, model_label, modality) VALUES (?, ?, ?, ?)", (provider.lower(), value, label, modality.lower()))
            conn.commit()
        finally:
            conn.close()

    def remove(self, provider: str, value: str) -> bool:
        conn = sqlite3.connect(get_db_path())
        try:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM provider_models WHERE provider = ? AND model_value = ?", (provider.lower(), value))
            conn.commit()
            return cursor.rowcount > 0
        finally:
            conn.close()

class SqliteApiKeyRepository(IApiKeyRepository):
    def get_all(self) -> Dict[str, str]:
        conn = sqlite3.connect(get_db_path())
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT service_name, key_value FROM api_keys")
            return {row[0]: row[1] for row in cursor.fetchall()}
        finally:
            conn.close()

    def get_by_service(self, service_name: str) -> Optional[str]:
        conn = sqlite3.connect(get_db_path())
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT key_value FROM api_keys WHERE service_name = ?", (service_name,))
            row = cursor.fetchone()
            return row[0] if row else None
        finally:
            conn.close()

    def save(self, service_name: str, key_value: str) -> None:
        conn = sqlite3.connect(get_db_path())
        try:
            cursor = conn.cursor()
            cursor.execute("INSERT INTO api_keys (service_name, key_value) VALUES (?, ?) ON CONFLICT(service_name) DO UPDATE SET key_value = excluded.key_value, updated_at = CURRENT_TIMESTAMP", (service_name, key_value))
            conn.commit()
        finally:
            conn.close()

    def delete(self, service_name: str) -> bool:
        conn = sqlite3.connect(get_db_path())
        try:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM api_keys WHERE service_name = ?", (service_name,))
            conn.commit()
            return cursor.rowcount > 0
        finally:
            conn.close()

    def get(self, service_name: str) -> Optional[str]:
        return self.get_by_service(service_name)

class SqliteSystemPromptRepository(ISystemPromptRepository):
    def get_all(self) -> Dict[str, str]:
        conn = sqlite3.connect(get_db_path())
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT modality, content FROM system_prompts")
            return {row[0]: row[1] for row in cursor.fetchall()}
        finally:
            conn.close()

    def get_by_modality(self, modality: str) -> Optional[str]:
        conn = sqlite3.connect(get_db_path())
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT content FROM system_prompts WHERE modality = ?", (modality,))
            row = cursor.fetchone()
            return row[0] if row else None
        finally:
            conn.close()

    def save(self, modality: str, content: str) -> None:
        conn = sqlite3.connect(get_db_path())
        try:
            cursor = conn.cursor()
            cursor.execute("INSERT INTO system_prompts (modality, content) VALUES (?, ?) ON CONFLICT(modality) DO UPDATE SET content = excluded.content, updated_at = CURRENT_TIMESTAMP", (modality, content))
            conn.commit()
        finally:
            conn.close()

    def get(self, modality: str) -> Optional[str]:
        return self.get_by_modality(modality)
