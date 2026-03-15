import logging
import sys
from typing import Any, cast

from ..agents.base import AsyncAgent, SyncAgent
from ..core.config import get_repo_root
from ..schemas import (
    AgentResult,
    AudioOptions,
    CodeOptions,
    ImageOptions,
    TextOptions,
    VideoOptions,
)
from .asset_saver import save_asset_to_project
from .providers import Modality, provider_registry

LOGGER = logging.getLogger(__name__)


class AgentManager:
    code_agent: SyncAgent | None
    text_agent: SyncAgent | None
    image_agent: SyncAgent | None
    audio_agent: SyncAgent | None
    unity_agent: AsyncAgent | None

    def _ensure_agents(self):
        if self.text_agent is not None:
            return
        try:
            from ..agents import (
                AudioAgent,
                CodeAgent,
                ImageAgent,
                TextAgent,
                UnityAgent,
            )
            self.code_agent = CodeAgent()
            self.text_agent = TextAgent()
            self.image_agent = ImageAgent()
            self.audio_agent = AudioAgent()
            self.unity_agent = UnityAgent()
        except Exception as e:
            LOGGER.error(f"Failed to load agents: {e}")

    def __init__(self) -> None:
        repo_root = get_repo_root()
        if str(repo_root) not in sys.path:
            sys.path.insert(0, str(repo_root))

        self.code_agent = None
        self.text_agent = None
        self.image_agent = None
        self.audio_agent = None
        self.unity_agent = None

    def run_code(
        self,
        prompt: str,
        provider: str | None,
        options: CodeOptions | dict[str, Any],
        api_key: str | None = None,
        system_prompt: str | None = None,
        project_path: str | None = None,
    ) -> AgentResult:
        self._ensure_agents()
        from ..repositories import get_api_key_repo, get_system_prompt_repo
        api_keys = cast(dict[str, str], get_api_key_repo().get_all())
        if provider and api_key:
            caps = provider_registry.get(provider)
            if caps and caps.api_key_name:
                api_keys[caps.api_key_name] = api_key

        if not self.code_agent:
            raise RuntimeError("CodeAgent is not available.")

        # Ensure options is a dict for the agent call
        opts = options.dict() if isinstance(options, CodeOptions) else options

        # Fallback to global preference if no system prompt provided
        effective_system_prompt = system_prompt
        if effective_system_prompt is None:
            effective_system_prompt = get_system_prompt_repo().get("code")

        result = self.code_agent.run(
            prompt, provider, opts, api_keys, effective_system_prompt
        )
        # Wrap result if it's a dict
        final_result = AgentResult(**result) if isinstance(result, dict) else result

        if project_path:
            rel = save_asset_to_project(project_path, "code", final_result)
            if rel:
                LOGGER.info("Saved code asset to project: %s", rel)
        else:
            LOGGER.debug("No project_path provided; code will not be saved to a Unity project.")

        return final_result

    def run_text(
        self,
        prompt: str,
        provider: str | None,
        options: TextOptions | dict[str, Any],
        api_key: str | None = None,
        system_prompt: str | None = None,
        project_path: str | None = None,
    ) -> AgentResult:
        self._ensure_agents()
        from ..repositories import get_api_key_repo, get_system_prompt_repo

        api_keys = cast(dict[str, str], get_api_key_repo().get_all())
        if provider and api_key:
            caps = provider_registry.get(provider)
            if caps and caps.api_key_name:
                api_keys[caps.api_key_name] = api_key

        if not self.text_agent:
            raise RuntimeError("TextAgent is not available.")

        opts = options.dict() if isinstance(options, TextOptions) else options

        # Fallback logic for text
        effective_system_prompt = system_prompt
        if effective_system_prompt is None:
            effective_system_prompt = get_system_prompt_repo().get("text")

        result = self.text_agent.run(
            prompt, provider, opts, api_keys, effective_system_prompt
        )
        final_result = AgentResult(**result) if isinstance(result, dict) else result

        if project_path:
            rel = save_asset_to_project(project_path, "text", final_result)
            if rel:
                LOGGER.info("Saved text asset to project: %s", rel)
        else:
            LOGGER.debug("No project_path provided; text will not be saved to a Unity project.")

        return final_result

    def run_image(
        self,
        prompt: str,
        provider: str | None,
        options: ImageOptions | dict[str, Any],
        api_key: str | None = None,
        system_prompt: str | None = None,
        project_path: str | None = None,
    ) -> AgentResult:
        self._ensure_agents()
        from ..repositories import get_api_key_repo, get_system_prompt_repo
        api_keys = cast(dict[str, str], get_api_key_repo().get_all())
        if provider and api_key:
            caps = provider_registry.get(provider)
            if caps and caps.api_key_name:
                api_keys[caps.api_key_name] = api_key

        if not self.image_agent:
            raise RuntimeError("ImageAgent is not available.")

        opts = options.dict() if isinstance(options, ImageOptions) else options

        # Fallback logic for image
        effective_system_prompt = system_prompt
        if effective_system_prompt is None:
            effective_system_prompt = get_system_prompt_repo().get("image")

        result = self.image_agent.run(
            prompt, provider, opts, api_keys, effective_system_prompt
        )
        final_result = AgentResult(**result) if isinstance(result, dict) else result

        if project_path:
            rel = save_asset_to_project(project_path, "image", final_result)
            if rel:
                LOGGER.info("Saved image asset to project: %s", rel)
        else:
            LOGGER.debug("No project_path provided; image will not be saved to a Unity project.")

        return final_result

    def run_audio(
        self,
        prompt: str,
        provider: str | None,
        options: AudioOptions | dict[str, Any],
        api_key: str | None = None,
        system_prompt: str | None = None,
        project_path: str | None = None,
        modality: str | None = None,
    ) -> AgentResult:
        self._ensure_agents()
        from ..repositories import get_api_key_repo, get_system_prompt_repo
        api_keys = cast(dict[str, str], get_api_key_repo().get_all())
        if provider and api_key:
            caps = provider_registry.get(provider)
            if caps and caps.api_key_name:
                api_keys[caps.api_key_name] = api_key

        if not self.audio_agent:
            raise RuntimeError("AudioAgent is not available.")

        opts = options.dict() if isinstance(options, AudioOptions) else options

        # Fallback logic for audio
        effective_system_prompt = system_prompt
        if effective_system_prompt is None:
            # Check if this is a music provider or TTS provider
            is_music = modality == "music"
            if not is_music:
                from ..core.db import get_pref
                current_provider = provider or get_pref("preferred_audio_provider")
                try:
                    if current_provider:
                        caps = provider_registry.get(current_provider)
                        if caps:
                            is_music = Modality.MUSIC in caps.modalities or caps.extra.get("is_music", False)
                except Exception:
                    pass

            prompt_key = "music" if is_music else "audio"
            effective_system_prompt = get_system_prompt_repo().get(prompt_key)

        result = self.audio_agent.run(
            prompt, provider, opts, api_keys, effective_system_prompt
        )
        final_result = AgentResult(**result) if isinstance(result, dict) else result

        if project_path:
            rel = save_asset_to_project(project_path, "audio", final_result)
            if rel:
                LOGGER.info("Saved audio asset to project: %s", rel)
        else:
            LOGGER.debug("No project_path provided; audio will not be saved to a Unity project.")

        return final_result

    def run_video(
        self,
        prompt: str,
        provider: str | None,
        options: VideoOptions | dict[str, Any],
        api_key: str | None = None,
        system_prompt: str | None = None,
        project_path: str | None = None,
    ) -> AgentResult:
        """
        Generate a video using the video provider service.

        Args:
            prompt: Description of the desired video.
            provider: Optional provider override.
            options: Video generation options.
            api_key: Optional per-request API key override.
            system_prompt: Optional system prompt.
            project_path: Optional path to save asset into.

        Returns:
            :class:`AgentResult` with video data.

        Raises:
            RuntimeError: If no video provider is available.

        Example:
            >>> manager = AgentManager()
            >>> result = manager.run_video("A sunrise", "runway", {})
            ... # doctest: +SKIP
        """
        from services.video_provider import generate_video

        from ..repositories import get_api_key_repo, get_system_prompt_repo

        api_keys = cast(dict[str, str], get_api_key_repo().get_all())
        if provider and api_key:
            caps = provider_registry.get(provider)
            if caps and caps.api_key_name:
                api_keys[caps.api_key_name] = api_key

        opts = options.model_dump() if isinstance(options, VideoOptions) else options

        effective_system_prompt = system_prompt
        if effective_system_prompt is None:
            effective_system_prompt = get_system_prompt_repo().get("video")

        result = generate_video(
            prompt, provider, opts, api_keys, effective_system_prompt
        )
        final_result = AgentResult(**result) if isinstance(result, dict) else result

        if project_path:
            save_asset_to_project(project_path, "video", final_result)

        return final_result

    async def run_unity(
        self,
        prompt: str,
        provider: str | None,
        options: dict[str, Any],
        api_key: str | None = None,
        system_prompt: str | None = None,
        project_path: str | None = None,
    ) -> AgentResult:
        """
        Runs the Unity Agent to orchestrate editor actions.
        """
        self._ensure_agents()
        from ..repositories import get_api_key_repo, get_system_prompt_repo

        api_keys = cast(dict[str, str], get_api_key_repo().get_all())
        if provider and api_key:
            caps = provider_registry.get(provider)
            if caps and caps.api_key_name:
                api_keys[caps.api_key_name] = api_key

        if not self.unity_agent:
            raise RuntimeError("UnityAgent is not available.")

        # Fallback logic for unity (default to code prompt since it writes C#)
        effective_system_prompt = system_prompt
        if effective_system_prompt is None:
            effective_system_prompt = get_system_prompt_repo().get("code")

        # UnityAgent.run is async and returns a dict
        result = await self.unity_agent.run(
            prompt, provider, options, api_keys, effective_system_prompt, project_path
        )
        # Ensure result is dict for type safety
        if not isinstance(result, dict):
            content = str(result)
            result = {"content": content}
        return AgentResult(
            content=str(result.get("content", "")),
            provider=provider or "unity",
            raw=result if isinstance(result, dict) else None,
            model=str(options.get("model", "")),
        )


    async def run_unity_ui(
        self,
        prompt: str,
        provider: str | None,
        options: dict[str, Any],
        api_key: str | None = None,
        ui_system: str = "ugui",
        element_type: str | None = None,
        output_format: str = "script",
        anchor_preset: str | None = None,
        color_theme: str | None = None,
        include_animations: bool = False,
        system_prompt: str | None = None,
        project_path: str | None = None,
    ) -> AgentResult:
        """
        Generate Unity UI prefab assets using a UI-aware system prompt.

        Builds a specialised system message for either uGUI (Canvas/RectTransform)
        or UI Toolkit (UXML/USS) and delegates to the UnityAgent.

        Args:
            prompt: Natural-language description of the UI element.
            provider: LLM provider name. Falls back to preferred_llm_provider pref.
            options: Provider-specific options (model, temperature, etc.).
            api_key: Optional per-request API key override.
            ui_system: ``"ugui"`` or ``"uitoolkit"``.
            element_type: Hint for element category (e.g. ``"health_bar"``).
            output_format: ``"script"``, ``"prefab_yaml"``, or ``"both"``.
            anchor_preset: RectTransform anchor hint (e.g. ``"stretch"``).
            color_theme: Optional colour/style hint injected into the prompt.
            include_animations: Whether to include animation/transition code.
            system_prompt: Optional full system prompt override (skips auto-build).
            project_path: Optional Unity project root path.

        Returns:
            :class:`AgentResult` with generated content and file list.

        Raises:
            RuntimeError: If UnityAgent is not available.
            ValueError: If prompt is empty.

        Example:
            >>> manager = AgentManager()
            >>> result = await manager.run_unity_ui(
            ...     "Create a health bar", "openai", {"model": "gpt-4o-mini"}
            ... )  # doctest: +SKIP
        """
        self._ensure_agents()
        from ..repositories import get_api_key_repo

        if not prompt or not prompt.strip():
            raise ValueError("prompt must be a non-empty string")

        api_keys = cast(dict[str, str], get_api_key_repo().get_all())
        if provider and api_key:
            caps = provider_registry.get(provider)
            if caps and caps.api_key_name:
                api_keys[caps.api_key_name] = api_key

        if not self.unity_agent:
            raise RuntimeError("UnityAgent is not available.")

        # Build UI-specific system prompt unless caller provides a full override.
        # Falls back to the user-configured global default for "unity_ui" if set,
        # then to the auto-built prompt derived from the request parameters.
        if system_prompt:
            effective_system_prompt = system_prompt
        else:
            from ..repositories import get_system_prompt_repo
            db_prompt = get_system_prompt_repo().get("unity_ui")
            effective_system_prompt = db_prompt or self._build_unity_ui_system_prompt(
                ui_system=ui_system,
                element_type=element_type,
                output_format=output_format,
                anchor_preset=anchor_preset,
                color_theme=color_theme,
                include_animations=include_animations,
            )

        result = await self.unity_agent.run(
            prompt=prompt,
            provider=provider,
            options=options,
            api_keys=api_keys,
            system_prompt=effective_system_prompt,
            project_path=project_path,
        )

        if not isinstance(result, dict):
            content = str(result)
            result = {"content": content}

        return AgentResult(
            content=str(result.get("content", "")),
            provider=provider or "unity",
            raw=result if isinstance(result, dict) else None,
            model=str(options.get("model", "")),
        )

    def _build_unity_ui_system_prompt(
        self,
        ui_system: str,
        element_type: str | None,
        output_format: str,
        anchor_preset: str | None,
        color_theme: str | None,
        include_animations: bool,
    ) -> str:
        """
        Build a Unity UI-specific system prompt based on the requested parameters.

        Args:
            ui_system: ``"ugui"`` for Canvas/uGUI or ``"uitoolkit"`` for UXML/USS.
            element_type: Optional element category hint (e.g. ``"health_bar"``).
            output_format: ``"script"``, ``"prefab_yaml"``, or ``"both"``.
            anchor_preset: Optional RectTransform anchor preset hint.
            color_theme: Optional colour/style hint.
            include_animations: Whether to include animation code.

        Returns:
            A complete system prompt string tailored for Unity UI generation.

        Example:
            >>> manager = AgentManager()
            >>> prompt = manager._build_unity_ui_system_prompt(
            ...     "ugui", "health_bar", "script", "stretch", None, False
            ... )
            >>> assert "uGUI" in prompt
            >>> assert "health_bar" in prompt
        """
        lines: list[str] = [
            "You are a senior Unity UI engineer specialising in game UI development.",
            "Generate clean, well-commented, production-ready Unity UI code.",
            "",
        ]

        element_hint = f" for a {element_type.replace('_', ' ')}" if element_type else ""

        if ui_system == "uitoolkit":
            lines += [
                f"TARGET SYSTEM: UI Toolkit (UXML/USS){element_hint}.",
                "- Generate UXML document structure with proper VisualElement hierarchy.",
                "- Generate companion USS stylesheet with scoped class selectors.",
                "- Use UI Toolkit's FlexBox layout model (flex-direction, align-items, justify-content).",
                "- Reference assets via resource paths (e.g. url('project://database/Assets/...'))",
                "- For runtime binding, generate a C# MonoBehaviour that queries the UXML via UQuery.",
                "- Place UXML files under Assets/UI/UXML/ and USS under Assets/UI/USS/.",
            ]
        else:
            lines += [
                f"TARGET SYSTEM: uGUI (Canvas-based){element_hint}.",
                "- Generate a C# MonoBehaviour script that creates the UI hierarchy at runtime.",
                "- Use Canvas, CanvasScaler (Scale With Screen Size), GraphicRaycaster.",
                "- Use RectTransform for all layout; prefer anchors over fixed positions.",
                "- Use TMP_Text (TextMeshPro) for all text elements.",
                "- Use Image component for backgrounds and icons.",
                "- Use Slider for progress bars (health bars, XP bars).",
                f"- Place generated prefab files under Assets/UI/{element_type or 'Elements'}/.",
            ]

        # Output format guidance
        if output_format == "prefab_yaml":
            lines += ["", "OUTPUT FORMAT: Prefab YAML — generate Unity .prefab YAML serialisation only."]
        elif output_format == "both":
            lines += ["", "OUTPUT FORMAT: Generate both the C# MonoBehaviour script AND the .prefab YAML."]
        else:
            lines += ["", "OUTPUT FORMAT: C# MonoBehaviour script only."]

        # Anchor preset
        if anchor_preset:
            anchor_map = {
                "full_screen": "Stretch both axes (anchorMin=(0,0), anchorMax=(1,1), offsets=0).",
                "top_left": "Anchor to top-left corner (anchorMin=anchorMax=(0,1)).",
                "center": "Anchor to center (anchorMin=anchorMax=(0.5,0.5)).",
                "stretch": "Stretch horizontally, anchor to center vertically.",
            }
            hint = anchor_map.get(anchor_preset, f"Use '{anchor_preset}' anchor preset.")
            lines.append(f"ANCHOR PRESET: {hint}")

        # Colour theme
        if color_theme:
            lines.append(f"COLOUR THEME: {color_theme}. Apply these colours to backgrounds, fills, and text.")

        # Animation
        if include_animations:
            lines += [
                "",
                "ANIMATIONS: Include smooth transition code.",
                "- For uGUI: use DOTween (if available) or Unity Coroutines for fade/scale/slide.",
                "- For UI Toolkit: use USS transitions (transition property) and USS animations.",
            ]

        lines += [
            "",
            "Always include XML doc comments on public members.",
            "Always validate that required components exist before accessing them.",
        ]

        return "\n".join(lines)


    async def run_unity_physics(
        self,
        prompt: str,
        provider: str | None,
        options: dict[str, Any],
        api_key: str | None = None,
        physics_backend: str = "physx",
        simulation_mode: str = "fixed_update",
        gravity_preset: str | None = None,
        include_rigidbody: bool = True,
        include_colliders: bool = True,
        include_layers: bool = False,
        system_prompt: str | None = None,
        project_path: str | None = None,
    ) -> AgentResult:
        """
        Generate Unity Physics configuration code using a physics-aware system prompt.

        Builds a specialised system message for either PhysX or DOTS physics and
        delegates to the UnityAgent.

        Args:
            prompt: Natural-language description of the physics behaviour.
            provider: LLM provider name. Falls back to preferred_llm_provider pref.
            options: Provider-specific options (model, temperature, etc.).
            api_key: Optional per-request API key override.
            physics_backend: ``"physx"`` (default) or ``"dots"``.
            simulation_mode: ``"fixed_update"``, ``"update"``, or ``"script"``.
            gravity_preset: Gravity hint (e.g. ``"earth"``, ``"moon"``, ``"zero_g"``).
            include_rigidbody: Whether to include Rigidbody component setup.
            include_colliders: Whether to include Collider component setup.
            include_layers: Whether to include Physics Layer matrix configuration.
            system_prompt: Optional full system prompt override (skips auto-build).
            project_path: Optional Unity project root path.

        Returns:
            :class:`AgentResult` with generated content and file list.

        Raises:
            RuntimeError: If UnityAgent is not available.
            ValueError: If prompt is empty.

        Example:
            >>> manager = AgentManager()
            >>> result = await manager.run_unity_physics(
            ...     "Set up a bouncy ball", "openai", {"model": "gpt-4o-mini"}
            ... )  # doctest: +SKIP
        """
        self._ensure_agents()
        from ..repositories import get_api_key_repo

        if not prompt or not prompt.strip():
            raise ValueError("prompt must be a non-empty string")

        api_keys = cast(dict[str, str], get_api_key_repo().get_all())
        if provider and api_key:
            caps = provider_registry.get(provider)
            if caps and caps.api_key_name:
                api_keys[caps.api_key_name] = api_key

        if not self.unity_agent:
            raise RuntimeError("UnityAgent is not available.")

        # Falls back to the user-configured global default for "unity_physics" if set,
        # then to the auto-built prompt derived from the request parameters.
        if system_prompt:
            effective_system_prompt = system_prompt
        else:
            from ..repositories import get_system_prompt_repo
            db_prompt = get_system_prompt_repo().get("unity_physics")
            effective_system_prompt = db_prompt or self._build_unity_physics_system_prompt(
                physics_backend=physics_backend,
                simulation_mode=simulation_mode,
                gravity_preset=gravity_preset,
                include_rigidbody=include_rigidbody,
                include_colliders=include_colliders,
                include_layers=include_layers,
            )

        result = await self.unity_agent.run(
            prompt=prompt,
            provider=provider,
            options=options,
            api_keys=api_keys,
            system_prompt=effective_system_prompt,
            project_path=project_path,
        )

        if not isinstance(result, dict):
            content = str(result)
            result = {"content": content}

        return AgentResult(
            content=str(result.get("content", "")),
            provider=provider or "unity",
            raw=result if isinstance(result, dict) else None,
            model=str(options.get("model", "")),
        )

    def _build_unity_physics_system_prompt(
        self,
        physics_backend: str,
        simulation_mode: str,
        gravity_preset: str | None,
        include_rigidbody: bool,
        include_colliders: bool,
        include_layers: bool,
    ) -> str:
        """
        Build a Unity Physics-specific system prompt based on the requested parameters.

        Args:
            physics_backend: ``"physx"`` or ``"dots"`` (DOTS/ECS physics).
            simulation_mode: ``"fixed_update"``, ``"update"``, or ``"script"``.
            gravity_preset: Optional gravity hint (``"earth"``, ``"moon"``, ``"zero_g"``).
            include_rigidbody: Whether to include Rigidbody setup guidance.
            include_colliders: Whether to include Collider setup guidance.
            include_layers: Whether to include Physics Layer matrix guidance.

        Returns:
            A complete system prompt string tailored for Unity Physics generation.

        Example:
            >>> manager = AgentManager()
            >>> prompt = manager._build_unity_physics_system_prompt(
            ...     "physx", "fixed_update", "earth", True, True, False
            ... )
            >>> assert "PhysX" in prompt
        """
        gravity_map = {
            "earth": "9.81 m/s² downward (standard Earth gravity).",
            "moon": "1.62 m/s² downward (lunar gravity).",
            "zero_g": "0 m/s² — zero gravity / space environment.",
            "low": "3.0 m/s² downward (low-gravity planet).",
            "high": "20.0 m/s² downward (high-gravity planet).",
        }

        lines: list[str] = [
            "You are a senior Unity physics engineer specialising in game physics configuration.",
            "Generate clean, well-commented, production-ready Unity physics code.",
            "",
        ]

        if physics_backend == "dots":
            lines += [
                "TARGET BACKEND: Unity DOTS Physics (Unity.Physics package).",
                "- Use PhysicsBody and PhysicsShape authoring components.",
                "- Generate ECS-compatible code using IComponentData and SystemBase/ISystem.",
                "- Use PhysicsWorld and PhysicsStep for simulation control.",
                "- Place generated files under Assets/Scripts/Physics/.",
            ]
        else:
            lines += [
                "TARGET BACKEND: Unity PhysX (built-in physics engine).",
                "- Use standard MonoBehaviour-based physics components.",
                "- Access physics via Rigidbody, Collider, and Physics.* static API.",
                "- Use Physics.gravity for global gravity settings.",
                "- Place generated files under Assets/Scripts/Physics/.",
            ]

        sim_map = {
            "fixed_update": "FixedUpdate() — standard physics timestep (recommended for Rigidbody).",
            "update": "Update() — frame-rate dependent (use only for kinematic or non-physics movement).",
            "script": "Script-driven via Physics.Simulate() — manual simulation stepping.",
        }
        lines.append(f"SIMULATION MODE: {sim_map.get(simulation_mode, simulation_mode)}")

        if gravity_preset:
            gravity_desc = gravity_map.get(gravity_preset, f"Custom preset: {gravity_preset}.")
            lines.append(f"GRAVITY: {gravity_desc} Set via Physics.gravity in an initialisation script.")

        if include_rigidbody:
            lines += [
                "",
                "RIGIDBODY SETUP: Include Rigidbody component configuration.",
                "- Set mass, drag, angularDrag, and interpolation mode.",
                "- Use RigidbodyConstraints where appropriate.",
                "- Prefer isKinematic=false for physics-driven objects.",
            ]

        if include_colliders:
            lines += [
                "",
                "COLLIDERS: Include Collider component setup.",
                "- Choose the most appropriate collider shape (Box, Sphere, Capsule, Mesh).",
                "- Configure PhysicMaterial with bounciness and friction values.",
                "- Use trigger colliders (isTrigger=true) for overlap detection.",
            ]

        if include_layers:
            lines += [
                "",
                "PHYSICS LAYERS: Include Physics Layer matrix configuration.",
                "- Define layer constants as a static class.",
                "- Use Physics.IgnoreLayerCollision() for layer interaction rules.",
                "- Document each layer's purpose with XML comments.",
            ]

        lines += [
            "",
            "Always include XML doc comments on public members.",
            "Always validate that required components exist (GetComponent with null check).",
            "Prefer [RequireComponent] attribute to enforce component dependencies.",
        ]

        return "\n".join(lines)


# Module-level singleton
agent_manager = AgentManager()
