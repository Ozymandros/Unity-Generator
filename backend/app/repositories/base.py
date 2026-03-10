from abc import ABC, abstractmethod

from ..services.providers.capabilities import ProviderCapabilities


class IProviderRepository(ABC):
    @abstractmethod
    def get_all(self) -> list[ProviderCapabilities]:
        pass

    @abstractmethod
    def get_by_name(self, name: str) -> ProviderCapabilities | None:
        pass

    @abstractmethod
    def save(self, capabilities: ProviderCapabilities) -> None:
        pass

    @abstractmethod
    def delete(self, name: str) -> bool:
        pass

class IModelRepository(ABC):
    @abstractmethod
    def get_by_provider(self, provider: str) -> list[dict[str, str]]:
        pass

    @abstractmethod
    def add(self, provider: str, value: str, label: str, modality: str) -> None:
        pass

    @abstractmethod
    def remove(self, provider: str, value: str) -> bool:
        pass

class IApiKeyRepository(ABC):
    @abstractmethod
    def get_all(self) -> dict[str, str]:
        pass

    @abstractmethod
    def get_by_service(self, service_name: str) -> str | None:
        pass

    @abstractmethod
    def save(self, service_name: str, key_value: str) -> None:
        pass

    @abstractmethod
    def delete(self, service_name: str) -> bool:
        pass

    @abstractmethod
    def get(self, service_name: str) -> str | None:
        """Alias for get_by_service."""
        pass

class ISystemPromptRepository(ABC):
    @abstractmethod
    def get_all(self) -> dict[str, str]:
        pass

    @abstractmethod
    def get_by_modality(self, modality: str) -> str | None:
        pass

    @abstractmethod
    def save(self, modality: str, content: str) -> None:
        pass

    @abstractmethod
    def get(self, modality: str) -> str | None:
        """Alias for get_by_modality."""
        pass
