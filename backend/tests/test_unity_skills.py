"""
Tests for Unity Semantic Kernel skills.

These tests verify that Unity skills work correctly and follow security best practices.
"""

from pathlib import Path
from tempfile import TemporaryDirectory

import pytest

from agents.unity_skills import UnityCodeSkill, UnityProjectSkill


class TestUnityCodeSkill:
    """Tests for UnityCodeSkill."""

    def test_init(self) -> None:
        """Test skill initialization."""
        skill = UnityCodeSkill("2022.3")
        assert skill.unity_version == "2022.3"
        assert skill._api_context is not None

    def test_generate_csharp_prompt(self) -> None:
        """Test prompt generation includes Unity context."""
        skill = UnityCodeSkill("2022.3")
        prompt = skill.generate_csharp("Create a player script")

        assert "Unity" in prompt
        assert "MonoBehaviour" in prompt
        assert "Create a player script" in prompt

    def test_generate_csharp_empty_prompt(self) -> None:
        """Test that empty prompt raises ValueError."""
        skill = UnityCodeSkill()
        with pytest.raises(ValueError, match="cannot be empty"):
            skill.generate_csharp("")

    def test_validate_syntax_valid_code(self) -> None:
        """Test syntax validation with valid code."""
        skill = UnityCodeSkill()
        valid_codes = [
            """
using UnityEngine;
public class TestScript : MonoBehaviour
{
    void Start() { Debug.Log("Hello"); }
}
""",
            # Escaped quotes
            'public class T { void S() { string s = "He said \\"Hello\\""; } }',
            # Comments with quotes
            'public class T { // "quote in comment"\n void S() {} }',
            # Nested braces and parens
            'public class T { void S() { if (true) { Debug.Log((1 + 1).ToString()); } } }'
        ]
        for code in valid_codes:
            assert skill.validate_syntax(code) is True

    def test_validate_syntax_invalid_code(self) -> None:
        """Test syntax validation detects errors."""
        skill = UnityCodeSkill()

        # Missing closing brace
        assert skill.validate_syntax("public class Test {") is False

        # Unbalanced parentheses
        assert skill.validate_syntax("public class T { void S() { Debug.Log(; } }") is False

        # Missing class keyword
        assert skill.validate_syntax("public T { }") is False

        # Empty code
        assert skill.validate_syntax("") is False
        assert skill.validate_syntax("   ") is False

    def test_extract_csharp_from_markdown(self) -> None:
        """Test extracting C# code from markdown."""
        skill = UnityCodeSkill()

        markdown = """Here's the code:
```csharp
public class Test {}
```
That's it."""

        extracted = skill.extract_csharp_code(markdown)
        assert "public class Test {}" in extracted
        assert "```" not in extracted

    def test_extract_csharp_from_plain_text(self) -> None:
        """Test extracting C# code from plain text."""
        skill = UnityCodeSkill()
        code = "public class Test : MonoBehaviour {}"
        extracted = skill.extract_csharp_code(code)
        assert extracted == code


class TestUnityProjectSkill:
    """Tests for UnityProjectSkill."""

    def test_init_default_output(self) -> None:
        """Test initialization with default output directory."""
        skill = UnityProjectSkill()
        assert skill.output_root.exists()
        assert skill.output_root.name == "output"

    def test_init_custom_output(self) -> None:
        """Test initialization with custom output directory."""
        with TemporaryDirectory() as tmpdir:
            skill = UnityProjectSkill(output_root=Path(tmpdir))
            assert skill.output_root == Path(tmpdir).resolve()

    def test_write_asset_safe_path(self) -> None:
        """Test writing asset with safe relative path."""
        with TemporaryDirectory() as tmpdir:
            skill = UnityProjectSkill(output_root=Path(tmpdir))

            path = skill.write_asset("Scripts/Test.cs", "public class Test {}")

            assert Path(path).exists()
            assert "Scripts" in path
            assert Path(path).read_text() == "public class Test {}"

    def test_write_asset_creates_directories(self) -> None:
        """Test that parent directories are created automatically."""
        with TemporaryDirectory() as tmpdir:
            skill = UnityProjectSkill(output_root=Path(tmpdir))

            path = skill.write_asset("Scripts/UI/Button.cs", "public class Button {}")

            assert Path(path).exists()
            assert Path(path).parent.exists()

    def test_write_asset_path_traversal_prevention(self) -> None:
        """Test that path traversal attacks are prevented."""
        with TemporaryDirectory() as tmpdir:
            skill = UnityProjectSkill(output_root=Path(tmpdir))

            # Attempt to escape output directory
            with pytest.raises(ValueError, match="would escape"):
                skill.write_asset("../../../etc/passwd", "malicious")

    def test_create_folder(self) -> None:
        """Test folder creation."""
        with TemporaryDirectory() as tmpdir:
            skill = UnityProjectSkill(output_root=Path(tmpdir))

            path = skill.create_folder("Scripts/UI")

            assert Path(path).exists()
            assert Path(path).is_dir()

    def test_get_output_path(self) -> None:
        """Test getting output path."""
        with TemporaryDirectory() as tmpdir:
            skill = UnityProjectSkill(output_root=Path(tmpdir))
            output_path = skill.get_output_path()

            assert output_path == str(Path(tmpdir).resolve())
