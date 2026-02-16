import json
import logging
from dataclasses import dataclass

try:
    from semantic_kernel.functions import kernel_function
except ImportError:
    # Fallback for when semantic-kernel is not available/mocking
    def kernel_function(func=None, name=None, description=None):
        if func is not None and callable(func):
            return func

        def decorator(f):
            return f

        return decorator


from services.unity_mcp_client import UnityMCPClient

LOGGER = logging.getLogger(__name__)


@dataclass
class MCPToolSchema:
    """Helper for tool metadata."""

    name: str
    description: str
    input_schema: dict
    required_params: list[str]


class UnityMCPPlugin:
    """
    Semantic Kernel Plugin acting as a bridge to the Unity MCP Server.
    Exposes Unity Editor automation tools to the AI Agent.
    """

    def __init__(self, host: str = "localhost", port: int = 8765):
        self.client = UnityMCPClient(host, port)
        self.tools: dict[str, MCPToolSchema] = {}
        self._initialized = False

    @kernel_function(name="ping", description="Checks connectivity to the Unity MCP Server.")
    async def ping(self) -> str:
        """Checks if the Unity Editor is reachable."""
        try:
            result = await self.client.ping()
            return json.dumps({"status": "connected", "message": result})
        except Exception as e:
            return json.dumps({"status": "error", "message": str(e)})

    @kernel_function(
        name="unity_list_assets",
        description="Lists files and directories in a specific Unity project path (relative to project root).",
    )
    async def list_assets(self, path: str = "Assets") -> str:
        """
        Lists assets in the specified directory.

        Args:
            path: Relative path to list (default: "Assets").
                  Use forward slashes.
        """
        try:
            result = await self.client.send_request("unity_list_assets", {"path": path})
            return json.dumps(result, indent=2)
        except Exception as e:
            LOGGER.error(f"unity_list_assets failed: {e}")
            return f"Error listing assets: {str(e)}"

    @kernel_function(
        name="unity_create_script", description="Creates a new Unity C# script (MonoBehaviour) at the specified path."
    )
    async def create_script(self, path: str, script_name: str) -> str:
        """
        Creates a new C# script.

        Args:
            path: Directory path where the script serves (e.g., "Assets/Scripts").
            script_name: Name of the class/file (without .cs extension).
        """
        try:
            result = await self.client.send_request("unity_create_script", {"path": path, "scriptName": script_name})
            return f"Script created: {result}"
        except Exception as e:
            return f"Error creating script: {str(e)}"

    @kernel_function(name="unity_create_scene", description="Creates a new Unity Scene (.unity) at the specified path.")
    async def create_scene(self, path: str) -> str:
        """
        Creates a new scene.

        Args:
            path: Full path for the new scene (e.g., "Assets/Scenes/MyLevel.unity").
        """
        try:
            result = await self.client.send_request("unity_create_scene", {"path": path})
            return f"Scene created: {result}"
        except Exception as e:
            return f"Error creating scene: {str(e)}"

    @kernel_function(name="unity_create_gameobject", description="Creates a new GameObject in the specified scene.")
    async def create_gameobject(self, scene_path: str, game_object_name: str) -> str:
        """
        Creates a new empty GameObject.

        Args:
            scene_path: Path to the scene file (must be open/active ideally, or server handles it).
            game_object_name: Name of the new object.
        """
        try:
            result = await self.client.send_request(
                "unity_create_gameobject", {"scenePath": scene_path, "gameObjectName": game_object_name}
            )
            return f"GameObject created: {result}"
        except Exception as e:
            return f"Error creating game object: {str(e)}"

    @kernel_function(
        name="unity_create_asset",
        description="Creates a generic text-based asset (material, text, json, etc) at the specified path.",
    )
    async def create_asset(self, path: str, content: str) -> str:
        """
        Creates a generic file asset.

        Args:
            path: Full asset path (e.g., "Assets/Data/config.json").
            content: String content of the file.
        """
        try:
            result = await self.client.send_request("unity_create_asset", {"path": path, "content": content})
            return f"Asset created: {result}"
        except Exception as e:
            return f"Error creating asset: {str(e)}"

    @kernel_function(
        name="unity_build_project", description="Triggers a Unity Build Pipeline for the specified target."
    )
    async def build_project(self, target: str, output_path: str) -> str:
        """
        Builds the project.

        Args:
            target: Build target (Win64, OSX, Linux64, Android, iOS).
            output_path: Absolute path for the build output.
        """
        try:
            result = await self.client.send_request(
                "unity_build_project", {"target": target, "outputPath": output_path}
            )
            return f"Build started/completed: {result}"
        except Exception as e:
            return f"Error building project: {str(e)}"
