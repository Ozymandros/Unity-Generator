/**
 * Catalan (ca) locale.
 */
export default {
  app: {
    title: "Unity Generator",
    status: {
      online: "En línia",
      offline: "Sense connexió",
    },
    nav: {
      settings: "Configuració",
      scenes: "Escenes",
      code: "Codi",
      text: "Text",
      image: "Imatge",
      sprites: "Sprites",
      audio: "Àudio",
      unityUi: "Unity UI",
      unityPhysics: "Unity Física",
      unityProject: "Projecte Unity",
    },
    actions: {
      repository: "Repositori",
    },
  },

  common: {
    loading: "Carregant…",
    saving: "Desant…",
    save: "Desa",
    cancel: "Cancel·la",
    close: "Tanca",
    ok: "D'acord",
    yes: "Sí",
    no: "No",
    error: "Error",
    warning: "Avís",
    success: "Èxit",
    generate: "Genera",
    result: "Resultat",
    provider: "Proveïdor",
    model: "Model",
    temperature: "Temperatura",
    apiKey: "Clau API (substitució opcional)",
    systemPrompt: "Substitució del prompt de sistema",
    advancedOptions: "Opcions avançades",
    examplePrompts: "Exemples de prompts",
    manageModels: "Gestiona models",
    selectProvider: "Selecciona proveïdor",
    selectModel: "Selecciona model",
    prompt: "Prompt",
    leaveEmptyForGlobalKey: "Deixa buit per usar la clau global",
    createdFiles: "Fitxers creats",
    viewSteps: "Veure passos ({n})",
    waitingForLogs: "Esperant registres…",
    errorsDetected: "Errors detectats",
  },

  settings: {
    title: "Configuració",
    subtitle: "Gestiona els teus motors d'intel·ligència, models i prompts de sistema.",
    tabs: {
      general: "General",
      providers: "Proveïdors",
      models: "Models",
      prompts: "Prompts",
      secrets: "Secrets",
    },
  },

  general: {
    title: "Preferències generals",
    sections: {
      networkApi: "Xarxa i API",
      preferredIntelligence: "Intel·ligència preferida",
      appearance: "Aparença",
      language: "Idioma",
    },
    fields: {
      backendUrl: "URL del backend",
      backendUrlHint: "L'adreça del teu servei backend de Unity Generator",
      outputBasePath: "Ruta base (sortida)",
      outputBasePathHint: "On es desen els fitxers generats",
      unityEditorPath: "Ruta de l'editor Unity (opcional)",
      unityEditorPathHint: "Ruta completa a l'executable de l'editor Unity",
      preferredLlm: "Proveïdor de text / lògica predeterminat",
      preferredLlmModel: "Model de text / lògica predeterminat",
      preferredImage: "Proveïdor de generació d'imatges predeterminat",
      preferredImageModel: "Model de generació d'imatges predeterminat",
      preferredAudio: "Proveïdor de veu (TTS) predeterminat",
      preferredAudioModel: "Model de veu (TTS) predeterminat",
      preferredMusic: "Proveïdor de música predeterminat",
      preferredMusicModel: "Model de música predeterminat",
      theme: "Tema",
      language: "Idioma de la interfície",
    },
    actions: {
      saveAll: "Desa tots els canvis",
    },
    status: {
      saving: "Desant…",
      saved: "Preferències desades correctament.",
      modelNotRegistered: 'El model "{model}" no està registrat per al proveïdor "{provider}".',
      networkError: "Error de xarxa: no es pot connectar amb el backend.",
    },
  },

  code: {
    title: "Codi C# per a Unity",
    subtitle: "Genera scripts C# per a Unity amb IA.",
    fields: {
      prompt: "Prompt",
      maxTokens: "Tokens màxims",
    },
    actions: {
      generate: "Genera codi",
    },
    activeProject: "Projecte actiu: {name}",
    autoSave: "Desa automàticament al projecte",
  },

  text: {
    title: "Generació de text",
    subtitle: "Genera contingut de text amb IA.",
    fields: {
      prompt: "Prompt",
      length: "Longitud",
    },
    actions: {
      generate: "Genera text",
    },
  },

  image: {
    title: "Generació d'imatges",
    subtitle: "Genera imatges amb IA.",
    fields: {
      prompt: "Prompt",
      aspectRatio: "Relació d'aspecte",
      quality: "Qualitat",
      textureName: "Nom de la textura",
      textureType: "Tipus de textura",
    },
    actions: {
      generate: "Genera imatge",
      saveToUnity: "Desa a Unity",
    },
  },

  sprites: {
    title: "Sprites 2D",
    badge: "Optimitzat per a Pixel Art",
    subtitle: "Genera sprites 2D per a Unity.",
    fields: {
      prompt: "Prompt",
      resolution: "Resolució",
      paletteSize: "Mida de la paleta",
      autoCrop: "Retall automàtic de vores transparents",
      colors: "{n} colors",
    },
    preview: "Àrea de previsualització",
    actions: {
      generate: "Genera sprites",
    },
  },

  audio: {
    title: "Generació d'àudio",
    subtitle: "Genera recursos d'àudio amb IA.",
    generationType: "Tipus de generació",
    speechTts: "Veu (TTS)",
    atmosphericMusic: "Música ambiental",
    fields: {
      prompt: "Prompt",
      musicDescription: "Descripció musical",
      speechPrompt: "Prompt de veu",
      voiceOptional: "Veu (opcional)",
      musicModel: "Model de música",
      stability: "Estabilitat",
      audioClipName: "Nom del clip d'àudio",
      audioFormat: "Format d'àudio",
    },
    actions: {
      generate: "Genera àudio",
      saveToUnity: "Desa a Unity",
    },
  },

  scenes: {
    title: "Creador d'escenes",
    subtitle: "Genera escenes de Unity amb IA.",
    fields: {
      prompt: "Descripció de l'escena",
    },
    actions: {
      generate: "Crea escena",
    },
    mediaReady: "Multimèdia llesta per importar",
    mediaReadyText: "{type} \"{name}\" està llesta per importar-se a Unity. Revisa el prompt i fes clic a \"Crea escena\" per continuar.",
    mediaTypeImage: "Imatge",
    mediaTypeAudio: "Àudio",
  },

  unityUi: {
    title: "Unity UI",
    subtitle: "Genera components d'UI per a Unity amb IA.",
    fields: {
      uiSystem: "Sistema d'UI",
      elementType: "Tipus d'element",
      prompt: "Descripció de l'element UI",
      outputFormat: "Format de sortida",
      anchorPreset: "Preset d'ancoratge",
      colourTheme: "Tema de color (opcional)",
      includeAnimations: "Inclou animacions",
    },
    actions: {
      generate: "Genera UI",
    },
  },

  unityPhysics: {
    title: "Unity Física",
    subtitle: "Genera configuració de física per a Unity — Rigidbodies, col·lisionadors, gravetat i més.",
    fields: {
      physicsBackend: "Motor de física",
      simulationMode: "Mode de simulació",
      gravityPreset: "Preset de gravetat",
      prompt: "Descripció de la física",
      includeRigidbody: "Inclou configuració de Rigidbody",
      includeColliders: "Inclou configuració de col·lisionadors",
      includeLayers: "Inclou capes de física",
    },
    actions: {
      generate: "Genera configuració de física",
    },
    quickActions: "Accions ràpides",
  },

  unityProject: {
    title: "Projecte Unity",
    subtitle: "Genera una estructura completa de projecte Unity.",
    engineSettings: "Configuració del motor Unity",
    fields: {
      projectName: "Nom del projecte",
      unityTemplate: "Plantilla de Unity",
      unityVersion: "Versió de Unity",
      targetPlatform: "Plataforma de destinació",
      generateDefaultScene: "Genera escena predeterminada",
      autoInstallPackages: "Instal·la paquets UPM automàticament",
      setupUrp: "Configura URP",
      upmPackages: "Paquets UPM (separats per comes)",
      sceneName: "Nom de l'escena",
      unityEditorPath: "Ruta de l'editor Unity (opcional)",
      timeout: "Temps d'espera (segons)",
      resultJson: "Resultat (JSON)",
    },
    actions: {
      generate: "Genera projecte",
      finalize: "Finalitza projecte",
      openFolder: "Obre la carpeta de sortida",
      addVersion: "Afegeix versió de Unity",
      downloadZip: "Descarrega el projecte finalitzat (.zip)",
    },
    dialogs: {
      addVersion: {
        title: "Afegeix versió de Unity",
        versionId: "ID de versió",
        label: "Etiqueta (opcional)",
      },
    },
  },

  theme: {
    light: "Clar",
    dark: "Fosc",
    system: "Sistema",
  },

  languages: {
    en: "Anglès",
    es: "Castellà",
    ca: "Català",
    eu: "Euskara",
    oc: "Occità",
    uk: "Ucrainès",
  },
} as const;
