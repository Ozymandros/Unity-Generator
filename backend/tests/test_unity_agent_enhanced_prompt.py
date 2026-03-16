"""
Tests for UnityAgent enhanced system prompt capabilities.

Validates that the enhanced capabilities guidance includes all required
tool categories, workflow recommendations, and stays within token limits.
"""


from app.agents.unity_agent import UnityAgent


def test_enhanced_prompt_contains_all_tool_categories():
    """
    Property 1: System Prompt Contains All Tool Categories.

    Validates: Requirements 1.2, 1.3, 1.4, 1.5, 1.6, 1.7

    For any invocation of UnityAgent, the enhanced system prompt should
    contain guidance for all six tool categories: scene building, UI creation,
    animation & cutscenes, input & interaction, prototyping, and media import.
    """
    agent = UnityAgent()
    enhanced_prompt = agent._build_enhanced_capabilities_guidance()

    required_categories = [
        "SCENE BUILDING",
        "UI CREATION",
        "ANIMATION & CUTSCENES",
        "INPUT & INTERACTION",
        "PROTOTYPING",
        "MEDIA IMPORT",
    ]

    for category in required_categories:
        assert category in enhanced_prompt, f"Missing required category: {category}"


def test_enhanced_prompt_contains_workflow_recommendations():
    """
    Property 2: System Prompt Contains Workflow Recommendations.

    Validates: Requirements 1.8, 1.9, 1.10, 1.11, 1.12

    For any invocation of UnityAgent, the enhanced system prompt should
    contain workflow recommendations for animation workflows, cutscene
    workflows, and prototype workflows.
    """
    agent = UnityAgent()
    enhanced_prompt = agent._build_enhanced_capabilities_guidance()

    # Check for workflow recommendations section
    assert "WORKFLOW RECOMMENDATIONS" in enhanced_prompt, \
        "Missing WORKFLOW RECOMMENDATIONS section"

    # Check for specific workflow guidance
    workflow_patterns = [
        "For animations:",
        "Create animator",
        "Create prefab with Animator component",
        "For cutscenes:",
        "Create timeline",
        "For prototypes:",
        "unity_create_prototype_recipe",
        "validate with unity_validate_import",
    ]

    for pattern in workflow_patterns:
        assert pattern in enhanced_prompt, \
            f"Missing workflow recommendation pattern: {pattern}"


def test_enhanced_prompt_mentions_key_tools():
    """
    Verify enhanced system prompt mentions all key Unity-MCP-Server 3.0.5 tools.

    Validates: Requirements 1.2, 1.3, 1.4, 1.5, 1.6, 1.7

    The enhanced prompt should explicitly mention the most important tools
    from each category to guide the LLM in tool selection.
    """
    agent = UnityAgent()
    enhanced_prompt = agent._build_enhanced_capabilities_guidance()

    key_tools = [
        # Scene building tools
        "unity_create_detailed_scene",
        "unity_add_gameobject",
        "unity_create_material",
        "unity_create_prefab",
        # UI creation tools
        "unity_create_ui_canvas",
        "unity_create_ui_layout",
        # Animation & cutscene tools
        "unity_create_basic_animator",
        "unity_create_advanced_animator",
        "unity_create_timeline",
        # Input & interaction tools
        "unity_create_input_actions",
        # Prototyping tools
        "unity_create_prototype_recipe",
        # Media import tools
        "unity_save_texture",
        "unity_save_audio",
    ]

    for tool in key_tools:
        assert tool in enhanced_prompt, f"Missing key tool: {tool}"


def test_enhanced_prompt_token_limit():
    """
    Property 14: System Prompt Token Limit.

    Validates: Requirements 9.6, 12.5

    For any generated system prompt, the enhanced capabilities guidance
    should add no more than 2000 tokens to the base system message.

    Using a rough approximation of 4 characters per token (conservative
    estimate for English text), the enhanced prompt should be under
    8000 characters to stay well under the 2000 token limit.
    """
    agent = UnityAgent()
    enhanced_prompt = agent._build_enhanced_capabilities_guidance()

    # Rough token estimation: 1 token ≈ 4 characters
    # Target: < 2000 tokens = < 8000 characters
    char_count = len(enhanced_prompt)
    estimated_tokens = char_count / 4

    assert char_count < 8000, \
        f"Enhanced prompt too long: {char_count} chars (~{estimated_tokens:.0f} tokens). " \
        f"Should be under 8000 chars (~2000 tokens)"

    # Also verify it's not empty
    assert char_count > 100, \
        "Enhanced prompt is too short or empty"


def test_enhanced_prompt_scene_building_guidance():
    """
    Verify scene building guidance includes all required tools and descriptions.

    Validates: Requirement 1.2
    """
    agent = UnityAgent()
    enhanced_prompt = agent._build_enhanced_capabilities_guidance()

    scene_building_tools = [
        ("unity_create_detailed_scene", "multiple GameObjects"),
        ("unity_add_gameobject", "Cube, Sphere, Capsule, Light, Camera"),
        ("unity_create_material", "shader properties"),
        ("unity_create_prefab", "prefabs from GameObjects"),
    ]

    for tool_name, description_fragment in scene_building_tools:
        assert tool_name in enhanced_prompt, \
            f"Missing scene building tool: {tool_name}"
        # Verify tool has some description nearby
        tool_index = enhanced_prompt.find(tool_name)
        context = enhanced_prompt[tool_index:tool_index + 200]
        assert description_fragment in context, \
            f"Tool {tool_name} missing description about '{description_fragment}'"


def test_enhanced_prompt_ui_creation_guidance():
    """
    Verify UI creation guidance includes all required tools.

    Validates: Requirement 1.3
    """
    agent = UnityAgent()
    enhanced_prompt = agent._build_enhanced_capabilities_guidance()

    ui_tools = [
        ("unity_create_ui_canvas", "Canvas with elements"),
        ("unity_create_ui_layout", "complex UI layouts"),
    ]

    for tool_name, _description_fragment in ui_tools:
        assert tool_name in enhanced_prompt, \
            f"Missing UI creation tool: {tool_name}"


def test_enhanced_prompt_animation_cutscene_guidance():
    """
    Verify animation and cutscene guidance includes all required tools.

    Validates: Requirements 1.4, 1.9, 1.10
    """
    agent = UnityAgent()
    enhanced_prompt = agent._build_enhanced_capabilities_guidance()

    animation_tools = [
        ("unity_create_basic_animator", "simple Animator Controllers"),
        ("unity_create_advanced_animator", "blend trees and parameters"),
        ("unity_create_timeline", "Timeline assets for cutscenes"),
    ]

    for tool_name, _description_fragment in animation_tools:
        assert tool_name in enhanced_prompt, \
            f"Missing animation/cutscene tool: {tool_name}"


def test_enhanced_prompt_input_interaction_guidance():
    """
    Verify input and interaction guidance includes required tools.

    Validates: Requirement 1.5
    """
    agent = UnityAgent()
    enhanced_prompt = agent._build_enhanced_capabilities_guidance()

    assert "unity_create_input_actions" in enhanced_prompt, \
        "Missing input interaction tool: unity_create_input_actions"
    assert "Input System action maps" in enhanced_prompt, \
        "Missing description for Input System functionality"


def test_enhanced_prompt_prototyping_guidance():
    """
    Verify prototyping guidance includes required tools and workflow.

    Validates: Requirements 1.6, 1.11
    """
    agent = UnityAgent()
    enhanced_prompt = agent._build_enhanced_capabilities_guidance()

    assert "unity_create_prototype_recipe" in enhanced_prompt, \
        "Missing prototyping tool: unity_create_prototype_recipe"

    # Verify prototype types are mentioned
    prototype_types = ["FPS", "ThirdPerson", "TopDown", "Platformer"]
    for proto_type in prototype_types:
        assert proto_type in enhanced_prompt, \
            f"Missing prototype type: {proto_type}"

    # Verify it mentions creating complete setup
    assert "scene, player, camera, input, UI, and scripts" in enhanced_prompt, \
        "Missing description of complete prototype setup"


def test_enhanced_prompt_media_import_guidance():
    """
    Verify media import guidance includes all required tools.

    Validates: Requirement 1.7
    """
    agent = UnityAgent()
    enhanced_prompt = agent._build_enhanced_capabilities_guidance()

    media_tools = [
        ("unity_save_texture", "images as Unity textures"),
        ("unity_save_audio", "audio files as Unity audio clips"),
    ]

    for tool_name, _description_fragment in media_tools:
        assert tool_name in enhanced_prompt, \
            f"Missing media import tool: {tool_name}"


def test_enhanced_prompt_validation_workflow():
    """
    Verify the prompt includes guidance to validate imports.

    Validates: Requirement 1.12
    """
    agent = UnityAgent()
    enhanced_prompt = agent._build_enhanced_capabilities_guidance()

    assert "unity_validate_import" in enhanced_prompt, \
        "Missing validation tool: unity_validate_import"
    assert "validate" in enhanced_prompt.lower(), \
        "Missing validation guidance"


def test_enhanced_prompt_proactive_usage_guidance():
    """
    Verify the prompt encourages proactive tool usage.

    Validates: Requirement 1.8
    """
    agent = UnityAgent()
    enhanced_prompt = agent._build_enhanced_capabilities_guidance()

    # Check for guidance that encourages proactive tool use
    proactive_patterns = [
        "use these tools proactively",
        "When user requests",
    ]

    for pattern in proactive_patterns:
        assert pattern in enhanced_prompt, \
            f"Missing proactive usage guidance: {pattern}"


def test_enhanced_prompt_returns_string():
    """
    Verify the method returns a non-empty string.

    Basic sanity check for the method's return type and content.
    """
    agent = UnityAgent()
    result = agent._build_enhanced_capabilities_guidance()

    assert isinstance(result, str), \
        "Enhanced prompt should return a string"
    assert len(result) > 0, \
        "Enhanced prompt should not be empty"
    assert len(result.strip()) > 0, \
        "Enhanced prompt should contain non-whitespace content"


def test_enhanced_prompt_structure():
    """
    Verify the enhanced prompt has proper structure and formatting.

    The prompt should be well-organized with clear sections and
    readable formatting to help the LLM parse and understand it.
    """
    agent = UnityAgent()
    enhanced_prompt = agent._build_enhanced_capabilities_guidance()

    # Check for proper section headers (all caps with colons)
    section_headers = [
        "SCENE BUILDING:",
        "UI CREATION:",
        "ANIMATION & CUTSCENES:",
        "INPUT & INTERACTION:",
        "PROTOTYPING:",
        "MEDIA IMPORT:",
        "WORKFLOW RECOMMENDATIONS:",
    ]

    for header in section_headers:
        assert header in enhanced_prompt, \
            f"Missing properly formatted section header: {header}"

    # Verify sections appear in logical order
    last_index = 0
    for header in section_headers:
        current_index = enhanced_prompt.find(header)
        assert current_index > last_index, \
            f"Section {header} appears out of order"
        last_index = current_index
