from abc import ABC, abstractmethod
from typing import Any, List, Dict, Optional
from ..services.providers.capabilities import ProviderCapabilities, Modality

class IProviderRepository(ABC):
    @abstractmethod
    def get_all(self) -> List[ProviderCapabilities]:
        pass

    @abstractmethod
    def get_by_name(self, name: str) -> Optional[ProviderCapabilities]:
        pass

    @abstractmethod
    def save(self, capabilities: ProviderCapabilities) -> None:
        pass

    @abstractmethod
    def delete(self, name: str) -> bool:
        pass

class IModelRepository(ABC):
    @abstractmethod
    def get_by_provider(self, provider: str) -> List[Dict[str, str]]:
        pass

    @abstractmethod
    def add(self, provider: str, value: str, label: str) -> None:
        pass

    @abstractmethod
    def remove(self, provider: str, value: str) -> bool:
        pass

class IApiKeyRepository(ABC):
    @abstractmethod
    def get_all(self) -> Dict[str, str]:
        pass

    @abstractmethod
    def get_by_service(self, service_name: str) -> Optional[str]:
        pass

    @abstractmethod
    def save(self, service_name: str, key_value: str) -> None:
        pass

    @abstractmethod
    def delete(self, service_name: str) -> bool:
        pass

    @abstractmethod
    def get(self, service_name: str) -> Optional[str]:
        """Alias for get_by_service."""
        pass

class ISystemPromptRepository(ABC):
    @abstractmethod
    def get_all(self) -> Dict[str, str]:
        pass

    @abstractmethod
    def get_by_modality(self, modality: str) -> Optional[str]:
        pass

    @abstractmethod
    def save(self, modality: str, content: str) -> None:
        pass

    @abstractmethod
    def get(self, modality: str) -> Optional[str]:
        """Alias for get_by_modality."""
        pass
