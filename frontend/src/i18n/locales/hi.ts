/**
 * Hindi (hi) locale.
 */
export default {
  app: {
    title: "Unity Generator",
    status: { online: "ऑनलाइन", offline: "ऑफलाइन" },
    nav: {
      settings: "सेटिंग्स", scenes: "दृश्य", code: "कोड", text: "पाठ",
      image: "छवि", sprites: "स्प्राइट्स", audio: "ऑडियो",
      unityUi: "Unity UI", unityPhysics: "Unity भौतिकी", unityProject: "Unity प्रोजेक्ट",
    },
    actions: { repository: "रिपॉजिटरी" },
  },
  common: {
    loading: "लोड हो रहा है…", saving: "सहेजा जा रहा है…", save: "सहेजें",
    cancel: "रद्द करें", close: "बंद करें", ok: "ठीक है", yes: "हाँ", no: "नहीं",
    error: "त्रुटि", warning: "चेतावनी", success: "सफलता", generate: "उत्पन्न करें",
    result: "परिणाम", provider: "प्रदाता", model: "मॉडल", temperature: "तापमान",
    apiKey: "API कुंजी (वैकल्पिक ओवरराइड)", systemPrompt: "सिस्टम प्रॉम्प्ट ओवरराइड",
    advancedOptions: "उन्नत विकल्प", examplePrompts: "उदाहरण प्रॉम्प्ट",
    manageModels: "मॉडल प्रबंधित करें", selectProvider: "प्रदाता चुनें",
    selectModel: "मॉडल चुनें", prompt: "प्रॉम्प्ट",
    leaveEmptyForGlobalKey: "वैश्विक कुंजी उपयोग के लिए खाली छोड़ें",
    createdFiles: "बनाई गई फ़ाइलें", viewSteps: "चरण देखें ({n})",
    waitingForLogs: "लॉग की प्रतीक्षा…", errorsDetected: "त्रुटियाँ मिलीं",
  },
  settings: {
    title: "कॉन्फ़िगरेशन",
    subtitle: "अपने इंटेलिजेंस इंजन, मॉडल और सिस्टम प्रॉम्प्ट प्रबंधित करें।",
    tabs: { general: "सामान्य", providers: "प्रदाता", models: "मॉडल", prompts: "प्रॉम्प्ट", secrets: "रहस्य" },
  },
  general: {
    title: "सामान्य प्राथमिकताएँ",
    sections: { networkApi: "नेटवर्क और API", preferredIntelligence: "पसंदीदा इंटेलिजेंस", appearance: "दिखावट", language: "भाषा" },
    fields: {
      backendUrl: "बैकएंड URL", backendUrlHint: "आपकी Unity Generator बैकएंड सेवा का पता",
      outputBasePath: "आधार पथ (आउटपुट)", outputBasePathHint: "जनरेट की गई फ़ाइलें कहाँ सहेजी जाती हैं",
      unityEditorPath: "Unity एडिटर पथ (वैकल्पिक)", unityEditorPathHint: "Unity एडिटर एक्जीक्यूटेबल का पूरा पथ",
      preferredLlm: "डिफ़ॉल्ट टेक्स्ट/लॉजिक प्रदाता", preferredLlmModel: "डिफ़ॉल्ट टेक्स्ट/लॉजिक मॉडल",
      preferredImage: "डिफ़ॉल्ट इमेज जनरेशन प्रदाता", preferredImageModel: "डिफ़ॉल्ट इमेज जनरेशन मॉडल",
      preferredAudio: "डिफ़ॉल्ट वॉयस (TTS) प्रदाता", preferredAudioModel: "डिफ़ॉल्ट वॉयस (TTS) मॉडल",
      preferredMusic: "डिफ़ॉल्ट म्यूज़िक प्रदाता", preferredMusicModel: "डिफ़ॉल्ट म्यूज़िक मॉडल",
      theme: "थीम", language: "इंटरफ़ेस भाषा",
    },
    actions: { saveAll: "सभी परिवर्तन सहेजें" },
    status: {
      saving: "सहेजा जा रहा है…", saved: "प्राथमिकताएँ सफलतापूर्वक सहेजी गईं।",
      modelNotRegistered: 'मॉडल "{model}" प्रदाता "{provider}" के लिए पंजीकृत नहीं है।',
      networkError: "नेटवर्क त्रुटि: बैकएंड से कनेक्ट नहीं हो सका।",
    },
  },
  code: {
    title: "Unity C# कोड", subtitle: "AI का उपयोग करके Unity C# स्क्रिप्ट जनरेट करें।",
    fields: { prompt: "प्रॉम्प्ट", maxTokens: "अधिकतम टोकन" },
    actions: { generate: "कोड जनरेट करें" },
    activeProject: "सक्रिय प्रोजेक्ट: {name}", autoSave: "प्रोजेक्ट में स्वतः सहेजें",
  },
  text: {
    title: "टेक्स्ट जनरेशन", subtitle: "AI का उपयोग करके टेक्स्ट सामग्री जनरेट करें।",
    fields: { prompt: "प्रॉम्प्ट", length: "लंबाई" },
    actions: { generate: "टेक्स्ट जनरेट करें" },
  },
  image: {
    title: "इमेज जनरेशन", subtitle: "AI का उपयोग करके इमेज जनरेट करें।",
    fields: { prompt: "प्रॉम्प्ट", aspectRatio: "आस्पेक्ट रेशियो", quality: "गुणवत्ता", textureName: "टेक्सचर नाम", textureType: "टेक्सचर प्रकार" },
    actions: { generate: "इमेज जनरेट करें", saveToUnity: "Unity में सहेजें" },
  },
  sprites: {
    title: "2D स्प्राइट्स", badge: "पिक्सेल आर्ट के लिए अनुकूलित", subtitle: "Unity के लिए 2D स्प्राइट जनरेट करें।",
    fields: { prompt: "प्रॉम्प्ट", resolution: "रिज़ॉल्यूशन", paletteSize: "पैलेट आकार", autoCrop: "पारदर्शी किनारे स्वतः काटें", colors: "{n} रंग" },
    preview: "पूर्वावलोकन क्षेत्र", actions: { generate: "स्प्राइट जनरेट करें" },
  },
  audio: {
    title: "ऑडियो जनरेशन", subtitle: "AI का उपयोग करके ऑडियो संसाधन जनरेट करें।",
    generationType: "जनरेशन प्रकार", speechTts: "वाणी (TTS)", atmosphericMusic: "वातावरणीय संगीत",
    fields: { prompt: "प्रॉम्प्ट", musicDescription: "संगीत विवरण", speechPrompt: "वाणी प्रॉम्प्ट", voiceOptional: "आवाज़ (वैकल्पिक)", musicModel: "म्यूज़िक मॉडल", stability: "स्थिरता", audioClipName: "ऑडियो क्लिप नाम", audioFormat: "ऑडियो फ़ॉर्मेट" },
    actions: { generate: "ऑडियो जनरेट करें", saveToUnity: "Unity में सहेजें" },
  },
  scenes: {
    title: "दृश्य निर्माता", subtitle: "AI का उपयोग करके Unity दृश्य जनरेट करें।",
    fields: { prompt: "दृश्य विवरण" }, actions: { generate: "दृश्य बनाएँ" },
    mediaReady: "मीडिया आयात के लिए तैयार",
    mediaReadyText: "{type} \"{name}\" Unity में आयात के लिए तैयार है। प्रॉम्प्ट की समीक्षा करें और जारी रखने के लिए \"दृश्य बनाएँ\" पर क्लिक करें।",
    mediaTypeImage: "छवि", mediaTypeAudio: "ऑडियो",
  },
  unityUi: {
    title: "Unity UI", subtitle: "AI का उपयोग करके Unity UI घटक जनरेट करें।",
    fields: { uiSystem: "UI सिस्टम", elementType: "तत्व प्रकार", prompt: "UI तत्व विवरण", outputFormat: "आउटपुट फ़ॉर्मेट", anchorPreset: "एंकर प्रीसेट", colourTheme: "रंग थीम (वैकल्पिक)", includeAnimations: "एनिमेशन शामिल करें" },
    actions: { generate: "UI जनरेट करें" },
  },
  unityPhysics: {
    title: "Unity भौतिकी", subtitle: "Unity भौतिकी कॉन्फ़िगरेशन जनरेट करें — Rigidbodies, Colliders, गुरुत्वाकर्षण और अधिक।",
    fields: { physicsBackend: "भौतिकी इंजन", simulationMode: "सिमुलेशन मोड", gravityPreset: "गुरुत्वाकर्षण प्रीसेट", prompt: "भौतिकी विवरण", includeRigidbody: "Rigidbody कॉन्फ़िगरेशन शामिल करें", includeColliders: "Collider कॉन्फ़िगरेशन शामिल करें", includeLayers: "भौतिकी परतें शामिल करें" },
    actions: { generate: "भौतिकी कॉन्फ़िगरेशन जनरेट करें" },
    quickActions: "त्वरित क्रियाएँ",
  },
  unityProject: {
    title: "Unity प्रोजेक्ट", subtitle: "पूर्ण Unity प्रोजेक्ट संरचना जनरेट करें।",
    engineSettings: "Unity इंजन सेटिंग्स",
    fields: { projectName: "प्रोजेक्ट नाम", unityTemplate: "Unity टेम्पलेट", unityVersion: "Unity संस्करण", targetPlatform: "लक्ष्य प्लेटफ़ॉर्म", generateDefaultScene: "डिफ़ॉल्ट दृश्य जनरेट करें", autoInstallPackages: "UPM पैकेज स्वतः इंस्टॉल करें", setupUrp: "URP कॉन्फ़िगर करें", upmPackages: "UPM पैकेज (अल्पविराम से अलग)", sceneName: "दृश्य नाम", unityEditorPath: "Unity एडिटर पथ (वैकल्पिक)", timeout: "टाइमआउट (सेकंड)", resultJson: "परिणाम (JSON)" },
    actions: { generate: "प्रोजेक्ट जनरेट करें", finalize: "प्रोजेक्ट अंतिम करें", openFolder: "आउटपुट फ़ोल्डर खोलें", addVersion: "Unity संस्करण जोड़ें", downloadZip: "पूर्ण प्रोजेक्ट डाउनलोड करें (.zip)" },
    dialogs: { addVersion: { title: "Unity संस्करण जोड़ें", versionId: "संस्करण ID", label: "लेबल (वैकल्पिक)" } },
  },
  theme: { light: "हल्का", dark: "गहरा", system: "सिस्टम" },
  languages: {
    en: "अंग्रेज़ी", es: "स्पेनिश", ca: "कातालान", eu: "बास्क", oc: "ऑक्सिटान", uk: "यूक्रेनी",
    pt: "पुर्तगाली", gl: "गैलिशियन", fr: "फ्रेंच", it: "इतालवी", pl: "पोलिश", zh: "चीनी",
    ar: "अरबी", de: "जर्मन", hi: "हिंदी", bn: "बंगाली", ur: "उर्दू",
    id: "इंडोनेशियाई", ja: "जापानी", vi: "वियतनामी", ko: "कोरियाई",
  },
} as const;
