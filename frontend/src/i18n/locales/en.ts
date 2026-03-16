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
      scenes: "Scenes",
      code: "Code",
      text: "Text",
      image: "Image",
      sprites: "Sprites",
      audio: "Audio",
      unityUi: "Unity UI",
      unityPhysics: "Unity Physics",
      unityProject: "Unity Project",
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
    },
    actions: {
      generate: "Create Scene",
    },
    mediaReady: "Media Ready to Import",
    mediaReadyText: "{type} \"{name}\" is ready to be imported to Unity. Review the prompt below and click \"Create Scene\" to proceed.",
    mediaTypeImage: "Image",
    mediaTypeAudio: "Audio",
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
    },
    actions: {
      generate: "Generate UI",
    },
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
    },
    actions: {
      generate: "Generate Physics Config",
    },
    quickActions: "Quick Actions",
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
      resultJson: "Result (JSON)",
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
  },
} as const;
