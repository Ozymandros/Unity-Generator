# UnityCodeExpert - Semantic Functions

This directory contains Semantic Functions (AI prompts) for generating Unity code.

## Structure

Each Semantic Function is in its own folder with:
- `skprompt.txt`: The prompt sent to the LLM.
- `config.json`: Model configuration (temperature, max_tokens, etc.).

## Available Functions

### BoilerplateGenerator

Generates the basic structure of a MonoBehaviour with `Start()` and `Update()` methods.

**Parameters:**
- `request`: Description of the Unity script to generate.

**Usage:**
```python
from semantic_kernel import Kernel

kernel = Kernel()
unity_plugin = kernel.add_plugin_from_directory("agents/plugins/semantic", "UnityCodeExpert")

result = await kernel.invoke(
    unity_plugin["BoilerplateGenerator"],
    request="Create a player movement script with WASD controls"
)
```

### NamespaceFixer

Ensures that the class name matches the file name, a critical Unity constraint.

**Parameters:**
- `code`: The C# code to fix.
- `filename`: The file name (without .cs extension).

**Usage:**
```python
result = await kernel.invoke(
    unity_plugin["NamespaceFixer"],
    code=generated_code,
    filename="PlayerMovement"
)
```

### ShaderSuggester

Generates HLSL code for Shaders if the user's prompt requires it.

**Parameters:**
- `request`: Description of the shader to generate.

**Usage:**
```python
result = await kernel.invoke(
    unity_plugin["ShaderSuggester"],
    request="Create a toon shader with cel shading"
)
```

## Integration with Native Plugins

These Semantic Functions are used together with Native Plugins:

1. `BoilerplateGenerator` generates the initial code.
2. `NamespaceFixer` ensures the class name matches the file.
3. `UnityProjectPlugin.write_csharp_script()` writes the code to the project.

## Future Improvements

- Add more Semantic Functions for specific patterns (Singleton, Factory, etc.).
- Support for different Unity versions with specific prompts.
- Generation of unit tests for Unity scripts.
