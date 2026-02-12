import logging
from pathlib import Path
from typing import Dict, Any

try:
    from semantic_kernel import Kernel
    from semantic_kernel.core_plugins import (
        TextPlugin,
        TimePlugin,
        MathPlugin,
    )
except Exception:  # pragma: no cover - optional dependency at runtime
    Kernel = None  # type: ignore
    TextPlugin = None  # type: ignore
    TimePlugin = None  # type: ignore
    MathPlugin = None  # type: ignore


LOGGER = logging.getLogger(__name__)


def create_kernel(settings: Dict[str, Any]) -> "Kernel":
    """
    Create and configure a Semantic Kernel instance with all plugins registered.
    
    Registers:
    - Microsoft Core Plugins (TextPlugin, TimePlugin, MathPlugin)
    - Native Plugins (UnityProjectPlugin, ProviderOrchestratorPlugin, MemoryPrefsPlugin)
    - Semantic Functions (UnityCodeExpert prompts)
    
    Args:
        settings: Configuration dictionary for the kernel.
                 Supported keys: unity_version, output_root
    
    Returns:
        Kernel instance configured with all plugins.
    
    Raises:
        RuntimeError: If semantic-kernel is not installed.
    
    Example:
        >>> kernel = create_kernel({"unity_version": "2022.3"})
        >>> # Kernel is ready with all plugins registered
    """
    if Kernel is None:
        raise RuntimeError(
            "semantic-kernel is not installed. Install dependencies before running."
        )
    
    kernel = Kernel()
    
    # Register Microsoft core plugins if available
    try:
        if TextPlugin is not None:
            kernel.add_plugin(TextPlugin(), plugin_name="text")
            LOGGER.debug("Registered TextPlugin")
        
        if TimePlugin is not None:
            kernel.add_plugin(TimePlugin(), plugin_name="time")
            LOGGER.debug("Registered TimePlugin")
        
        if MathPlugin is not None:
            kernel.add_plugin(MathPlugin(), plugin_name="math")
            LOGGER.debug("Registered MathPlugin")
    except Exception as e:
        LOGGER.warning(f"Could not register core plugins: {e}")
    
    # Register Native Plugins
    try:
        from agents.plugins.native import (
            UnityProjectPlugin,
            ProviderOrchestratorPlugin,
            MemoryPrefsPlugin,
        )
        
        # UnityProjectPlugin
        output_root = settings.get("output_root")
        if output_root:
            output_root = Path(output_root)
        unity_project_plugin = UnityProjectPlugin(output_root=output_root)
        kernel.add_plugin(unity_project_plugin, plugin_name="UnityProject")
        LOGGER.debug("Registered UnityProjectPlugin")
        
        # ProviderOrchestratorPlugin
        provider_plugin = ProviderOrchestratorPlugin()
        kernel.add_plugin(provider_plugin, plugin_name="ProviderOrchestrator")
        LOGGER.debug("Registered ProviderOrchestratorPlugin")
        
        # MemoryPrefsPlugin
        memory_plugin = MemoryPrefsPlugin()
        kernel.add_plugin(memory_plugin, plugin_name="MemoryPrefs")
        LOGGER.debug("Registered MemoryPrefsPlugin")
        
    except ImportError as e:
        LOGGER.warning(f"Could not register native plugins: {e}")
    except Exception as e:
        LOGGER.warning(f"Error registering native plugins: {e}")
    
    # Register Semantic Functions (prompts)
    try:
        from .config import get_repo_root
        
        repo_root = get_repo_root()
        semantic_plugins_dir = repo_root / "agents" / "plugins" / "semantic"
        
        if semantic_plugins_dir.exists():
            # Register UnityCodeExpert semantic functions
            unity_code_expert_dir = semantic_plugins_dir / "UnityCodeExpert"
            if unity_code_expert_dir.exists():
                kernel.add_plugin_from_prompt_directory(  # type: ignore
                    parent_directory=str(semantic_plugins_dir),
                    plugin_name="UnityCodeExpert"
                )
                LOGGER.debug("Registered UnityCodeExpert semantic functions")
        
    except Exception as e:
        LOGGER.warning(f"Could not register semantic functions: {e}")
    
    except ImportError:
        pass
    except Exception as e:
        LOGGER.debug(f"Could not register fallback skills: {e}")
    
    LOGGER.info("Semantic Kernel initialized with all plugins.")
    return kernel
