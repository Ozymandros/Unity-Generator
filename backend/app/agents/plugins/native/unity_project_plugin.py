"""
UnityProjectPlugin - Native Plugin for Unity file management.

This plugin manages Unity project structure, .meta file generation,
and file system operations asynchronously and securely.
"""

import logging
import uuid
from pathlib import Path

try:
    from semantic_kernel.functions import kernel_function
except ImportError:
    def kernel_function(func=None, name=None, description=None):
        if func is not None and callable(func):
            return func
        def decorator(f):
            return f
        return decorator


from ....core.config import get_repo_root

LOGGER = logging.getLogger(__name__)


class UnityProjectPlugin:
    """
    Native plugin for managing Unity projects.

    Provides functions to create folder structures, generate .meta files,
    and write C# scripts within the Unity project structure.
    """

    def __init__(self, output_root: Path | None = None):
        """
        Initialize the plugin with the output directory.

        Args:
            output_root: Root directory for Unity projects.
                        Default: "output" relative to repo root.

        Example:
            >>> plugin = UnityProjectPlugin()
            >>> plugin.output_root.name
            'output'
        """
        if output_root is None:
            repo_root = get_repo_root()
            output_root = repo_root / "output"

        self.output_root = Path(output_root).resolve()
        self.output_root.mkdir(parents=True, exist_ok=True)

        LOGGER.info(
            f"UnityProjectPlugin initialized with output root: {self.output_root}"
        )

    @kernel_function(
        name="create_folder_structure",
        description="Generates Unity folder structure (Assets/Scripts, Assets/Textures, etc.)",
    )
    def create_folder_structure(self, project_name: str) -> str:
        """
        Create the basic folder structure for a Unity project.

        Args:
            project_name: Name of the Unity project.

        Returns:
            Absolute path to the created project directory.

        Raises:
            ValueError: If project_name is empty or contains invalid characters.

        Example:
            >>> plugin = UnityProjectPlugin()
            >>> path = plugin.create_folder_structure("MyGame")
            >>> "MyGame" in path
            True
            >>> Path(path).exists()
            True
        """
        if not project_name or not project_name.strip():
            raise ValueError("project_name cannot be empty")

        # Clean the project name
        safe_name = "".join(
            c if c.isalnum() or c in "_-" else "_" for c in project_name.strip()
        )
        if not safe_name:
            safe_name = "UnityProject"

        project_dir = self.output_root / safe_name
        project_dir.mkdir(parents=True, exist_ok=True)

        # Standard Unity structure
        folders = [
            "Assets/Scripts",
            "Assets/Textures",
            "Assets/Audio",
            "Assets/Materials",
            "Assets/Prefabs",
            "Assets/Scenes",
            "ProjectSettings",
        ]

        created_folders = []
        for folder in folders:
            folder_path = project_dir / folder
            folder_path.mkdir(parents=True, exist_ok=True)
            created_folders.append(str(folder_path))

            # Generate .meta for folders
            self.generate_meta_file(str(folder_path), is_folder=True)

        LOGGER.info(f"Created Unity project structure at {project_dir}")
        return str(project_dir)

    @kernel_function(
        name="generate_meta_file",
        description="Creates a Unity .meta file for a generated asset",
    )
    def generate_meta_file(
        self,
        file_path: str,
        is_folder: bool = False,
        guid: str | None = None,
        texture_type: int = 1,  # Default to Texture
        sprite_mode: int = 0,  # Default to Single
        ppu: int = 100,
    ) -> str:
        """
        Generate a Unity .meta file to avoid import errors.

        Args:
            file_path: Path to the original file or folder.
            is_folder: If True, generates a .meta for a folder.
            guid: Optional GUID. If not provided, a new UUID is generated.
            texture_type: Unity TextureImporterType (default 1=Texture, 8=Sprite).
            sprite_mode: Unity SpriteImportMode (default 0=Single, 1=Single, 2=Multiple).
            ppu: Pixels Per Unit for Sprites.

        Returns:
            Path to the created .meta file.
        """
        if not file_path:
            raise ValueError("file_path cannot be empty")

        path = Path(file_path)
        meta_path = path.with_suffix(path.suffix + ".meta")
        guid_value = guid or uuid.uuid4().hex

        if is_folder:
            content = f"""fileFormatVersion: 2
guid: {guid_value}
folderAsset: yes
DefaultImporter:
  externalObjects: {{}}
  userData:
  assetBundleName:
  assetBundleVariant:
"""
        elif path.suffix == ".cs":
            # MonoImporter for C# scripts
            content = f"""fileFormatVersion: 2
guid: {guid_value}
MonoImporter:
  externalObjects: {{}}
  serializedVersion: 2
  defaultReferences: []
  executionOrder: 0
  icon: {{instanceID: 0}}
  userData:
  assetBundleName:
  assetBundleVariant:
"""
        elif path.suffix in [".png", ".jpg", ".jpeg", ".tga"]:
            # TextureImporter for textures and sprites
            # If resolution is low (pixel art), use Point filter
            filter_mode = 0 if ppu <= 256 else 1  # 0: Point, 1: Bilinear

            content = f"""fileFormatVersion: 2
guid: {guid_value}
TextureImporter:
  fileIDToRecycleName: {{}}
  externalObjects: {{}}
  serializedVersion: 12
  mipmaps:
    mipMapMode: 0
    enableMipMap: 0
    sRGBTexture: 1
  textureType: {texture_type}
  textureShape: 1
  singleChannelComponent: 0
  filterMode: {filter_mode}
  aniso: 1
  mipmapBias: 0
  wrapMode: 0
  textureFormat: 1
  maxTextureSize: 2048
  textureCompression: 1
  compressionQuality: 50
  spriteMode: {sprite_mode}
  spritePixelsToUnits: {ppu}
  spriteMeshType: 1
  spritePivot: {{x: 0.5, y: 0.5}}
  spriteBorder: {{x: 0, y: 0, z: 0, w: 0}}
  spriteGenerateFallbackPhysicsShape: 1
  alphaIsTransparency: 1
  spriteTessellationDetail: -1
  atlasGenerateRect: 1
  androidETC2FallbackOverride: 0
  secondaryTextures: []
  platformSettings: []
  userData:
  assetBundleName:
  assetBundleVariant:
"""
        elif path.suffix in [".mp3", ".wav", ".ogg"]:
            # AudioImporter for audio
            content = f"""fileFormatVersion: 2
guid: {guid_value}
AudioImporter:
  externalObjects: {{}}
  serializedVersion: 2
  defaultSettings:
    loadType: 0
    sampleRateSetting: 0
    sampleRateOverride: 44100
    compressionFormat: 1
    quality: 1
    conversionMode: 0
  platformSettings: []
  userData:
  assetBundleName:
  assetBundleVariant:
"""
        else:
            # DefaultImporter for other types
            content = f"""fileFormatVersion: 2
guid: {guid_value}
DefaultImporter:
  externalObjects: {{}}
  userData:
  assetBundleName:
  assetBundleVariant:
"""

        try:
            meta_path.write_text(content, encoding="utf-8")
            LOGGER.debug(f"Generated .meta file at {meta_path}")
            return str(meta_path)
        except Exception as e:
            LOGGER.error(f"Failed to write .meta file: {e}")
            raise OSError(f"Failed to write .meta file: {e}")

    @kernel_function(
        name="write_csharp_script",
        description="Writes C# code to GeneratedScript.cs using pathlib.Path",
    )
    def write_csharp_script(
        self,
        project_path: str,
        script_name: str,
        code: str,
        relative_path: str = "Assets/Scripts",
    ) -> str:
        """
        Write a C# script within the Unity project structure.

        Args:
            project_path: Path to the Unity project directory.
            script_name: Name of the script file (without .cs extension).
            code: C# code content.
            relative_path: Relative path within the project (default: Assets/Scripts).

        Returns:
            Absolute path to the created script file.

        Raises:
            ValueError: If any parameter is invalid.
            IOError: If the file cannot be written.

        Example:
            >>> plugin = UnityProjectPlugin()
            >>> project = plugin.create_folder_structure("TestProject")
            >>> script_path = plugin.write_csharp_script(project, "Player", "public class Player {}")
            >>> "Player.cs" in script_path
            True
            >>> Path(script_path).exists()
            True
        """
        if not project_path:
            raise ValueError("project_path cannot be empty")

        if not script_name:
            raise ValueError("script_name cannot be empty")

        if not code or not code.strip():
            raise ValueError("code cannot be empty")

        # Clean the script name
        safe_script_name = "".join(
            c if c.isalnum() or c in "_-" else "_" for c in script_name.strip()
        )
        if not safe_script_name.endswith(".cs"):
            safe_script_name += ".cs"

        # Build the full path
        project_dir = Path(project_path).resolve()
        script_path = (project_dir / relative_path / safe_script_name).resolve()

        # Security: ensure we're within the project
        try:
            script_path.relative_to(project_dir)
        except ValueError:
            raise ValueError(
                f"Script path would escape project directory: {script_path}"
            )

        # Create parent directory if it doesn't exist
        script_path.parent.mkdir(parents=True, exist_ok=True)

        # Write the file
        try:
            script_path.write_text(code, encoding="utf-8")
            LOGGER.info(f"Wrote C# script to {script_path}")

            # Generate the corresponding .meta file
            self.generate_meta_file(str(script_path))

            return str(script_path)
        except Exception as e:
            LOGGER.error(f"Failed to write C# script: {e}")
            raise OSError(f"Failed to write script: {e}")

