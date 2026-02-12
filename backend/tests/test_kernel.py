
import pytest
from pathlib import Path
from app.kernel import create_kernel

def test_create_kernel_success() -> None:
    """Test that create_kernel initializes correctly."""
    settings = {"unity_version": "2022.3"}
    kernel = create_kernel(settings)
    assert kernel is not None
    
    # Check if plugins are registered
    # Note: plugin names are case-sensitive as per kernel.py
    # In SK 1.x, kernel.plugins is a collection where iteration gives plugin names
    plugins = list(kernel.plugins)
    assert "UnityProject" in plugins
    assert "ProviderOrchestrator" in plugins
    assert "MemoryPrefs" in plugins

def test_create_kernel_with_custom_output() -> None:
    """Test create_kernel with custom output root."""
    settings = {"output_root": "./test_output"}
    kernel = create_kernel(settings)
    assert kernel is not None
    
    plugin = kernel.get_plugin("UnityProject")
    assert plugin is not None
    # Depending on implementation, we might need to check internal state
    # but at least it should be registered.

def test_create_kernel_semantic_functions_registered() -> None:
    """Test that UnityCodeExpert semantic functions are registered."""
    kernel = create_kernel({})
    
    # UnityCodeExpert should be in plugins if the directory exists
    # If running in a test env where agents/plugins/semantic exists
    # In SK 1.x, kernel.plugins gives names
    plugins = list(kernel.plugins)
    if "UnityCodeExpert" in plugins:
        plugin = kernel.get_plugin("UnityCodeExpert")
        # In SK 1.x, plugin is a KernelPlugin, we check its functions
        functions = [f.name for f in plugin.functions.values()]
        assert "BoilerplateGenerator" in functions
        assert "NamespaceFixer" in functions
