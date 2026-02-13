# Semantic Kernel Skills Usage Guide

This document explains how to use the Semantic Kernel skills in the Unity Generator project.

## Overview

Semantic Kernel "Skills" are Python classes with methods decorated with `@kernel_function`. They provide reusable capabilities that can be invoked by agents through the Semantic Kernel runtime.

## Available Skills

### Unity Skills (`agents/unity_skills.py`)

#### UnityCodeSkill

Provides Unity-aware code generation and validation:

- `generate_unity_csharp(prompt, unity_version)` - Generates Unity C# code with version-specific API context
- `validate_unity_syntax(code)` - Validates C# syntax before writing to disk
- `extract_csharp_code(content)` - Extracts C# code from markdown blocks

#### UnityProjectSkill

Provides secure file operations for Unity projects:

- `write_unity_asset(relative_path, content)` - Safely writes files to `output/Assets/`
- `create_unity_folder(relative_path)` - Creates folder structures in `output/Assets/`
- `get_output_path()` - Returns the output directory path

### Core Skills (`agents/core_skills.py`)

Fallback implementations of core Semantic Kernel plugins:

- `TextSkill` - Text manipulation (trim, uppercase, lowercase)
- `TimeSkill` - Date/time operations (get_current_time, format_date)
- `MathSkill` - Basic math operations (add, multiply)

## Using Skills in Agents

### Example: Using Unity Skills in Code Agent

Here's how to integrate Unity skills into an agent:

```python
from typing import Any, Dict, Optional
from backend.app.kernel import create_kernel
from agents.unity_skills import UnityCodeSkill
from services.llm_provider import generate_text

def run(
    prompt: str,
    provider: Optional[str],
    options: Dict[str, Any],
    api_keys: Dict[str, str],
) -> Dict[str, Any]:
    """
    Generate Unity C# code using Semantic Kernel skills.

    Args:
        prompt: User's code generation request.
        provider: Optional LLM provider override.
        options: Provider-specific options (e.g., model, temperature).
        api_keys: Dictionary of API keys for providers.

    Returns:
        Dictionary with generated code and metadata.

    Example:
        >>> result = run("Create a player movement script", None, {}, {})
        >>> "content" in result
        True
    """
    # Create kernel with Unity skills
    kernel = create_kernel({
        "unity_version": options.get("unity_version", "2022.3")
    })

    # Get Unity code skill
    unity_skill = kernel.get_plugin("unity_code")

    # Enhance prompt with Unity context
    enhanced_prompt = unity_skill.generate_csharp(prompt)

    # Generate code using LLM provider
    result = generate_text(enhanced_prompt, provider, options, api_keys)

    # Extract and validate code
    if result.get("content"):
        code = unity_skill.extract_csharp_code(result["content"])

        # Validate syntax before returning
        if unity_skill.validate_syntax(code):
            result["content"] = code
            result["validated"] = True
        else:
            result["validation_warning"] = "Code syntax validation failed"

    return result
```

### Example: Using Unity Project Skill

```python
from agents.unity_skills import UnityProjectSkill

def write_unity_script(script_name: str, code: str) -> str:
    """
    Write a Unity C# script to the output directory.

    Args:
        script_name: Name of the script file (e.g., "PlayerMovement.cs").
        code: C# code content.

    Returns:
        Path to the written file.

    Example:
        >>> path = write_unity_script("Player.cs", "public class Player {}")
        >>> "Player.cs" in path
        True
    """
    project_skill = UnityProjectSkill()

    # Write to Assets/Scripts/ directory
    relative_path = f"Scripts/{script_name}"
    file_path = project_skill.write_asset(relative_path, code)

    return file_path
```

## Skill Registration

Skills are automatically registered when creating a kernel via `create_kernel()`:

```python
from backend.app.kernel import create_kernel

# Create kernel with default settings
kernel = create_kernel({})

# Or with custom settings
kernel = create_kernel({
    "unity_version": "2023.1",
    "output_root": "/custom/path/to/output"
})

# Skills are now available
unity_code = kernel.get_plugin("unity_code")
unity_project = kernel.get_plugin("unity_project")
```

## Security Considerations

### File Writing Safety

The `UnityProjectSkill.write_asset()` method includes security measures:

1. **Path Traversal Prevention**: All paths are validated to ensure they stay within the `output/` directory
2. **Absolute Path Resolution**: Paths are resolved to absolute paths and checked against the output root
3. **Directory Creation**: Parent directories are created automatically

Example of safe usage:

```python
# ✅ Safe - writes to output/Assets/Scripts/Player.cs
skill.write_asset("Scripts/Player.cs", code)

# ❌ Blocked - would escape output directory
skill.write_asset("../../../etc/passwd", code)  # Raises ValueError
```

## Integration with Existing Agents

The existing agents (`code_agent.py`, `text_agent.py`, etc.) can be updated to use Semantic Kernel skills:

1. **Option 1**: Use skills for preprocessing/postprocessing while keeping LLM provider calls
2. **Option 2**: Use kernel.invoke() to call skills that internally use LLM services
3. **Option 3**: Hybrid approach - use skills for validation and file operations, keep direct LLM calls for generation

## Best Practices

1. **Always validate code** before writing to disk using `validate_unity_syntax()`
2. **Use version-specific prompts** by specifying `unity_version` in options
3. **Extract code from markdown** using `extract_csharp_code()` when LLM returns formatted responses
4. **Handle errors gracefully** - skills raise exceptions that should be caught and handled
5. **Log skill usage** for debugging and monitoring

## Testing Skills

Skills can be tested independently:

```python
from agents.unity_skills import UnityCodeSkill, UnityProjectSkill

# Test code generation
skill = UnityCodeSkill("2022.3")
prompt = skill.generate_csharp("Create a simple MonoBehaviour")
assert "MonoBehaviour" in prompt

# Test syntax validation
assert skill.validate_syntax("public class Test : MonoBehaviour {}")
assert not skill.validate_syntax("public class Test {")  # Missing closing brace

# Test file writing
project_skill = UnityProjectSkill()
path = project_skill.write_asset("Test.cs", "public class Test {}")
assert Path(path).exists()
```

## Next Steps

- Integrate skills into existing agents
- Add more Unity-specific skills (e.g., prefab generation, scene management)
- Create composite skills that chain multiple operations
- Add unit tests for all skills
