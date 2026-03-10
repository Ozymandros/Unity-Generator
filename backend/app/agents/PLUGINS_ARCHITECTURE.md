# Semantic Kernel Plugins Architecture

This document explains the plugin architecture for Unity Generator, divided into **Native Functions** and **Semantic Functions** according to Semantic Kernel best practices.

## General Overview

Semantic Kernel plugins are divided into two categories:

1. **Native Plugins** (`agents/plugins/native/`): Python logic for system, file, and Unity operations.
2. **Semantic Functions** (`agents/plugins/semantic/`): AI prompts for code generation.

## Native Plugins

### UnityProjectPlugin

**Purpose**: Manages Unity project structure and file operations asynchronously and securely.

**Kernel Functions**:
- `create_folder_structure(project_name)`: Generates `Assets/Scripts`, `Assets/Textures`, etc.
- `generate_meta_file(file_path, is_folder, guid)`: Creates Unity `.meta` files.
- `write_csharp_script(project_path, script_name, code, relative_path)`: Writes C# scripts to the project.

**Usage Example**:
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

**Purpose**: Acts as a bridge between agents and AI providers, managing selection and normalization.

**Kernel Functions**:
- `get_best_provider(provider_type, preferred_provider)`: Selects the best available provider.
- `validate_response(provider, raw_response, provider_type)`: Normalizes responses to the `GenerationResponse` format.

**Usage Example**:
```python
from agents.plugins.native import ProviderOrchestratorPlugin

plugin = ProviderOrchestratorPlugin()
provider = plugin.get_best_provider("llm", preferred_provider="openai")
normalized = plugin.validate_response(provider, raw_response, "llm")
```

### MemoryPrefsPlugin

**Purpose**: Allows agents to query and update user preferences stored in SQLite.

**Kernel Functions**:
- `get_user_preference(key)`: Queries a preference.
- `set_user_preference(key, value)`: Updates a preference.
- `get_preferred_provider(provider_type)`: Gets the preferred provider.
- `get_unity_version()`: Gets the preferred Unity version.

**Usage Example**:
```python
from agents.plugins.native import MemoryPrefsPlugin

plugin = MemoryPrefsPlugin()
provider = plugin.get_preferred_provider("llm")  # Query preference
plugin.set_user_preference("preferred_llm_provider", "openai")  # Update
version = plugin.get_unity_version()  # Get Unity version
```

## Semantic Functions

### UnityCodeExpert

Contains specialized prompts for Unity code generation.

#### BoilerplateGenerator

Generates the basic structure of a MonoBehaviour with `Start()` and `Update()`.

**Prompt**: `agents/plugins/semantic/UnityCodeExpert/BoilerplateGenerator/skprompt.txt`

**Parameters**:
- `request`: Description of the Unity script to generate.

#### NamespaceFixer

Ensures that the class name matches the file name (critical Unity constraint).

**Prompt**: `agents/plugins/semantic/UnityCodeExpert/NamespaceFixer/skprompt.txt`

**Parameters**:
- `code`: The C# code to fix.
- `filename`: The file name (without .cs extension).

#### ShaderSuggester

Generates HLSL code for Shaders when the user's prompt requires it.

**Prompt**: `agents/plugins/semantic/UnityCodeExpert/ShaderSuggester/skprompt.txt`

**Parameters**:
- `request`: Description of the shader to generate.

## Integrated Workflow

A typical flow for generating Unity code using all plugins:

```python
from semantic_kernel import Kernel
from agents.plugins.native import UnityProjectPlugin, MemoryPrefsPlugin

# 1. Create the kernel with all registered plugins
kernel = create_kernel({"unity_version": "2022.3"})

# 2. Get user preferences
memory_plugin = kernel.get_plugin("MemoryPrefs")
unity_version = memory_plugin.get_unity_version()
preferred_provider = memory_plugin.get_preferred_provider("llm")

# 3. Generate code using Semantic Functions
unity_code_expert = kernel.get_plugin("UnityCodeExpert")
generated_code = await kernel.invoke(
    unity_code_expert["BoilerplateGenerator"],
    request="Create a player movement script with WASD controls"
)

# 4. Fix class name
fixed_code = await kernel.invoke(
    unity_code_expert["NamespaceFixer"],
    code=generated_code,
    filename="PlayerMovement"
)

# 5. Write to Unity project
project_plugin = kernel.get_plugin("UnityProject")
project_path = project_plugin.create_folder_structure("MyGame")
script_path = project_plugin.write_csharp_script(
    project_path,
    "PlayerMovement",
    fixed_code
)
```

## Design Principles

### Single Responsibility Principle (SRP)

Each plugin has a single and well-defined responsibility:
- `UnityProjectPlugin`: Unity file management.
- `ProviderOrchestratorPlugin`: Provider orchestration.
- `MemoryPrefsPlugin`: Preference management.

### Separation of Concerns

- **Native Plugins**: Python logic, system operations, validation.
- **Semantic Functions**: AI-driven content generation.

### Clean Architecture

The plugins follow the Layered Architecture:
- **Presentation Layer**: Agents use plugins.
- **Business Logic**: Plugins encapsulate the logic.
- **Data Access**: MemoryPrefsPlugin accesses SQLite.

## Automatic Registration

Plugins are automatically registered when the kernel is created via `create_kernel()`:

```python
from backend.app.kernel import create_kernel

kernel = create_kernel({
    "unity_version": "2022.3",
    "output_root": "/path/to/output"
})
```

All plugins are available via `kernel.get_plugin(plugin_name)`.

## Future Improvements

- [ ] Add more Semantic Functions for specific patterns (Singleton, Factory, etc.)
- [ ] Support for different Unity versions with specific prompts.
- [ ] Generation of unit tests for Unity scripts.
- [ ] Plugin for prefab and scene generation.
- [ ] Plugin for Unity code optimization.

## References

- [Semantic Kernel Python Documentation](https://learn.microsoft.com/en-us/semantic-kernel/)
- [Unity C# Coding Conventions](https://docs.unity3d.com/Manual/coding-conventions.html)
- [Project Conventions](.cursor/rules/backend/project-conventions.mdc)
