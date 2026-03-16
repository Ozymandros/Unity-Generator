# Unity Generator - User Guide

Welcome to Unity Generator! This guide will help you get started with creating Unity projects using AI-powered generation.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Main Features](#main-features)
3. [Menu Options](#menu-options)
4. [Generation Panels](#generation-panels)
5. [Settings](#settings)
6. [Troubleshooting](#troubleshooting)

## Getting Started

Unity Generator is an AI-powered tool that helps you create Unity projects, scripts, assets, and more using natural language prompts.

### First Launch

1. **Configure API Keys**: Go to Settings → API Keys and add your provider API keys (OpenAI, Anthropic, etc.)
2. **Set Preferences**: Configure your preferred AI providers for different generation types
3. **Create or Open Project**: Use File → New Project or File → Open Project to get started

## Main Features

### AI-Powered Generation

Unity Generator supports multiple types of AI-powered content generation:

- **Code**: Generate C# scripts for Unity (MonoBehaviours, ScriptableObjects, etc.)
- **Text**: Generate narrative content, dialogue, descriptions
- **Images**: Create concept art, textures, UI elements
- **Sprites**: Generate pixel art and 2D sprites optimized for Unity
- **Audio**: Generate voice-over (TTS) and music
- **Scenes**: Create complete Unity scenes with GameObjects and components
- **Unity UI Elements**: Generate Unity UI prefabs (health bars, buttons, dialogue boxes, HUD layouts) for uGUI or UI Toolkit
- **Unity Projects**: Generate full Unity project structures

### Multi-Provider Support

Choose from multiple AI providers:
- **OpenAI** (GPT-4, DALL-E, TTS)
- **Anthropic** (Claude)
- **DeepSeek** (Code generation)
- **OpenRouter** (Multiple models)
- **Groq** (Fast inference)
- **Stability AI** (Image generation)
- **ElevenLabs** (Voice synthesis)
- **Suno** (Music generation)

## Menu Options

### File Menu

- **New Project** (Ctrl/Cmd+N): Reset the application to default state, like a fresh start
- **Open Project** (Ctrl/Cmd+O): Open an existing Unity project folder
  - Only accepts valid Unity projects (must contain Assets/ and ProjectSettings/ folders)
  - Automatically loads project information into the Unity Project panel
- **Exit** (Alt+F4): Close the application

### Edit Menu

Standard editing commands:
- **Undo** (Ctrl/Cmd+Z)
- **Redo** (Ctrl/Cmd+Y)
- **Cut** (Ctrl/Cmd+X)
- **Copy** (Ctrl/Cmd+C)
- **Paste** (Ctrl/Cmd+V)
- **Select All** (Ctrl/Cmd+A)

### Tools Menu

- **Developer Tools** (F12): Open Chrome DevTools for debugging
- **Reload**: Reload the application
- **Force Reload**: Force reload (clear cache)

### Help Menu

- **User Guide**: Open this guide
- **About**: View application information and version

## Generation Panels

### Code Panel

Generate Unity C# scripts:

1. Enter a description of what you want to create
2. Select provider and model (optional - uses your preferences by default)
3. Click "Generate"
4. Review and copy the generated code

**Example prompts:**
- "Create a player controller with WASD movement and jump"
- "Generate a health system with damage and healing"
- "Make a simple inventory system"

### Text Panel

Generate narrative content:

1. Describe the text you need
2. Choose provider and model
3. Generate and review

**Example prompts:**
- "Write dialogue for an NPC shopkeeper"
- "Create item descriptions for a fantasy RPG"
- "Generate quest text for a side mission"

### Image Panel

Create visual assets:

1. Describe the image you want
2. Select image provider (DALL-E, Stable Diffusion, etc.)
3. Generate and download

**Example prompts:**
- "Fantasy sword icon, game asset, transparent background"
- "Sci-fi spaceship concept art, detailed"
- "Medieval castle texture, stone walls"

### Sprites Panel

Generate pixel art and 2D sprites:

1. Describe the sprite
2. Choose size and style preferences
3. Generate optimized sprites for Unity

**Example prompts:**
- "8-bit character sprite, knight with sword"
- "16x16 tile, grass texture"
- "Animated coin sprite, golden"

### Audio Panel

Generate voice-over and music:

1. **Voice (TTS)**: Enter text to convert to speech
2. **Music**: Describe the music you want
3. Select provider and voice/style
4. Generate and download

**Example prompts (Music):**
- "Epic orchestral battle theme"
- "Calm ambient forest sounds"
- "Upbeat 8-bit game music"

### Scenes Panel

Create complete Unity scenes:

1. Describe the scene you want
2. Specify GameObjects, components, and layout
3. Generate scene file
4. Import into Unity

**Example prompts:**
- "Create a simple platformer level with platforms and collectibles"
- "Generate a main menu scene with UI buttons"
- "Make a test scene with a player, camera, and ground"

### Unity UI Elements Panel

Generate Unity UI prefab assets — health bars, buttons, dialogue boxes, inventory slots, HUD layouts, and more:

1. Click a **Quick Action** chip to inject a ready-made template prompt, or type your own description
2. Select **UI System**: uGUI (Canvas-based) or UI Toolkit (UXML/USS)
3. Select **Element Type** to auto-fill a template prompt for that element
4. Optionally set **Output Format** (C# script, Prefab YAML, or both), **Anchor Preset**, and **Colour Theme**
5. Toggle **Include animations** to add transition/animation code
6. Click "Generate UI Element"

**Example prompts:**
- "Create a health bar with a smooth red fill that depletes from right to left"
- "Generate a dialogue box with speaker name, portrait slot, and next/skip buttons"
- "Make an inventory slot with item icon, quantity badge, and hover highlight"

**Output formats:**
- **C# Script only**: A MonoBehaviour that builds the UI hierarchy at runtime (uGUI) or a C# controller with UQuery bindings (UI Toolkit)
- **Prefab YAML only**: Unity `.prefab` serialisation ready to drop into `Assets/UI/`
- **Script + Prefab YAML**: Both files together

### Unity Project Panel

Generate complete Unity projects:

1. Enter project description
2. Specify features and requirements
3. Generate full project structure
4. Open in Unity Editor

**Example prompts:**
- "Create a 2D platformer project with player movement"
- "Generate a 3D FPS project template"
- "Make a puzzle game project with grid system"

## Settings

### General Preferences

- **Backend URL**: Configure the backend server address (default: http://127.0.0.1:35421)
- **Output Base Path**: Set where generated Unity projects are saved (default: ./output)
- **Preferred Providers**: Choose default AI providers for each generation type

### API Keys

Add your API keys for different providers:

1. Go to Settings → API Keys
2. Enter your API key for each provider you want to use
3. Click "Save"

**Note**: API keys are stored locally and never sent to external servers except the provider's API.

### System Prompts

Customize the behavior of AI generation:

1. Go to Settings → System Prompts
2. Edit prompts for different generation types
3. Save your changes

**Example customizations:**
- Add coding style preferences
- Specify naming conventions
- Set quality requirements

### Prompt Management

Manage and reuse your prompts:

1. Save frequently used prompts
2. Organize by category
3. Quick access to common requests

## Troubleshooting

### Backend Connection Issues

If you see "Offline" status:

1. Check that the backend is running (should start automatically)
2. Verify the backend URL in Settings
3. Check logs for errors
4. Try restarting the application

### Generation Failures

If generation fails:

1. **Check API Keys**: Ensure your API keys are valid and have credits
2. **Try Different Provider**: Switch to an alternative provider
3. **Simplify Prompt**: Make your prompt more specific and concise
4. **Check Logs**: Open Developer Tools (F12) to see error details

### Port Conflicts

If the backend fails to start due to port conflicts:

1. Close other applications using port 35421
2. Or set a different port:
   - Set environment variable: `BACKEND_PORT=35422`
   - Update backend URL in Settings to match

### Unity Project Issues

If "Open Project" doesn't work:

1. Ensure the folder is a valid Unity project (contains Assets/ and ProjectSettings/)
2. Check folder permissions
3. Try opening the project directly in Unity first

## Keyboard Shortcuts

- **Ctrl/Cmd+N**: New Project
- **Ctrl/Cmd+O**: Open Project
- **Ctrl/Cmd+Z**: Undo
- **Ctrl/Cmd+Y**: Redo
- **Ctrl/Cmd+C**: Copy
- **Ctrl/Cmd+V**: Paste
- **Ctrl/Cmd+X**: Cut
- **Ctrl/Cmd+A**: Select All
- **F12**: Developer Tools
- **Alt+F4**: Exit (Windows)

## Tips and Best Practices

### Writing Effective Prompts

1. **Be Specific**: Include details about what you want
2. **Provide Context**: Mention the game genre, style, or purpose
3. **Set Constraints**: Specify technical requirements or limitations
4. **Iterate**: Refine prompts based on results

### Organizing Generated Content

1. Use consistent naming conventions
2. Organize assets by type and purpose
3. Keep track of which provider/model generated what
4. Save successful prompts for reuse

### Performance Tips

1. Use appropriate models for the task (smaller models for simple tasks)
2. Generate in batches when possible
3. Cache and reuse generated content
4. Monitor API usage and costs

## Support and Resources

- **GitHub Repository**: [Unity-Generator](https://github.com/Ozymandros/Unity-Generator)
- **Issues**: Report bugs and request features on GitHub
- **Documentation**: Check the docs/ folder for technical documentation

## Version Information

This guide is for Unity Generator v1.0.0

For the latest updates and changes, check the CHANGELOG.md file in the repository.

---

**Happy Creating!** 🎮✨
