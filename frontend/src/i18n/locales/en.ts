/**
 * English (en) locale — default language.
 * All other locales must mirror this structure exactly.
 */
export default {
  // ── App shell ──────────────────────────────────────────────────────────────
  app: {
    title: "Unity Generator",
    status: {
      online: "Online",
      offline: "Offline",
    },
    nav: {
      settings: "Settings",
      wizard: "Wizard",
      scenes: "Scenes",
      code: "Code",
      text: "Text",
      image: "Image",
      sprites: "Sprites",
      audio: "Audio",
      video: "Video",
      unityMcp: "Unity MCP",
      unityLighting: "Unity Lighting",
      unityCamera: "Unity Camera",
      unityMaterials: "Unity Materials",
      unityAnimations: "Unity Animations",
      unityUi: "Unity UI",
      unityPhysics: "Unity Physics",
      unityProject: "Unity Project",
      logs: "Logs",
    },
    actions: {
      repository: "Repository",
    },
  },

  // ── Common / shared ────────────────────────────────────────────────────────
  common: {
    loading: "Loading…",
    saving: "Saving…",
    save: "Save",
    cancel: "Cancel",
    close: "Close",
    ok: "OK",
    yes: "Yes",
    no: "No",
    error: "Error",
    warning: "Warning",
    success: "Success",
    generate: "Generate",
    result: "Result",
    provider: "Provider",
    model: "Model",
    temperature: "Temperature",
    apiKey: "API Key (Optional Override)",
    systemPrompt: "System Prompt Override",
    advancedOptions: "Advanced Options",
    examplePrompts: "Example Prompts",
    manageModels: "Manage models",
    selectProvider: "Select Provider",
    selectModel: "Select Model",
    prompt: "Prompt",
    leaveEmptyForGlobalKey: "Leave empty to use global key",
    createdFiles: "Created Files",
    viewSteps: "View Steps ({n})",
    waitingForLogs: "Waiting for logs…",
    errorsDetected: "Errors Detected",
    enhancePrompt: "Enhance prompt",
    samplePrompt: "Sample prompt",
  },

  // ── Settings panel ─────────────────────────────────────────────────────────
  settings: {
    title: "Configuration",
    subtitle: "Manage your intelligence engines, models, and system prompts.",
    tabs: {
      general: "General",
      providers: "Providers",
      models: "Models",
      prompts: "Prompts",
      secrets: "Secrets",
    },
  },

  // ── General settings section ───────────────────────────────────────────────
  general: {
    title: "General Preferences",
    sections: {
      networkApi: "Network & API",
      preferredIntelligence: "Preferred Intelligence",
      appearance: "Appearance",
      language: "Language",
    },
    fields: {
      backendUrl: "Backend URL",
      backendUrlHint: "The address of your Unity Generator backend service",
      outputBasePath: "Base path (output)",
      outputBasePathHint: "Where generated files are saved",
      unityEditorPath: "Unity Editor Path (optional)",
      unityEditorPathHint: "Full path to the Unity Editor executable",
      preferredLlm: "Default Text / Logic Provider",
      preferredLlmModel: "Default Text / Logic Model",
      preferredImage: "Default Image Generation Provider",
      preferredImageModel: "Default Image Generation Model",
      preferredAudio: "Default Speech (TTS) Provider",
      preferredAudioModel: "Default Speech (TTS) Model",
      preferredMusic: "Default Music Generation Provider",
      preferredMusicModel: "Default Music Generation Model",
      theme: "Theme",
      language: "Interface Language",
    },
    actions: {
      saveAll: "Save All Changes",
    },
    status: {
      saving: "Saving…",
      saved: "Preferences saved successfully.",
      modelNotRegistered: 'Model "{model}" is not registered for provider "{provider}".',
      networkError: "Network error: Failed to reach backend.",
    },
  },

  // ── Code panel ─────────────────────────────────────────────────────────────
  code: {
    title: "Unity C# Code",
    subtitle: "Generate Unity C# scripts using AI.",
    fields: {
      prompt: "Prompt",
      maxTokens: "Max Tokens",
    },
    actions: {
      generate: "Generate Code",
    },
    activeProject: "Active Project: {name}",
    autoSave: "Auto-save to project",
  },

  // ── Text panel ─────────────────────────────────────────────────────────────
  text: {
    title: "Text Generation",
    subtitle: "Generate text content using AI.",
    fields: {
      prompt: "Prompt",
      length: "Length",
    },
    actions: {
      generate: "Generate Text",
    },
  },

  // ── Image panel ────────────────────────────────────────────────────────────
  image: {
    title: "Image Generation",
    subtitle: "Generate images using AI.",
    fields: {
      prompt: "Prompt",
      aspectRatio: "Aspect Ratio",
      quality: "Quality",
      textureName: "Texture Name",
      textureType: "Texture Type",
    },
    actions: {
      generate: "Generate Image",
      saveToUnity: "Save to Unity",
    },
  },

  // ── Sprites panel ──────────────────────────────────────────────────────────
  sprites: {
    title: "2D Sprites",
    badge: "Pixel Art Optimized",
    subtitle: "Generate 2D sprite assets for Unity.",
    fields: {
      prompt: "Prompt",
      resolution: "Resolution",
      paletteSize: "Palette Size",
      autoCrop: "Auto-Crop Transparent Edges",
      colors: "{n} colors",
    },
    preview: "Preview Area",
    actions: {
      generate: "Generate Sprites",
    },
  },

  // ── Audio panel ────────────────────────────────────────────────────────────
  audio: {
    title: "Audio Generation",
    subtitle: "Generate audio assets using AI.",
    generationType: "Generation Type",
    speechTts: "Speech (TTS)",
    atmosphericMusic: "Atmospheric Music",
    fields: {
      prompt: "Prompt",
      musicDescription: "Music Description",
      speechPrompt: "Speech Prompt",
      voiceOptional: "Voice (optional)",
      musicModel: "Music Model",
      stability: "Stability",
      audioClipName: "Audio Clip Name",
      audioFormat: "Audio Format",
    },
    actions: {
      generate: "Generate Audio",
      saveToUnity: "Save to Unity",
    },
  },

  // ── Scenes panel ──────────────────────────────────────────────────────────
  scenes: {
    title: "Scene Creator",
    subtitle: "Generate Unity scenes using AI.",
    fields: {
      prompt: "Scene Description",
      applyViaMcp: "Apply via MCP tools",
    },
    actions: {
      generate: "Create Scene",
    },
    mediaReady: "Media Ready to Import",
    mediaReadyText: "{type} \"{name}\" is ready to be imported to Unity. Review the prompt below and click \"Create Scene\" to proceed.",
    mediaTypeImage: "Image",
    mediaTypeAudio: "Audio",
    mcpLiveEditor: "Unity MCP is live with Editor-backed tools available.",
    mcpLiveFileOnly: "Unity MCP is live in file-only mode. Editor-gated tools will be skipped.",
  },

  // ── Unity UI panel ─────────────────────────────────────────────────────────
  unityUi: {
    title: "Unity UI",
    subtitle: "Generate Unity UI components using AI.",
    fields: {
      uiSystem: "UI System",
      elementType: "Element Type",
      prompt: "UI Element Description",
      outputFormat: "Output Format",
      anchorPreset: "Anchor Preset",
      colourTheme: "Colour Theme (optional)",
      includeAnimations: "Include animations",
      applyViaMcp: "Apply via MCP tools",
    },
    actions: {
      generate: "Generate UI",
    },
    mcpLiveEditor: "Unity MCP is live with Editor-backed tools available.",
    mcpLiveFileOnly: "Unity MCP is live in file-only mode. File-only UI is a compatibility-surrogate.",
  },

  // ── Unity Physics panel ────────────────────────────────────────────────────
  unityPhysics: {
    title: "Unity Physics",
    subtitle: "Generate Unity physics configuration — Rigidbodies, colliders, gravity, and more.",
    fields: {
      physicsBackend: "Physics Backend",
      simulationMode: "Simulation Mode",
      gravityPreset: "Gravity Preset",
      prompt: "Physics Description",
      includeRigidbody: "Include Rigidbody setup",
      includeColliders: "Include Collider setup",
      includeLayers: "Include Physics Layers",
      applyViaMcp: "Apply via MCP tools",
    },
    actions: {
      generate: "Generate Physics Config",
    },
    quickActions: "Quick Actions",
    mcpLiveEditor: "Unity MCP is live with Editor-backed tools available.",
    mcpLiveFileOnly: "Unity MCP is live in file-only mode. File-only physics is a compatibility-surrogate.",
  },

  wizard: {
    title: "Unity Wizard",
    subtitle: "One goal, multi-tool orchestration across the full MCP surface.",
    mcpReady: "Unity MCP is available for wizard orchestration.",
    actions: { run: "Run Wizard" },
  },

  unityMcpHub: {
    title: "Unity MCP Hub",
    subtitle: "Focused panels for engine automation — not an 89-tool explorer.",
    statusOnline: "Unity MCP server is reachable.",
    statusOffline: "Unity MCP server is not configured or unreachable.",
    toolCount: "{n} typed tools registered",
    cards: {
      wizard: "Wizard",
      scenes: "Scenes",
      lighting: "Lighting",
      camera: "Camera",
      materials: "Materials",
      animations: "Animations",
      ui: "Unity UI",
      physics: "Physics",
    },
    descriptions: {
      wizard: "Multi-step orchestration with the full tool surface.",
      scenes: "Create and edit scenes and GameObjects.",
      lighting: "Directional, point, spot, and area lights.",
      camera: "Main and gameplay camera setups.",
      materials: "Materials and texture assignment.",
      animations: "Animators and Timeline assets.",
      ui: "Canvas and UI Toolkit layouts.",
      physics: "PhysX and DOTS physics configuration.",
    },
  },

  unityLighting: {
    title: "Unity Lighting",
    subtitle: "Configure lights via unity_light_* MCP tools.",
    quickActions: "Quick Actions",
    promptPlaceholder: "Describe the lighting setup you want...",
    applyViaMcp: "Apply via MCP tools",
    mcpLiveEditor: "Unity MCP is live with Editor-backed lighting tools.",
    mcpLiveFileOnly: "Unity MCP is live in file-only mode for lighting surrogates.",
    actions: { generate: "Generate Lighting" },
  },

  unityCamera: {
    title: "Unity Camera",
    subtitle: "Configure cameras via unity_camera_* MCP tools.",
    quickActions: "Quick Actions",
    promptPlaceholder: "Describe the camera setup you want...",
    applyViaMcp: "Apply via MCP tools",
    mcpLiveEditor: "Unity MCP is live with Editor-backed camera tools.",
    mcpLiveFileOnly: "Unity MCP is live in file-only mode for camera surrogates.",
    actions: { generate: "Generate Camera Setup" },
  },

  unityMaterials: {
    title: "Unity Materials",
    subtitle: "Create materials via unity_create_material and related tools.",
    quickActions: "Quick Actions",
    promptPlaceholder: "Describe the materials you want...",
    applyViaMcp: "Apply via MCP tools",
    mcpLiveEditor: "Unity MCP is live with material tools.",
    mcpLiveFileOnly: "Unity MCP is live in file-only mode for material surrogates.",
    actions: { generate: "Generate Materials" },
  },

  unityAnimation: {
    title: "Unity Animations",
    subtitle: "Animators and timelines via animation MCP tools.",
    quickActions: "Quick Actions",
    promptPlaceholder: "Describe the animation or timeline you want...",
    applyViaMcp: "Apply via MCP tools",
    mcpLiveEditor: "Unity MCP is live with animation tools.",
    mcpLiveFileOnly: "Unity MCP is live in file-only mode for animation surrogates.",
    actions: { generate: "Generate Animation" },
  },

  video: {
    title: "Video",
    subtitle: "Generate cinematic video prompts and clips (provider stub until connected).",
    duration: "Duration (seconds)",
    resolution: "Resolution",
    aspectRatio: "Aspect ratio",
    actions: { generate: "Generate Video" },
  },

  logs: {
    title: "Logs",
    subtitle: "Backend generation log tail.",
    refresh: "Refresh",
    loadFailed: "Could not load logs.",
  },

  // ── Unity Project panel ────────────────────────────────────────────────────
  unityProject: {
    title: "Unity Project",
    subtitle: "Generate a complete Unity project structure.",
    engineSettings: "Unity Engine Settings",
    fields: {
      projectName: "Project Name",
      unityTemplate: "Unity Template",
      unityVersion: "Unity Version",
      targetPlatform: "Target Platform",
      generateDefaultScene: "Generate Default Scene",
      autoInstallPackages: "Auto-Install UPM Packages",
      setupUrp: "Setup URP",
      upmPackages: "UPM Packages (comma-separated)",
      sceneName: "Scene Name",
      unityEditorPath: "Unity Editor Path (optional)",
      timeout: "Timeout (seconds)",
      automationMode: "Automation mode",
      resultJson: "Result (JSON)",
    },
    mcp: {
      title: "Unity MCP integration",
      editorReady: "Unity MCP server is reachable and Unity Editor is connected.",
      editorRequired:
        "Unity MCP server is reachable, but Unity Editor is not connected. Open your project in Unity Editor, then refresh.",
      notConfigured:
        "Unity MCP server is not reachable from the backend. Ensure unity-mcp is on PATH or set UNITY_MCP_COMMAND.",
      standaloneNote:
        "Unity Generator runs as a standalone app (not inside Unity). MCP automates an open Unity Editor session.",
      refresh: "Refresh MCP status",
    },
    actions: {
      generate: "Generate Project",
      finalize: "Finalize Project",
      openFolder: "Open Output Folder",
      addVersion: "Add Unity Version",
      downloadZip: "Download Finalized Project (.zip)",
    },
    dialogs: {
      addVersion: {
        title: "Add Unity Version",
        versionId: "Version ID",
        label: "Label (optional)",
      },
    },
  },

  // ── Theme toggle ───────────────────────────────────────────────────────────
  theme: {
    light: "Light",
    dark: "Dark",
    system: "System",
  },

  // ── Language names (shown in selector) ────────────────────────────────────
  languages: {
    en: "English",
    es: "Spanish",
    ca: "Catalan",
    eu: "Basque",
    oc: "Occitan",
    uk: "Ukrainian",
    pt: "Portuguese",
    gl: "Galician",
    fr: "French",
    it: "Italian",
    pl: "Polish",
    zh: "Chinese",
    ar: "Arabic",
    de: "German",
    hi: "Hindi",
    bn: "Bengali",
    ur: "Urdu",
    id: "Indonesian",
    ja: "Japanese",
    vi: "Vietnamese",
    ko: "Korean",
    tr: "Turkish",
  },
} as const;
