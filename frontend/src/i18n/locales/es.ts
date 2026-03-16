/**
 * Spanish (es) locale.
 */
export default {
  app: {
    title: "Unity Generator",
    status: {
      online: "En línea",
      offline: "Sin conexión",
    },
    nav: {
      settings: "Ajustes",
      scenes: "Escenas",
      code: "Código",
      text: "Texto",
      image: "Imagen",
      sprites: "Sprites",
      audio: "Audio",
      unityUi: "Unity UI",
      unityPhysics: "Unity Física",
      unityProject: "Proyecto Unity",
    },
    actions: {
      repository: "Repositorio",
    },
  },

  common: {
    loading: "Cargando…",
    saving: "Guardando…",
    save: "Guardar",
    cancel: "Cancelar",
    close: "Cerrar",
    ok: "Aceptar",
    yes: "Sí",
    no: "No",
    error: "Error",
    warning: "Advertencia",
    success: "Éxito",
    generate: "Generar",
    result: "Resultado",
    provider: "Proveedor",
    model: "Modelo",
    temperature: "Temperatura",
    apiKey: "Clave API (anulación opcional)",
    systemPrompt: "Anulación del prompt de sistema",
    advancedOptions: "Opciones avanzadas",
    examplePrompts: "Ejemplos de prompts",
    manageModels: "Gestionar modelos",
    selectProvider: "Seleccionar proveedor",
    selectModel: "Seleccionar modelo",
    prompt: "Prompt",
    leaveEmptyForGlobalKey: "Dejar vacío para usar la clave global",
    createdFiles: "Archivos creados",
    viewSteps: "Ver pasos ({n})",
    waitingForLogs: "Esperando registros…",
    errorsDetected: "Errores detectados",
  },

  settings: {
    title: "Configuración",
    subtitle: "Gestiona tus motores de inteligencia, modelos y prompts de sistema.",
    tabs: {
      general: "General",
      providers: "Proveedores",
      models: "Modelos",
      prompts: "Prompts",
      secrets: "Secretos",
    },
  },

  general: {
    title: "Preferencias generales",
    sections: {
      networkApi: "Red y API",
      preferredIntelligence: "Inteligencia preferida",
      appearance: "Apariencia",
      language: "Idioma",
    },
    fields: {
      backendUrl: "URL del backend",
      backendUrlHint: "La dirección de tu servicio backend de Unity Generator",
      outputBasePath: "Ruta base (salida)",
      outputBasePathHint: "Dónde se guardan los archivos generados",
      unityEditorPath: "Ruta del editor Unity (opcional)",
      unityEditorPathHint: "Ruta completa al ejecutable del editor Unity",
      preferredLlm: "Proveedor de texto / lógica predeterminado",
      preferredLlmModel: "Modelo de texto / lógica predeterminado",
      preferredImage: "Proveedor de generación de imágenes predeterminado",
      preferredImageModel: "Modelo de generación de imágenes predeterminado",
      preferredAudio: "Proveedor de voz (TTS) predeterminado",
      preferredAudioModel: "Modelo de voz (TTS) predeterminado",
      preferredMusic: "Proveedor de música predeterminado",
      preferredMusicModel: "Modelo de música predeterminado",
      theme: "Tema",
      language: "Idioma de la interfaz",
    },
    actions: {
      saveAll: "Guardar todos los cambios",
    },
    status: {
      saving: "Guardando…",
      saved: "Preferencias guardadas correctamente.",
      modelNotRegistered: 'El modelo "{model}" no está registrado para el proveedor "{provider}".',
      networkError: "Error de red: no se puede conectar con el backend.",
    },
  },

  code: {
    title: "Código C# para Unity",
    subtitle: "Genera scripts C# para Unity usando IA.",
    fields: {
      prompt: "Prompt",
      maxTokens: "Tokens máximos",
    },
    actions: {
      generate: "Generar código",
    },
    activeProject: "Proyecto activo: {name}",
    autoSave: "Guardar automáticamente en el proyecto",
  },

  text: {
    title: "Generación de texto",
    subtitle: "Genera contenido de texto usando IA.",
    fields: {
      prompt: "Prompt",
      length: "Longitud",
    },
    actions: {
      generate: "Generar texto",
    },
  },

  image: {
    title: "Generación de imágenes",
    subtitle: "Genera imágenes usando IA.",
    fields: {
      prompt: "Prompt",
      aspectRatio: "Relación de aspecto",
      quality: "Calidad",
      textureName: "Nombre de textura",
      textureType: "Tipo de textura",
    },
    actions: {
      generate: "Generar imagen",
      saveToUnity: "Guardar en Unity",
    },
  },

  sprites: {
    title: "Sprites 2D",
    badge: "Optimizado para Pixel Art",
    subtitle: "Genera sprites 2D para Unity.",
    fields: {
      prompt: "Prompt",
      resolution: "Resolución",
      paletteSize: "Tamaño de paleta",
      autoCrop: "Recorte automático de bordes transparentes",
      colors: "{n} colores",
    },
    preview: "Área de previsualización",
    actions: {
      generate: "Generar sprites",
    },
  },

  audio: {
    title: "Generación de audio",
    subtitle: "Genera recursos de audio usando IA.",
    generationType: "Tipo de generación",
    speechTts: "Voz (TTS)",
    atmosphericMusic: "Música ambiental",
    fields: {
      prompt: "Prompt",
      musicDescription: "Descripción musical",
      speechPrompt: "Prompt de voz",
      voiceOptional: "Voz (opcional)",
      musicModel: "Modelo de música",
      stability: "Estabilidad",
      audioClipName: "Nombre del clip de audio",
      audioFormat: "Formato de audio",
    },
    actions: {
      generate: "Generar audio",
      saveToUnity: "Guardar en Unity",
    },
  },

  scenes: {
    title: "Creador de escenas",
    subtitle: "Genera escenas de Unity usando IA.",
    fields: {
      prompt: "Descripción de la escena",
    },
    actions: {
      generate: "Crear escena",
    },
    mediaReady: "Multimedia lista para importar",
    mediaReadyText: "{type} \"{name}\" está lista para importarse a Unity. Revisa el prompt y haz clic en \"Crear escena\" para continuar.",
    mediaTypeImage: "Imagen",
    mediaTypeAudio: "Audio",
  },

  unityUi: {
    title: "Unity UI",
    subtitle: "Genera componentes de UI para Unity usando IA.",
    fields: {
      uiSystem: "Sistema de UI",
      elementType: "Tipo de elemento",
      prompt: "Descripción del elemento UI",
      outputFormat: "Formato de salida",
      anchorPreset: "Preset de anclaje",
      colourTheme: "Tema de color (opcional)",
      includeAnimations: "Incluir animaciones",
    },
    actions: {
      generate: "Generar UI",
    },
  },

  unityPhysics: {
    title: "Unity Física",
    subtitle: "Genera configuración de física para Unity — Rigidbodies, colisionadores, gravedad y más.",
    fields: {
      physicsBackend: "Motor de física",
      simulationMode: "Modo de simulación",
      gravityPreset: "Preset de gravedad",
      prompt: "Descripción de la física",
      includeRigidbody: "Incluir configuración de Rigidbody",
      includeColliders: "Incluir configuración de colisionadores",
      includeLayers: "Incluir capas de física",
    },
    actions: {
      generate: "Generar configuración de física",
    },
    quickActions: "Acciones rápidas",
  },

  unityProject: {
    title: "Proyecto Unity",
    subtitle: "Genera una estructura completa de proyecto Unity.",
    engineSettings: "Configuración del motor Unity",
    fields: {
      projectName: "Nombre del proyecto",
      unityTemplate: "Plantilla de Unity",
      unityVersion: "Versión de Unity",
      targetPlatform: "Plataforma de destino",
      generateDefaultScene: "Generar escena predeterminada",
      autoInstallPackages: "Instalar paquetes UPM automáticamente",
      setupUrp: "Configurar URP",
      upmPackages: "Paquetes UPM (separados por comas)",
      sceneName: "Nombre de la escena",
      unityEditorPath: "Ruta del editor Unity (opcional)",
      timeout: "Tiempo de espera (segundos)",
      resultJson: "Resultado (JSON)",
    },
    actions: {
      generate: "Generar proyecto",
      finalize: "Finalizar proyecto",
      openFolder: "Abrir carpeta de salida",
      addVersion: "Añadir versión de Unity",
      downloadZip: "Descargar proyecto finalizado (.zip)",
    },
    dialogs: {
      addVersion: {
        title: "Añadir versión de Unity",
        versionId: "ID de versión",
        label: "Etiqueta (opcional)",
      },
    },
  },

  theme: {
    light: "Claro",
    dark: "Oscuro",
    system: "Sistema",
  },

  languages: {
    en: "English",
    es: "Español",
    ca: "Català",
  },
} as const;
