# Unity Generator Agents & Skills

This directory contains Semantic Kernel agents and skills for the Unity Generator project.

## Structure

- **`code_agent.py`** - Code generation agent
- **`text_agent.py`** - Text generation agent  
- **`image_agent.py`** - Image generation agent
- **`audio_agent.py`** - Audio generation agent
- **`unity_skills.py`** - Unity-specific Semantic Kernel skills ⭐ NEW
- **`core_skills.py`** - Core Semantic Kernel skill wrappers ⭐ NEW

## Semantic Kernel Skills

### What are Skills?

Semantic Kernel "Skills" are Python classes with methods decorated with `@kernel_function`. They provide reusable capabilities that can be invoked by agents through the Semantic Kernel runtime.

**Important**: Semantic Kernel has no skill marketplace. Skills are Python functions you build yourself. Only Microsoft's core plugins (TextPlugin, TimePlugin, MathPlugin) are semi-official.

### Unity Skills (`unity_skills.py`)

Custom Unity-specific skills:

#### `UnityCodeSkill`
- `generate_unity_csharp()` - Generates Unity C# code with version-specific API context
- `validate_unity_syntax()` - Validates C# syntax before writing to disk
- `extract_csharp_code()` - Extracts C# code from markdown blocks

#### `UnityProjectSkill`
- `write_unity_asset()` - Safely writes files to `output/Assets/` (sandboxed)
- `create_unity_folder()` - Creates folder structures in `output/Assets/`
- `get_output_path()` - Returns the output directory path

### Core Skills (`core_skills.py`)

Fallback implementations of core Semantic Kernel plugins:

- `TextSkill` - Text manipulation (trim, uppercase, lowercase)
- `TimeSkill` - Date/time operations (get_current_time, format_date)
- `MathSkill` - Basic math operations (add, multiply)

## Usage

### Registering Skills

Skills are automatically registered when creating a kernel:

```python
from backend.app.kernel import create_kernel

kernel = create_kernel({
    "unity_version": "2022.3",
    "output_root": "/path/to/output"  # Optional
})
```

### Using Skills in Agents

```python
from agents.unity_skills import UnityCodeSkill, UnityProjectSkill

# Create skill instance
code_skill = UnityCodeSkill("2022.3")

# Generate code prompt with Unity context
enhanced_prompt = code_skill.generate_csharp("Create a player script")

# Validate code before writing
if code_skill.validate_syntax(generated_code):
    project_skill = UnityProjectSkill()
    project_skill.write_asset("Scripts/Player.cs", generated_code)
```

## Security

The `UnityProjectSkill` includes security measures:

- ✅ Path traversal prevention (all paths validated against output root)
- ✅ Sandboxed file writes (restricted to `output/` directory)
- ✅ Automatic directory creation
- ✅ Absolute path resolution and validation

## Testing

Run tests for Unity skills:

```bash
cd backend
pytest tests/test_unity_skills.py -v
```

## Documentation

- **`SKILLS_USAGE.md`** - Comprehensive usage guide with examples
- **`.cursor/rules/backend/project-conventions.mdc`** - Project conventions for agents

## Integration Status

- ✅ Unity skills created and tested
- ✅ Core skills created (fallback implementations)
- ✅ Kernel registration updated
- ⏳ Agent integration (can be updated to use skills)
- ⏳ End-to-end testing

## Next Steps

1. Integrate skills into existing agents (`code_agent.py`, etc.)
2. Add more Unity-specific skills (prefab generation, scene management)
3. Create composite skills that chain multiple operations
4. Add performance monitoring and logging
