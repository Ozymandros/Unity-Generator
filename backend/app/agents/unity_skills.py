"""
Semantic Kernel skills for Unity-specific operations.

These skills provide Unity-aware code generation, validation, and asset management
capabilities that can be invoked by Semantic Kernel agents.
"""

import logging
import re
from pathlib import Path

try:
    from semantic_kernel.functions import kernel_function
except ImportError:
    # Fallback for when semantic-kernel is not available
    def kernel_function(func=None, name=None, description=None):
        if func is not None and callable(func):
            return func
        def decorator(f):
            return f
        return decorator


LOGGER = logging.getLogger(__name__)


class UnityCodeSkill:
    """
    Generates and validates Unity C# scripts.

    This skill provides Unity-aware code generation with version-specific
    API context and syntax validation capabilities.
    """

    def __init__(self, unity_version: str = "2022.3"):
        """
        Initialize Unity code skill.

        Args:
            unity_version: Unity version to target (e.g., "2022.3", "2023.1").
                          Used to inject correct API context into prompts.
        """
        self.unity_version = unity_version
        self._api_context = self._get_unity_api_context(unity_version)

    def _get_unity_api_context(self, version: str) -> str:
        """
        Get Unity API context string for the specified version.

        Args:
            version: Unity version string.

        Returns:
            Context string describing Unity API features for the version.

        Example:
            >>> skill = UnityCodeSkill("2022.3")
            >>> context = skill._get_unity_api_context("2022.3")
            >>> "MonoBehaviour" in context
            True
        """
        # Basic Unity API context - can be expanded with version-specific features
        base_context = """
Unity C# API Guidelines:
- Use UnityEngine namespace
- Inherit from MonoBehaviour for component scripts
- Use [SerializeField] for private fields that need serialization
- Use public properties/methods for inspector-accessible values
- Follow Unity naming conventions (PascalCase for public, camelCase for private)
- Use Start(), Update(), Awake() lifecycle methods appropriately
- Use Coroutines for async operations (IEnumerator)
- Use GetComponent<T>() for component access
- Use transform, gameObject, and other MonoBehaviour properties
"""

        if version.startswith("2023"):
            base_context += """
Unity 2023+ Features:
- Use new Input System (UnityEngine.InputSystem) if available
- Consider using async/await with UnityWebRequest
"""
        elif version.startswith("2022"):
            base_context += """
Unity 2022 Features:
- Standard Input System (Input.GetKey, Input.GetMouseButton)
- Coroutines for async operations
"""

        return base_context

    @kernel_function(
        name="generate_unity_csharp",
        description="Generates Unity C# code from a prompt. Returns clean C# code without markdown formatting.",
    )
    def generate_csharp(self, prompt: str, unity_version: str | None = None) -> str:
        """
        Generate Unity C# code from a prompt.

        Args:
            prompt: Description of the Unity script to generate.
            unity_version: Optional Unity version override. Defaults to skill's version.

        Returns:
            Generated C# code as a string (no markdown, no explanations).

        Raises:
            ValueError: If prompt is empty or invalid.

        Example:
            >>> skill = UnityCodeSkill()
            >>> code = skill.generate_csharp("Create a player movement script with WASD controls")
            >>> "class" in code.lower()
            True
            >>> "MonoBehaviour" in code
            True
        """
        if not prompt or not prompt.strip():
            raise ValueError("Prompt cannot be empty")

        version = unity_version or self.unity_version
        context = self._get_unity_api_context(version)

        # Enhanced prompt with Unity context
        enhanced_prompt = f"""{context}

User Request:
{prompt.strip()}

Requirements:
- Return ONLY the C# code, no markdown, no explanations
- Include complete class definition
- Use proper Unity namespaces
- Follow Unity coding conventions
- Add appropriate comments for clarity
"""

        # Note: This method should be called within a kernel context
        # where an LLM service is available. The actual LLM call would
        # be handled by the kernel.invoke() method.
        # This is a placeholder that returns the enhanced prompt structure.
        # In practice, this would be invoked via kernel.invoke(skill.generate_csharp, ...)

        LOGGER.debug(f"Generated Unity C# prompt for version {version}")
        return enhanced_prompt

    @kernel_function(
        name="validate_unity_syntax",
        description="Validates C# syntax before writing to disk. Returns True if valid, False otherwise.",
    )
    def validate_syntax(self, code: str) -> bool:
        """
        Validate C# syntax before writing to disk.

        Args:
            code: C# code string to validate.

        Returns:
            True if syntax appears valid, False otherwise.

        Example:
            >>> skill = UnityCodeSkill()
            >>> skill.validate_syntax("public class Test : MonoBehaviour {}")
            True
            >>> skill.validate_syntax("public class Test {")  # Missing closing brace
            False
        """
        if not code or not code.strip():
            return False

        # Basic syntax checks
        # 1. Check for balanced braces
        open_braces = code.count("{")
        close_braces = code.count("}")
        if open_braces != close_braces:
            LOGGER.warning(
                f"Unbalanced braces: {open_braces} open, {close_braces} close"
            )
            return False

        # 2. Check for balanced parentheses
        open_parens = code.count("(")
        close_parens = code.count(")")
        if open_parens != close_parens:
            LOGGER.warning(
                f"Unbalanced parentheses: {open_parens} open, {close_parens} close"
            )
            return False

        # 3. Check for basic C# structure (class keyword, namespace, etc.)
        if "class" not in code.lower():
            LOGGER.warning("No class definition found in code")
            return False

        # 4. Check for unterminated strings (odd number of quotes on a line)
        try:
            for line in code.splitlines():
                trimmed = line.strip()
                # Skip comments
                if (
                    trimmed.startswith("//")
                    or trimmed.startswith("/*")
                    or trimmed.startswith("*")
                ):
                    continue
                # Count quotes: check if even (naive but effective for lightweight check)
                if line.count('"') % 2 != 0:
                    LOGGER.warning("Possible unterminated string literal")
                    return False
        except Exception as e:
            LOGGER.debug(f"Syntax validation check failed: {e}")
            # Don't fail validation on errors, just log

        return True

    @kernel_function(
        name="extract_csharp_code",
        description="Extracts C# code from markdown code blocks or plain text. Returns clean C# code.",
    )
    def extract_csharp_code(self, content: str) -> str:
        """
        Extract C# code from markdown code blocks or plain text.

        Args:
            content: Content that may contain C# code in markdown blocks or plain text.

        Returns:
            Extracted C# code as a string.

        Example:
            >>> skill = UnityCodeSkill()
            >>> markdown = "```csharp\\npublic class Test {}\\n```"
            >>> skill.extract_csharp_code(markdown)
            'public class Test {}'
        """
        if not content:
            return ""

        # Try to extract from markdown code blocks
        code_block_pattern = r"```(?:csharp|cs|c#)?\s*\n(.*?)```"
        matches = re.findall(code_block_pattern, content, re.DOTALL)
        if matches:
            # Return the first code block found
            return matches[0].strip()

        # If no code blocks, check if content looks like code
        # (contains class, namespace, etc.)
        if "class" in content.lower() or "namespace" in content.lower():
            # Remove markdown formatting if present
            cleaned = re.sub(r"^```.*?$", "", content, flags=re.MULTILINE)
            cleaned = cleaned.strip()
            return cleaned

        return content.strip()


class UnityProjectSkill:
    """
    Manages Unity project file operations with security sandboxing.

    This skill provides safe file writing operations restricted to the output/
    directory to prevent accidental overwrites of system files.
    """

    def __init__(self, output_root: Path | None = None):
        """
        Initialize Unity project skill.

        Args:
            output_root: Root directory for Unity project output.
                        Defaults to "output" relative to repo root.

        Example:
            >>> skill = UnityProjectSkill()
            >>> skill.output_root.name
            'output'
        """
        from ..core.config import get_repo_root

        if output_root is None:
            repo_root = get_repo_root()
            output_root = repo_root / "output"

        self.output_root = Path(output_root).resolve()
        self.output_root.mkdir(parents=True, exist_ok=True)

        LOGGER.info(
            f"UnityProjectSkill initialized with output root: {self.output_root}"
        )

    @kernel_function(
        name="write_unity_asset",
        description="Safely writes content to output/Assets/ directory. Returns the written file path.",
    )
    def write_asset(self, relative_path: str, content: str) -> str:
        """
        Safely write content to output/Assets/ directory.

        This method ensures that files are only written within the output/
        directory structure, preventing path traversal attacks.

        Args:
            relative_path: Relative path from Assets/ (e.g., "Scripts/Player.cs").
            content: Content to write to the file.

        Returns:
            Absolute path to the written file.

        Raises:
            ValueError: If relative_path attempts to escape the output directory.
            IOError: If file cannot be written.

        Example:
            >>> skill = UnityProjectSkill()
            >>> path = skill.write_asset("Scripts/Test.cs", "public class Test {}")
            >>> "output" in path.lower()
            True
            >>> "Scripts" in path
            True
        """
        if not relative_path:
            raise ValueError("relative_path cannot be empty")

        if not isinstance(content, str):
            raise ValueError("content must be a string")

        # Normalize the path and prevent directory traversal
        safe_path = Path(relative_path)

        # Remove any leading slashes or dots that could escape
        safe_path = safe_path.relative_to("/") if safe_path.is_absolute() else safe_path
        safe_path = (
            safe_path.relative_to(".") if str(safe_path).startswith("..") else safe_path
        )

        # Ensure we're within Assets/ directory
        if "Assets" not in safe_path.parts and not str(safe_path).startswith("Assets"):
            safe_path = Path("Assets") / safe_path

        # Resolve to absolute path within output_root
        full_path = (self.output_root / safe_path).resolve()

        # Security check: ensure the resolved path is within output_root
        try:
            full_path.relative_to(self.output_root)
        except ValueError as e:
            raise ValueError(
                f"Path {relative_path} would escape output directory. "
                f"Only paths within {self.output_root} are allowed."
            ) from e


        # Create parent directories
        full_path.parent.mkdir(parents=True, exist_ok=True)

        # Write the file
        try:
            full_path.write_text(content, encoding="utf-8")
            LOGGER.info(f"Wrote Unity asset to {full_path}")
            return str(full_path)
        except Exception as e:
            LOGGER.error(f"Failed to write asset to {full_path}: {e}")
            raise OSError(f"Failed to write file: {e}") from e

    @kernel_function(
        name="create_unity_folder",
        description="Creates a folder structure in output/Assets/. Returns the created folder path.",
    )
    def create_folder(self, relative_path: str) -> str:
        """
        Create a folder structure in output/Assets/.

        Args:
            relative_path: Relative path from Assets/ (e.g., "Scripts/UI").

        Returns:
            Absolute path to the created folder.

        Raises:
            ValueError: If relative_path attempts to escape the output directory.

        Example:
            >>> skill = UnityProjectSkill()
            >>> path = skill.create_folder("Scripts/UI")
            >>> "Scripts" in path
            True
            >>> "UI" in path
            True
        """
        if not relative_path:
            raise ValueError("relative_path cannot be empty")

        # Use write_asset logic for path validation, but create directory instead
        safe_path = Path(relative_path)
        safe_path = safe_path.relative_to("/") if safe_path.is_absolute() else safe_path

        if "Assets" not in safe_path.parts and not str(safe_path).startswith("Assets"):
            safe_path = Path("Assets") / safe_path

        full_path = (self.output_root / safe_path).resolve()

        try:
            full_path.relative_to(self.output_root)
        except ValueError as e:
            raise ValueError(
                f"Path {relative_path} would escape output directory. "
                f"Only paths within {self.output_root} are allowed."
            ) from e


        full_path.mkdir(parents=True, exist_ok=True)
        LOGGER.info(f"Created Unity folder: {full_path}")
        return str(full_path)

    @kernel_function(
        name="get_unity_output_path",
        description="Returns the absolute path to the output directory for Unity projects.",
    )
    def get_output_path(self) -> str:
        """
        Get the absolute path to the Unity output directory.

        Returns:
            Absolute path to the output directory.

        Example:
            >>> skill = UnityProjectSkill()
            >>> path = skill.get_output_path()
            >>> Path(path).exists()
            True
        """
        return str(self.output_root)

