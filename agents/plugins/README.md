# Semantic Kernel Plugins - Unity Generator

This directory contains Semantic Kernel plugins divided into **Native Functions** (Python logic) and **Semantic Functions** (AI prompts).

## Architecture

```
agents/plugins/
├── native/              # Native Plugins (Python logic)
│   ├── unity_project_plugin.py
│   ├── provider_orchestrator_plugin.py
│   └── memory_prefs_plugin.py
└── semantic/            # Semantic Functions (IA prompts)
    └── UnityCodeExpert/
        ├── BoilerplateGenerator/
        ├── NamespaceFixer/
        └── ShaderSuggester/
```

## Native Plugins

### UnityProjectPlugin

Manages Unity project structure and file operations.

**Functions:**
- `create_folder_structure`: Generates `Assets/Scripts`, `Assets/Textures`, etc.
- `generate_meta_file`: Creates Unity `.meta` files to avoid import errors.
- `write_csharp_script`: Writes C# code to `GeneratedScript.cs` using `pathlib.Path`.

**Usage:**
```python
from agents.plugins.native import UnityProjectPlugin

plugin = UnityProjectPlugin()
project_path = plugin.create_folder_structure("MyGame")
script_path = plugin.write_csharp_script(
    project_path, 
    "PlayerMovement", 
    "public class PlayerMovement : MonoBehaviour {}"
)
```

### ProviderOrchestratorPlugin

Acts as a bridge between agents and AI providers.

**Functions:**
- `get_best_provider`: Checks `config/api_keys.json` and selects the provider with an available key according to priority.
- `validate_response`: Normalizes responses from different APIs to the `GenerationResponse` format.

**Usage:**
```python
from agents.plugins.native import ProviderOrchestratorPlugin

plugin = ProviderOrchestratorPlugin()
provider = plugin.get_best_provider("llm", preferred_provider="openai")
normalized = plugin.validate_response(provider, raw_response, "llm")
```

### MemoryPrefsPlugin

Manages user preferences stored in SQLite.

**Functions:**
- `get_user_preference`: Queries a preference from the database.
- `set_user_preference`: Updates a preference.
- `get_preferred_provider`: Gets the preferred provider by type.
- `get_unity_version`: Gets the preferred Unity version.

**Usage:**
```python
from agents.plugins.native import MemoryPrefsPlugin

plugin = MemoryPrefsPlugin()
provider = plugin.get_preferred_provider("llm")
plugin.set_user_preference("preferred_llm_provider", "openai")
version = plugin.get_unity_version()
```

## Semantic Functions

### UnityCodeExpert

Contains specialized prompts for Unity code generation.

#### BoilerplateGenerator

Generates the basic structure of a MonoBehaviour with `Start()` and `Update()`.

#### NamespaceFixer

Ensures that the class name matches the file name (critical Unity constraint).

#### ShaderSuggester

Generates HLSL code for Shaders when the user's prompt requires it.

**Usage:**
```python
from semantic_kernel import Kernel

kernel = Kernel()
unity_plugin = kernel.add_plugin_from_directory(
    "agents/plugins/semantic/UnityCodeExpert",
    "UnityCodeExpert"
)

result = await kernel.invoke(
    unity_plugin["BoilerplateGenerator"],
    request="Create a player movement script"
)
```

## Plugin Registration

Plugins are automatically registered when the kernel is created:

```python
from backend.app.kernel import create_kernel

kernel = create_kernel({
    "unity_version": "2022.3",
    "output_root": "/path/to/output"
})
```

## Future Improvements

- Add more Semantic Functions for specific patterns.
- Support for different Unity versions with specific prompts.
- Generation of unit tests for Unity scripts.
- Plugin for prefab and scene generation.

## References

- [Semantic Kernel Documentation](https://learn.microsoft.com/en-us/semantic-kernel/)
- [Unity C# Coding Conventions](https://docs.unity3d.com/Manual/coding-conventions.html)
