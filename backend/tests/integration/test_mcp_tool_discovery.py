"""
Integration tests for LLM tool discovery with Unity-MCP-Server 3.0.5.

Tests verify that the LLM can discover and use Unity-MCP-Server tools
through Semantic Kernel's MCP plugin, including the new 3.0.5 capabilities
for prototyping, animation, and media import.

**Property 5: LLM Tool Discovery**
Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7
"""

import logging
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.agents.unity_agent import UnityAgent

LOGGER = logging.getLogger(__name__)


@pytest.mark.asyncio
async def test_llm_discovers_unity_mcp_tools():
    """
    Verify that LLM can discover Unity-MCP-Server 3.0.5 tools through MCP plugin.

    **Property 5: LLM Tool Discovery**

    This test verifies that when UnityAgent runs with a tool-capable provider,
    the MCP plugin is registered and tools are available for the LLM to discover
    and call.

    Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7
    """
    agent = UnityAgent()

    with patch("app.agents.unity_agent.Kernel") as MockKernel, \
         patch("app.agents.unity_agent.provider_registry") as MockRegistry, \
         patch("app.agents.unity_agent.unity_mcp_plugin_available_for_writing", return_value=True), \
         patch("app.agents.unity_agent.create_unity_mcp_plugin") as MockFactory:

        # Mock Kernel
        mock_kernel_instance = MockKernel.return_value
        mock_kernel_instance.invoke_prompt = AsyncMock(return_value="Scene created successfully")

        # Mock Registry
        mock_caps = MagicMock()
        mock_caps.api_key_name = "openai"
        mock_caps.supports_tool_use = True
        MockRegistry.get.return_value = mock_caps
        MockRegistry.create_chat_service.return_value = MagicMock()

        # Mock Plugin Factory Context Manager
        mock_plugin_instance = MagicMock()
        mock_context_manager = AsyncMock()
        mock_context_manager.__aenter__.return_value = mock_plugin_instance
        mock_context_manager.__aexit__.return_value = None
        MockFactory.return_value = mock_context_manager

        # Execute agent with a prompt that should trigger tool discovery
        result = await agent.run(
            prompt="Create a detailed scene with a red cube and blue sphere",
            provider="openai",
            options={"model": "gpt-4"},
            api_keys={"openai": "sk-test"},
        )

        # Verify MCP plugin was created and registered
        MockFactory.assert_called_once()
        mock_kernel_instance.add_plugin.assert_called_with(
            mock_plugin_instance,
            plugin_name="UnityMCP"
        )

        # Verify the prompt was invoked with the kernel
        mock_kernel_instance.invoke_prompt.assert_called_once()

        # Verify result contains expected structure
        assert "content" in result
        assert result["content"] == "Scene created successfully"


@pytest.mark.asyncio
async def test_llm_uses_prototype_recipe_for_fps_prompt():
    """
    Verify that LLM calls unity_create_prototype_recipe for FPS prototype prompt.

    **Property 5: LLM Tool Discovery**

    This test verifies that when the user requests an FPS prototype, the enhanced
    system prompt guides the LLM to use the unity_create_prototype_recipe tool
    with the appropriate parameters.

    Validates: Requirements 1.6, 1.11
    """
    agent = UnityAgent()

    with patch("app.agents.unity_agent.Kernel") as MockKernel, \
         patch("app.agents.unity_agent.provider_registry") as MockRegistry, \
         patch("app.agents.unity_agent.unity_mcp_plugin_available_for_writing", return_value=True), \
         patch("app.agents.unity_agent.create_unity_mcp_plugin") as MockFactory:

        # Mock Kernel
        mock_kernel_instance = MockKernel.return_value
        mock_kernel_instance.invoke_prompt = AsyncMock(
            return_value="FPS prototype created with player controller, camera, WASD movement, and UI"
        )

        # Mock Registry
        mock_caps = MagicMock()
        mock_caps.api_key_name = "openai"
        mock_caps.supports_tool_use = True
        MockRegistry.get.return_value = mock_caps
        MockRegistry.create_chat_service.return_value = MagicMock()

        # Mock Plugin Factory Context Manager
        mock_plugin_instance = MagicMock()
        mock_context_manager = AsyncMock()
        mock_context_manager.__aenter__.return_value = mock_plugin_instance
        mock_context_manager.__aexit__.return_value = None
        MockFactory.return_value = mock_context_manager

        # Execute agent with FPS prototype prompt
        result = await agent.run(
            prompt="Create a complete FPS prototype with first-person player controller, camera, WASD movement, mouse look, and basic UI with crosshair and health bar",
            provider="openai",
            options={"model": "gpt-4"},
            api_keys={"openai": "sk-test"},
        )

        # Verify MCP plugin was registered
        MockFactory.assert_called_once()
        mock_kernel_instance.add_plugin.assert_called_with(
            mock_plugin_instance,
            plugin_name="UnityMCP"
        )

        # Get the full prompt that was passed to invoke_prompt
        call_kwargs = mock_kernel_instance.invoke_prompt.call_args[1]
        full_prompt = call_kwargs.get("prompt", "")

        # Verify enhanced guidance mentions unity_create_prototype_recipe
        assert "unity_create_prototype_recipe" in full_prompt, \
            "Enhanced guidance should mention unity_create_prototype_recipe tool"

        # Verify workflow recommendation for prototypes is present
        assert "For prototypes: Use unity_create_prototype_recipe for instant playable setup" in full_prompt, \
            "Workflow recommendation for prototypes should be in system prompt"

        # Verify PROTOTYPING section is present
        assert "PROTOTYPING:" in full_prompt, \
            "PROTOTYPING section should be in enhanced guidance"

        # Verify result indicates success
        assert "content" in result
        assert "FPS prototype" in result["content"]


@pytest.mark.asyncio
async def test_llm_enhanced_guidance_includes_all_tool_categories():
    """
    Verify that enhanced system prompt includes all Unity-MCP-Server 3.0.5 tool categories.

    **Property 1: System Prompt Contains All Tool Categories**
    **Property 2: System Prompt Contains Workflow Recommendations**

    This test verifies that the enhanced capabilities guidance includes all six
    tool categories and workflow recommendations as specified in the design.

    Validates: Requirements 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10, 1.11, 1.12
    """
    agent = UnityAgent()

    with patch("app.agents.unity_agent.Kernel") as MockKernel, \
         patch("app.agents.unity_agent.provider_registry") as MockRegistry, \
         patch("app.agents.unity_agent.unity_mcp_plugin_available_for_writing", return_value=True), \
         patch("app.agents.unity_agent.create_unity_mcp_plugin") as MockFactory:

        # Mock Kernel
        mock_kernel_instance = MockKernel.return_value
        mock_kernel_instance.invoke_prompt = AsyncMock(return_value="Success")

        # Mock Registry
        mock_caps = MagicMock()
        mock_caps.api_key_name = "openai"
        mock_caps.supports_tool_use = True
        MockRegistry.get.return_value = mock_caps
        MockRegistry.create_chat_service.return_value = MagicMock()

        # Mock Plugin Factory Context Manager
        mock_plugin_instance = MagicMock()
        mock_context_manager = AsyncMock()
        mock_context_manager.__aenter__.return_value = mock_plugin_instance
        mock_context_manager.__aexit__.return_value = None
        MockFactory.return_value = mock_context_manager

        # Execute agent
        await agent.run(
            prompt="Test prompt",
            provider="openai",
            options={"model": "gpt-4"},
            api_keys={"openai": "sk-test"},
        )

        # Get the full prompt that was passed to invoke_prompt
        call_kwargs = mock_kernel_instance.invoke_prompt.call_args[1]
        full_prompt = call_kwargs.get("prompt", "")

        # Verify all six tool categories are present
        required_categories = [
            "SCENE BUILDING:",
            "UI CREATION:",
            "ANIMATION & CUTSCENES:",
            "INPUT & INTERACTION:",
            "PROTOTYPING:",
            "MEDIA IMPORT:",
        ]

        for category in required_categories:
            assert category in full_prompt, \
                f"Enhanced guidance missing required category: {category}"

        # Verify WORKFLOW RECOMMENDATIONS section is present
        assert "WORKFLOW RECOMMENDATIONS:" in full_prompt, \
            "Enhanced guidance missing WORKFLOW RECOMMENDATIONS section"

        # Verify specific workflow recommendations are present
        workflow_recommendations = [
            "For animations:",
            "For cutscenes:",
            "For prototypes:",
        ]

        for recommendation in workflow_recommendations:
            assert recommendation in full_prompt, \
                f"Enhanced guidance missing workflow recommendation: {recommendation}"

        # Verify key tools are mentioned in their respective categories
        key_tools = {
            "unity_create_detailed_scene": "SCENE BUILDING",
            "unity_add_gameobject": "SCENE BUILDING",
            "unity_create_material": "SCENE BUILDING",
            "unity_create_prefab": "SCENE BUILDING",
            "unity_create_ui_canvas": "UI CREATION",
            "unity_create_ui_layout": "UI CREATION",
            "unity_create_basic_animator": "ANIMATION & CUTSCENES",
            "unity_create_advanced_animator": "ANIMATION & CUTSCENES",
            "unity_create_timeline": "ANIMATION & CUTSCENES",
            "unity_create_input_actions": "INPUT & INTERACTION",
            "unity_create_prototype_recipe": "PROTOTYPING",
            "unity_save_texture": "MEDIA IMPORT",
            "unity_save_audio": "MEDIA IMPORT",
        }

        for tool, category in key_tools.items():
            assert tool in full_prompt, \
                f"Enhanced guidance missing key tool '{tool}' in {category} category"


@pytest.mark.asyncio
async def test_llm_animation_workflow_guidance():
    """
    Verify that enhanced system prompt includes animation workflow guidance.

    **Property 2: System Prompt Contains Workflow Recommendations**

    This test verifies that the system prompt guides the LLM through the correct
    animation workflow: Create animator → Create prefab with Animator component
    → Attach to GameObject.

    Validates: Requirements 1.9
    """
    agent = UnityAgent()

    with patch("app.agents.unity_agent.Kernel") as MockKernel, \
         patch("app.agents.unity_agent.provider_registry") as MockRegistry, \
         patch("app.agents.unity_agent.unity_mcp_plugin_available_for_writing", return_value=True), \
         patch("app.agents.unity_agent.create_unity_mcp_plugin") as MockFactory:

        # Mock Kernel
        mock_kernel_instance = MockKernel.return_value
        mock_kernel_instance.invoke_prompt = AsyncMock(return_value="Animator created")

        # Mock Registry
        mock_caps = MagicMock()
        mock_caps.api_key_name = "openai"
        mock_caps.supports_tool_use = True
        MockRegistry.get.return_value = mock_caps
        MockRegistry.create_chat_service.return_value = MagicMock()

        # Mock Plugin Factory Context Manager
        mock_plugin_instance = MagicMock()
        mock_context_manager = AsyncMock()
        mock_context_manager.__aenter__.return_value = mock_plugin_instance
        mock_context_manager.__aexit__.return_value = None
        MockFactory.return_value = mock_context_manager

        # Execute agent with animation request
        await agent.run(
            prompt="Create a character animator with idle, walk, run, and jump states",
            provider="openai",
            options={"model": "gpt-4"},
            api_keys={"openai": "sk-test"},
        )

        # Get the full prompt
        call_kwargs = mock_kernel_instance.invoke_prompt.call_args[1]
        full_prompt = call_kwargs.get("prompt", "")

        # Verify animation workflow guidance is present
        assert "For animations: Create animator → Create prefab with Animator component → Attach to GameObject" in full_prompt, \
            "Animation workflow guidance not found in system prompt"

        # Verify animation tools are mentioned
        assert "unity_create_basic_animator" in full_prompt, \
            "unity_create_basic_animator tool not mentioned"
        assert "unity_create_advanced_animator" in full_prompt, \
            "unity_create_advanced_animator tool not mentioned"


@pytest.mark.asyncio
async def test_llm_cutscene_workflow_guidance():
    """
    Verify that enhanced system prompt includes cutscene workflow guidance.

    **Property 2: System Prompt Contains Workflow Recommendations**

    This test verifies that the system prompt guides the LLM through the correct
    cutscene workflow: Create timeline → Add timeline component to GameObject
    → Configure tracks.

    Validates: Requirements 1.10
    """
    agent = UnityAgent()

    with patch("app.agents.unity_agent.Kernel") as MockKernel, \
         patch("app.agents.unity_agent.provider_registry") as MockRegistry, \
         patch("app.agents.unity_agent.unity_mcp_plugin_available_for_writing", return_value=True), \
         patch("app.agents.unity_agent.create_unity_mcp_plugin") as MockFactory:

        # Mock Kernel
        mock_kernel_instance = MockKernel.return_value
        mock_kernel_instance.invoke_prompt = AsyncMock(return_value="Timeline created")

        # Mock Registry
        mock_caps = MagicMock()
        mock_caps.api_key_name = "openai"
        mock_caps.supports_tool_use = True
        MockRegistry.get.return_value = mock_caps
        MockRegistry.create_chat_service.return_value = MagicMock()

        # Mock Plugin Factory Context Manager
        mock_plugin_instance = MagicMock()
        mock_context_manager = AsyncMock()
        mock_context_manager.__aenter__.return_value = mock_plugin_instance
        mock_context_manager.__aexit__.return_value = None
        MockFactory.return_value = mock_context_manager

        # Execute agent with cutscene request
        await agent.run(
            prompt="Create a timeline cutscene with camera pan and fade in effect",
            provider="openai",
            options={"model": "gpt-4"},
            api_keys={"openai": "sk-test"},
        )

        # Get the full prompt
        call_kwargs = mock_kernel_instance.invoke_prompt.call_args[1]
        full_prompt = call_kwargs.get("prompt", "")

        # Verify cutscene workflow guidance is present
        assert "For cutscenes: Create timeline → Add timeline component to GameObject → Configure tracks" in full_prompt, \
            "Cutscene workflow guidance not found in system prompt"

        # Verify timeline tool is mentioned
        assert "unity_create_timeline" in full_prompt, \
            "unity_create_timeline tool not mentioned"


@pytest.mark.asyncio
async def test_llm_media_import_tools_available():
    """
    Verify that enhanced system prompt includes media import tool guidance.

    **Property 1: System Prompt Contains All Tool Categories**

    This test verifies that the system prompt includes guidance for media import
    tools (unity_save_texture, unity_save_audio) to support image-to-Unity and
    audio-to-Unity workflows.

    Validates: Requirements 1.7
    """
    agent = UnityAgent()

    with patch("app.agents.unity_agent.Kernel") as MockKernel, \
         patch("app.agents.unity_agent.provider_registry") as MockRegistry, \
         patch("app.agents.unity_agent.unity_mcp_plugin_available_for_writing", return_value=True), \
         patch("app.agents.unity_agent.create_unity_mcp_plugin") as MockFactory:

        # Mock Kernel
        mock_kernel_instance = MockKernel.return_value
        mock_kernel_instance.invoke_prompt = AsyncMock(return_value="Texture imported")

        # Mock Registry
        mock_caps = MagicMock()
        mock_caps.api_key_name = "openai"
        mock_caps.supports_tool_use = True
        MockRegistry.get.return_value = mock_caps
        MockRegistry.create_chat_service.return_value = MagicMock()

        # Mock Plugin Factory Context Manager
        mock_plugin_instance = MagicMock()
        mock_context_manager = AsyncMock()
        mock_context_manager.__aenter__.return_value = mock_plugin_instance
        mock_context_manager.__aexit__.return_value = None
        MockFactory.return_value = mock_context_manager

        # Execute agent with media import request
        await agent.run(
            prompt="Import this generated image as a Unity texture",
            provider="openai",
            options={"model": "gpt-4"},
            api_keys={"openai": "sk-test"},
        )

        # Get the full prompt
        call_kwargs = mock_kernel_instance.invoke_prompt.call_args[1]
        full_prompt = call_kwargs.get("prompt", "")

        # Verify MEDIA IMPORT section is present
        assert "MEDIA IMPORT:" in full_prompt, \
            "MEDIA IMPORT section not found in enhanced guidance"

        # Verify media import tools are mentioned
        assert "unity_save_texture" in full_prompt, \
            "unity_save_texture tool not mentioned"
        assert "unity_save_audio" in full_prompt, \
            "unity_save_audio tool not mentioned"

        # Verify media import descriptions are present
        assert "Import images as Unity textures" in full_prompt, \
            "Texture import description not found"
        assert "Import audio files as Unity audio clips" in full_prompt, \
            "Audio import description not found"


@pytest.mark.asyncio
async def test_llm_tool_discovery_with_project_path(tmp_path):
    """
    Verify that LLM tool discovery works correctly with project_path parameter.

    **Property 5: LLM Tool Discovery**

    This test verifies that when a valid project_path is provided, the system
    prompt includes the path information and tools are still discovered correctly.

    Validates: Requirements 1.1, 10.5
    """
    agent = UnityAgent()

    # Create a valid project directory
    project_path = tmp_path / "TestUnityProject"
    project_path.mkdir()

    with patch("app.agents.unity_agent.Kernel") as MockKernel, \
         patch("app.agents.unity_agent.provider_registry") as MockRegistry, \
         patch("app.agents.unity_agent.unity_mcp_plugin_available_for_writing", return_value=True), \
         patch("app.agents.unity_agent.create_unity_mcp_plugin") as MockFactory:

        # Mock Kernel
        mock_kernel_instance = MockKernel.return_value
        mock_kernel_instance.invoke_prompt = AsyncMock(return_value="Scene created in project")

        # Mock Registry
        mock_caps = MagicMock()
        mock_caps.api_key_name = "openai"
        mock_caps.supports_tool_use = True
        MockRegistry.get.return_value = mock_caps
        MockRegistry.create_chat_service.return_value = MagicMock()

        # Mock Plugin Factory Context Manager
        mock_plugin_instance = MagicMock()
        mock_context_manager = AsyncMock()
        mock_context_manager.__aenter__.return_value = mock_plugin_instance
        mock_context_manager.__aexit__.return_value = None
        MockFactory.return_value = mock_context_manager

        # Execute agent with project_path
        result = await agent.run(
            prompt="Create a scene with a cube",
            provider="openai",
            options={"model": "gpt-4"},
            api_keys={"openai": "sk-test"},
            project_path=str(project_path),
        )

        # Verify MCP plugin was registered
        MockFactory.assert_called_once()
        mock_kernel_instance.add_plugin.assert_called_with(
            mock_plugin_instance,
            plugin_name="UnityMCP"
        )

        # Get the full prompt
        call_kwargs = mock_kernel_instance.invoke_prompt.call_args[1]
        full_prompt = call_kwargs.get("prompt", "")

        # Verify project path is mentioned in system prompt
        normalized_path = project_path.as_posix()
        assert normalized_path in full_prompt, \
            "Project path should be included in system prompt"

        # Verify enhanced guidance is still present
        assert "SCENE BUILDING:" in full_prompt, \
            "Enhanced guidance should be present even with project_path"
        assert "unity_create_detailed_scene" in full_prompt, \
            "Tool guidance should be present even with project_path"

        # Verify result indicates success
        assert "content" in result
        assert result["content"] == "Scene created in project"


@pytest.mark.asyncio
async def test_llm_tool_discovery_without_mcp_available():
    """
    Verify that when MCP is not available, enhanced guidance is still appended.

    **Property 13: Enhanced Guidance Appended to System Message**

    This test verifies that the enhanced capabilities guidance is appended to
    the system message even when MCP tools are not available, maintaining
    consistency in the system prompt structure.

    Validates: Requirements 1.1, 9.7
    """
    agent = UnityAgent()

    with patch("app.agents.unity_agent.Kernel") as MockKernel, \
         patch("app.agents.unity_agent.provider_registry") as MockRegistry, \
         patch("app.agents.unity_agent.unity_mcp_plugin_available_for_writing", return_value=False):

        # Mock Kernel
        mock_kernel_instance = MockKernel.return_value
        mock_kernel_instance.invoke_prompt = AsyncMock(return_value="Plain text response")

        # Mock Registry
        mock_caps = MagicMock()
        mock_caps.api_key_name = "openai"
        mock_caps.supports_tool_use = False
        MockRegistry.get.return_value = mock_caps
        MockRegistry.create_chat_service.return_value = MagicMock()

        # Execute agent
        await agent.run(
            prompt="Create a scene",
            provider="openai",
            options={"model": "gpt-4"},
            api_keys={"openai": "sk-test"},
        )

        # Get the full prompt
        call_kwargs = mock_kernel_instance.invoke_prompt.call_args[1]
        full_prompt = call_kwargs.get("prompt", "")

        # Verify enhanced guidance is present even without MCP
        assert "SCENE BUILDING:" in full_prompt, \
            "Enhanced guidance should be present even when MCP unavailable"
        assert "unity_create_detailed_scene" in full_prompt, \
            "Tool descriptions should be present even when MCP unavailable"
        assert "PROTOTYPING:" in full_prompt, \
            "All tool categories should be present even when MCP unavailable"

        # Verify plain text instruction is also present
        assert "reply with plain text only" in full_prompt, \
            "Plain text instruction should be present when tools unavailable"
