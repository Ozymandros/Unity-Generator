/**
 * Urdu (ur) locale. RTL language.
 */
export default {
  app: {
    title: "Unity Generator",
    status: { online: "آن لائن", offline: "آف لائن" },
    nav: {
      settings: "ترتیبات", scenes: "مناظر", code: "کوڈ", text: "متن",
      image: "تصویر", sprites: "اسپرائٹس", audio: "آڈیو",
      unityUi: "Unity UI", unityPhysics: "Unity طبیعیات", unityProject: "Unity منصوبہ",
    },
    actions: { repository: "ریپوزیٹری" },
  },
  common: {
    loading: "لوڈ ہو رہا ہے…", saving: "محفوظ ہو رہا ہے…", save: "محفوظ کریں",
    cancel: "منسوخ کریں", close: "بند کریں", ok: "ٹھیک ہے", yes: "ہاں", no: "نہیں",
    error: "خرابی", warning: "انتباہ", success: "کامیابی", generate: "بنائیں",
    result: "نتیجہ", provider: "فراہم کنندہ", model: "ماڈل", temperature: "درجہ حرارت",
    apiKey: "API کلید (اختیاری اوور رائڈ)", systemPrompt: "سسٹم پرامپٹ اوور رائڈ",
    advancedOptions: "جدید اختیارات", examplePrompts: "مثال پرامپٹس",
    manageModels: "ماڈلز منظم کریں", selectProvider: "فراہم کنندہ منتخب کریں",
    selectModel: "ماڈل منتخب کریں", prompt: "پرامپٹ",
    leaveEmptyForGlobalKey: "عالمی کلید استعمال کرنے کے لیے خالی چھوڑیں",
    createdFiles: "بنائی گئی فائلیں", viewSteps: "مراحل دیکھیں ({n})",
    waitingForLogs: "لاگز کا انتظار…", errorsDetected: "خرابیاں ملیں",
  },
  settings: {
    title: "ترتیب",
    subtitle: "اپنے ذہانت انجن، ماڈلز اور سسٹم پرامپٹس منظم کریں۔",
    tabs: { general: "عمومی", providers: "فراہم کنندگان", models: "ماڈلز", prompts: "پرامپٹس", secrets: "راز" },
  },
  general: {
    title: "عمومی ترجیحات",
    sections: { networkApi: "نیٹ ورک اور API", preferredIntelligence: "پسندیدہ ذہانت", appearance: "ظاہری شکل", language: "زبان" },
    fields: {
      backendUrl: "بیک اینڈ URL", backendUrlHint: "آپ کی Unity Generator بیک اینڈ سروس کا پتہ",
      outputBasePath: "بنیادی راستہ (آؤٹ پٹ)", outputBasePathHint: "بنائی گئی فائلیں کہاں محفوظ ہوتی ہیں",
      unityEditorPath: "Unity ایڈیٹر راستہ (اختیاری)", unityEditorPathHint: "Unity ایڈیٹر ایگزیکیوٹیبل کا مکمل راستہ",
      preferredLlm: "ڈیفالٹ متن/منطق فراہم کنندہ", preferredLlmModel: "ڈیفالٹ متن/منطق ماڈل",
      preferredImage: "ڈیفالٹ تصویر سازی فراہم کنندہ", preferredImageModel: "ڈیفالٹ تصویر سازی ماڈل",
      preferredAudio: "ڈیفالٹ آواز (TTS) فراہم کنندہ", preferredAudioModel: "ڈیفالٹ آواز (TTS) ماڈل",
      preferredMusic: "ڈیفالٹ موسیقی فراہم کنندہ", preferredMusicModel: "ڈیفالٹ موسیقی ماڈل",
      theme: "تھیم", language: "انٹرفیس زبان",
    },
    actions: { saveAll: "تمام تبدیلیاں محفوظ کریں" },
    status: {
      saving: "محفوظ ہو رہا ہے…", saved: "ترجیحات کامیابی سے محفوظ ہو گئیں۔",
      modelNotRegistered: 'ماڈل "{model}" فراہم کنندہ "{provider}" کے لیے رجسٹرڈ نہیں ہے۔',
      networkError: "نیٹ ورک خرابی: بیک اینڈ سے رابطہ نہیں ہو سکا۔",
    },
  },
  code: {
    title: "Unity C# کوڈ", subtitle: "AI استعمال کرتے ہوئے Unity C# اسکرپٹس بنائیں۔",
    fields: { prompt: "پرامپٹ", maxTokens: "زیادہ سے زیادہ ٹوکنز" },
    actions: { generate: "کوڈ بنائیں" },
    activeProject: "فعال منصوبہ: {name}", autoSave: "منصوبے میں خودکار محفوظ کریں",
  },
  text: {
    title: "متن سازی", subtitle: "AI استعمال کرتے ہوئے متن مواد بنائیں۔",
    fields: { prompt: "پرامپٹ", length: "لمبائی" }, actions: { generate: "متن بنائیں" },
  },
  image: {
    title: "تصویر سازی", subtitle: "AI استعمال کرتے ہوئے تصاویر بنائیں۔",
    fields: { prompt: "پرامپٹ", aspectRatio: "پہلو تناسب", quality: "معیار", textureName: "ٹیکسچر نام", textureType: "ٹیکسچر قسم" },
    actions: { generate: "تصویر بنائیں", saveToUnity: "Unity میں محفوظ کریں" },
  },
  sprites: {
    title: "2D اسپرائٹس", badge: "پکسل آرٹ کے لیے بہتر", subtitle: "Unity کے لیے 2D اسپرائٹس بنائیں۔",
    fields: { prompt: "پرامپٹ", resolution: "ریزولیوشن", paletteSize: "پیلیٹ سائز", autoCrop: "شفاف کناروں کو خودکار کاٹیں", colors: "{n} رنگ" },
    preview: "پیش نظارہ علاقہ", actions: { generate: "اسپرائٹس بنائیں" },
  },
  audio: {
    title: "آڈیو سازی", subtitle: "AI استعمال کرتے ہوئے آڈیو وسائل بنائیں۔",
    generationType: "سازی کی قسم", speechTts: "تقریر (TTS)", atmosphericMusic: "ماحولیاتی موسیقی",
    fields: { prompt: "پرامپٹ", musicDescription: "موسیقی کی تفصیل", speechPrompt: "تقریر پرامپٹ", voiceOptional: "آواز (اختیاری)", musicModel: "موسیقی ماڈل", stability: "استحکام", audioClipName: "آڈیو کلپ نام", audioFormat: "آڈیو فارمیٹ" },
    actions: { generate: "آڈیو بنائیں", saveToUnity: "Unity میں محفوظ کریں" },
  },
  scenes: {
    title: "منظر ساز", subtitle: "AI استعمال کرتے ہوئے Unity مناظر بنائیں۔",
    fields: { prompt: "منظر کی تفصیل" }, actions: { generate: "منظر بنائیں" },
    mediaReady: "میڈیا درآمد کے لیے تیار",
    mediaReadyText: "{type} \"{name}\" Unity میں درآمد کے لیے تیار ہے۔ پرامپٹ کا جائزہ لیں اور جاری رکھنے کے لیے \"منظر بنائیں\" پر کلک کریں۔",
    mediaTypeImage: "تصویر", mediaTypeAudio: "آڈیو",
  },
  unityUi: {
    title: "Unity UI", subtitle: "AI استعمال کرتے ہوئے Unity UI اجزاء بنائیں۔",
    fields: { uiSystem: "UI سسٹم", elementType: "عنصر کی قسم", prompt: "UI عنصر کی تفصیل", outputFormat: "آؤٹ پٹ فارمیٹ", anchorPreset: "اینکر پری سیٹ", colourTheme: "رنگ تھیم (اختیاری)", includeAnimations: "اینیمیشنز شامل کریں" },
    actions: { generate: "UI بنائیں" },
  },
  unityPhysics: {
    title: "Unity طبیعیات", subtitle: "Unity طبیعیات ترتیب بنائیں — Rigidbodies، Colliders، کشش ثقل اور مزید۔",
    fields: { physicsBackend: "طبیعیات انجن", simulationMode: "نقلی طریقہ", gravityPreset: "کشش ثقل پری سیٹ", prompt: "طبیعیات کی تفصیل", includeRigidbody: "Rigidbody ترتیب شامل کریں", includeColliders: "Collider ترتیب شامل کریں", includeLayers: "طبیعیات پرتیں شامل کریں" },
    actions: { generate: "طبیعیات ترتیب بنائیں" },
    quickActions: "فوری اقدامات",
  },
  unityProject: {
    title: "Unity منصوبہ", subtitle: "مکمل Unity منصوبہ ڈھانچہ بنائیں۔",
    engineSettings: "Unity انجن ترتیبات",
    fields: { projectName: "منصوبے کا نام", unityTemplate: "Unity ٹیمپلیٹ", unityVersion: "Unity ورژن", targetPlatform: "ہدف پلیٹ فارم", generateDefaultScene: "ڈیفالٹ منظر بنائیں", autoInstallPackages: "UPM پیکجز خودکار انسٹال کریں", setupUrp: "URP ترتیب دیں", upmPackages: "UPM پیکجز (کاما سے الگ)", sceneName: "منظر کا نام", unityEditorPath: "Unity ایڈیٹر راستہ (اختیاری)", timeout: "ٹائم آؤٹ (سیکنڈ)", resultJson: "نتیجہ (JSON)" },
    actions: { generate: "منصوبہ بنائیں", finalize: "منصوبہ مکمل کریں", openFolder: "آؤٹ پٹ فولڈر کھولیں", addVersion: "Unity ورژن شامل کریں", downloadZip: "مکمل منصوبہ ڈاؤن لوڈ کریں (.zip)" },
    dialogs: { addVersion: { title: "Unity ورژن شامل کریں", versionId: "ورژن ID", label: "لیبل (اختیاری)" } },
  },
  theme: { light: "روشن", dark: "تاریک", system: "سسٹم" },
  languages: {
    en: "انگریزی", es: "ہسپانوی", ca: "کاتالان", eu: "باسک", oc: "آکسیٹان", uk: "یوکرینی",
    pt: "پرتگالی", gl: "گالیشین", fr: "فرانسیسی", it: "اطالوی", pl: "پولش", zh: "چینی",
    ar: "عربی", de: "جرمن", hi: "ہندی", bn: "بنگالی", ur: "اردو",
    id: "انڈونیشیائی", ja: "جاپانی", vi: "ویتنامی", ko: "کوریائی",
  },
} as const;
