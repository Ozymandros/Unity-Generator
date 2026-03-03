from typing import Any, Protocol, runtime_checkable

from ..schemas import AgentResult


@runtime_checkable
class SyncAgent(Protocol):
    """Protocol for synchronous generation agents."""

    def run(
        self,
        prompt: str,
        provider: str | None,
        options: dict[str, Any] | Any,
        api_keys: dict[str, str],
        system_prompt: str | None = None,
    ) -> AgentResult | dict[str, Any]:
        ...


@runtime_checkable
class AsyncAgent(Protocol):
    """Protocol for asynchronous generation agents."""

    async def run(
        self,
        prompt: str,
        provider: str | None,
        options: dict[str, Any] | Any,
        api_keys: dict[str, str],
        system_prompt: str | None = None,
        project_path: str | None = None,
    ) -> dict[str, Any] | AgentResult:
        ...
