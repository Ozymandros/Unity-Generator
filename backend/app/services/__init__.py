from .agent_manager import AgentManager
from .agent_manager import agent_manager as _agent_manager_singleton
from .finalize_store import FinalizeStore
from .finalize_store import finalize_store as _finalize_store_singleton
from .unity_project import create_unity_project, get_latest_project_path

# Shared instances for centralized management
# We use names that don't conflict with module names
agent_manager_instance = _agent_manager_singleton
finalize_store_instance = _finalize_store_singleton

__all__ = [
    "AgentManager",
    "FinalizeStore",
    "create_unity_project",
    "get_latest_project_path",
    "agent_manager_instance",
    "finalize_store_instance",
]
