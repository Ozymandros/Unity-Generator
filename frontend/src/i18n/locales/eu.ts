/**
 * Basque (eu) locale.
 */
export default {
  app: {
    title: "Unity Generator",
    status: {
      online: "Konektatuta",
      offline: "Deskonektatuta",
    },
    nav: {
      settings: "Ezarpenak",
      scenes: "Eszenak",
      code: "Kodea",
      text: "Testua",
      image: "Irudia",
      sprites: "Sprites",
      audio: "Audioa",
      unityUi: "Unity UI",
      unityPhysics: "Unity Fisika",
      unityProject: "Unity Proiektua",
    },
    actions: {
      repository: "Biltegia",
    },
  },

  common: {
    loading: "Kargatzen…",
    saving: "Gordetzen…",
    save: "Gorde",
    cancel: "Utzi",
    close: "Itxi",
    ok: "Ados",
    yes: "Bai",
    no: "Ez",
    error: "Errorea",
    warning: "Abisua",
    success: "Arrakasta",
    generate: "Sortu",
    result: "Emaitza",
    provider: "Hornitzailea",
    model: "Eredua",
    temperature: "Tenperatura",
    apiKey: "API Gakoa (aukerako gainidazketa)",
    systemPrompt: "Sistema-promptaren gainidazketa",
    advancedOptions: "Aukera aurreratuak",
    examplePrompts: "Prompt adibideak",
    manageModels: "Ereduak kudeatu",
    selectProvider: "Hautatu hornitzailea",
    selectModel: "Hautatu eredua",
    prompt: "Promptа",
    leaveEmptyForGlobalKey: "Utzi hutsik gako globala erabiltzeko",
    createdFiles: "Sortutako fitxategiak",
    viewSteps: "Urratsak ikusi ({n})",
    waitingForLogs: "Erregistroak zain…",
    errorsDetected: "Erroreak hauteman dira",
  },

  settings: {
    title: "Konfigurazioa",
    subtitle: "Kudeatu zure adimen-motorrak, ereduak eta sistema-promptak.",
    tabs: {
      general: "Orokorra",
      providers: "Hornitzaileak",
      models: "Ereduak",
      prompts: "Promptak",
      secrets: "Sekretuak",
    },
  },

  general: {
    title: "Hobespen orokorrak",
    sections: {
      networkApi: "Sarea eta API",
      preferredIntelligence: "Adimen hobetsia",
      appearance: "Itxura",
      language: "Hizkuntza",
    },
    fields: {
      backendUrl: "Backend URLa",
      backendUrlHint: "Zure Unity Generator backend zerbitzuaren helbidea",
      outputBasePath: "Oinarrizko bidea (irteera)",
      outputBasePathHint: "Sortutako fitxategiak non gordetzen diren",
      unityEditorPath: "Unity editoraren bidea (aukerakoa)",
      unityEditorPathHint: "Unity editoraren exekutagarriaren bide osoa",
      preferredLlm: "Testu/logika hornitzaile lehenetsia",
      preferredLlmModel: "Testu/logika eredu lehenetsia",
      preferredImage: "Irudi-sorkuntza hornitzaile lehenetsia",
      preferredImageModel: "Irudi-sorkuntza eredu lehenetsia",
      preferredAudio: "Ahotsa (TTS) hornitzaile lehenetsia",
      preferredAudioModel: "Ahotsa (TTS) eredu lehenetsia",
      preferredMusic: "Musika hornitzaile lehenetsia",
      preferredMusicModel: "Musika eredu lehenetsia",
      theme: "Gaia",
      language: "Interfazearen hizkuntza",
    },
    actions: {
      saveAll: "Aldaketa guztiak gorde",
    },
    status: {
      saving: "Gordetzen…",
      saved: "Hobespenak ondo gorde dira.",
      modelNotRegistered: '"{model}" eredua ez dago "{provider}" hornitzailean erregistratuta.',
      networkError: "Sare-errorea: ezin da backendarekin konektatu.",
    },
  },

  code: {
    title: "Unity C# Kodea",
    subtitle: "Sortu Unity C# scriptak AI erabiliz.",
    fields: {
      prompt: "Promptа",
      maxTokens: "Token gehienekoa",
    },
    actions: {
      generate: "Kodea sortu",
    },
    activeProject: "Proiektu aktiboa: {name}",
    autoSave: "Automatikoki gorde proiektuan",
  },

  text: {
    title: "Testu-sorkuntza",
    subtitle: "Sortu testu-edukia AI erabiliz.",
    fields: {
      prompt: "Promptа",
      length: "Luzera",
    },
    actions: {
      generate: "Testua sortu",
    },
  },

  image: {
    title: "Irudi-sorkuntza",
    subtitle: "Sortu irudiak AI erabiliz.",
    fields: {
      prompt: "Promptа",
      aspectRatio: "Alderdi-erlazioa",
      quality: "Kalitatea",
      textureName: "Ehunduraren izena",
      textureType: "Ehundura mota",
    },
    actions: {
      generate: "Irudia sortu",
      saveToUnity: "Unity-n gorde",
    },
  },

  sprites: {
    title: "2D Sprites",
    badge: "Pixel Art-erako optimizatua",
    subtitle: "Sortu Unity-rako 2D sprite aktiboak.",
    fields: {
      prompt: "Promptа",
      resolution: "Bereizmena",
      paletteSize: "Paleta-tamaina",
      autoCrop: "Ertz garden automatikoa moztu",
      colors: "{n} kolore",
    },
    preview: "Aurrebista-eremua",
    actions: {
      generate: "Sprites sortu",
    },
  },

  audio: {
    title: "Audio-sorkuntza",
    subtitle: "Sortu audio-aktiboak AI erabiliz.",
    generationType: "Sorkuntza mota",
    speechTts: "Ahotsa (TTS)",
    atmosphericMusic: "Giro-musika",
    fields: {
      prompt: "Promptа",
      musicDescription: "Musika-deskribapena",
      speechPrompt: "Ahots-promptа",
      voiceOptional: "Ahotsa (aukerakoa)",
      musicModel: "Musika-eredua",
      stability: "Egonkortasuna",
      audioClipName: "Audio kliparen izena",
      audioFormat: "Audio formatua",
    },
    actions: {
      generate: "Audioa sortu",
      saveToUnity: "Unity-n gorde",
    },
  },

  scenes: {
    title: "Eszena-sortzailea",
    subtitle: "Sortu Unity eszenak AI erabiliz.",
    fields: {
      prompt: "Eszena-deskribapena",
    },
    actions: {
      generate: "Eszena sortu",
    },
    mediaReady: "Multimedia inportatzeko prest",
    mediaReadyText: "{type} \"{name}\" Unity-n inportatzeko prest dago. Berrikusi promptа eta egin klik \"Eszena sortu\" jarraitzeko.",
    mediaTypeImage: "Irudia",
    mediaTypeAudio: "Audioa",
  },

  unityUi: {
    title: "Unity UI",
    subtitle: "Sortu Unity UI osagaiak AI erabiliz.",
    fields: {
      uiSystem: "UI sistema",
      elementType: "Elementu mota",
      prompt: "UI elementuaren deskribapena",
      outputFormat: "Irteera formatua",
      anchorPreset: "Aingura aurrezarria",
      colourTheme: "Kolore-gaia (aukerakoa)",
      includeAnimations: "Animazioak sartu",
    },
    actions: {
      generate: "UI sortu",
    },
  },

  unityPhysics: {
    title: "Unity Fisika",
    subtitle: "Sortu Unity fisika-konfigurazioa — Rigidbodies, kolisagailuak, grabitatea eta gehiago.",
    fields: {
      physicsBackend: "Fisika-motorra",
      simulationMode: "Simulazio modua",
      gravityPreset: "Grabitate aurrezarria",
      prompt: "Fisika-deskribapena",
      includeRigidbody: "Rigidbody konfigurazioa sartu",
      includeColliders: "Kolisagailu konfigurazioa sartu",
      includeLayers: "Fisika-geruzak sartu",
    },
    actions: {
      generate: "Fisika-konfigurazioa sortu",
    },
    quickActions: "Ekintza azkarrak",
  },

  unityProject: {
    title: "Unity Proiektua",
    subtitle: "Sortu Unity proiektu-egitura osoa.",
    engineSettings: "Unity motor-ezarpenak",
    fields: {
      projectName: "Proiektuaren izena",
      unityTemplate: "Unity txantiloia",
      unityVersion: "Unity bertsioa",
      targetPlatform: "Helburu-plataforma",
      generateDefaultScene: "Lehenetsitako eszena sortu",
      autoInstallPackages: "UPM paketeak automatikoki instalatu",
      setupUrp: "URP konfiguratu",
      upmPackages: "UPM paketeak (komaz bereizita)",
      sceneName: "Eszenaren izena",
      unityEditorPath: "Unity editoraren bidea (aukerakoa)",
      timeout: "Denbora-muga (segundoak)",
      resultJson: "Emaitza (JSON)",
    },
    actions: {
      generate: "Proiektua sortu",
      finalize: "Proiektua amaitu",
      openFolder: "Irteera-karpeta ireki",
      addVersion: "Unity bertsioa gehitu",
      downloadZip: "Amaitutako proiektua deskargatu (.zip)",
    },
    dialogs: {
      addVersion: {
        title: "Unity bertsioa gehitu",
        versionId: "Bertsio IDa",
        label: "Etiketa (aukerakoa)",
      },
    },
  },

  theme: {
    light: "Argia",
    dark: "Iluna",
    system: "Sistema",
  },

  languages: {
    en: "Ingelesa",
    es: "Gaztelania",
    ca: "Katalana",
    eu: "Euskara",
    oc: "Okzitaniera",
    uk: "Ukrainera",
  },
} as const;
