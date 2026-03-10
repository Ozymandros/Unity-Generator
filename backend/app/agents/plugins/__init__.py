"""
Semantic Kernel Plugins for Unity Generator.

This module contains both Native Plugins (Python logic) and Semantic Functions (AI prompts).
"""

# Export Native Plugins
try:
    from .native.memory_prefs_plugin import MemoryPrefsPlugin
    from .native.provider_orchestrator_plugin import ProviderOrchestratorPlugin
    from .native.unity_project_plugin import UnityProjectPlugin

    __all__ = [
        "UnityProjectPlugin",
        "ProviderOrchestratorPlugin",
        "MemoryPrefsPlugin",
    ]
except ImportError:
    __all__ = []
