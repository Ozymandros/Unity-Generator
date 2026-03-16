/**
 * Bengali (bn) locale.
 */
export default {
  app: {
    title: "Unity Generator",
    status: { online: "অনলাইন", offline: "অফলাইন" },
    nav: {
      settings: "সেটিংস", scenes: "দৃশ্য", code: "কোড", text: "পাঠ্য",
      image: "ছবি", sprites: "স্প্রাইট", audio: "অডিও",
      unityUi: "Unity UI", unityPhysics: "Unity পদার্থবিজ্ঞান", unityProject: "Unity প্রকল্প",
    },
    actions: { repository: "রিপোজিটরি" },
  },
  common: {
    loading: "লোড হচ্ছে…", saving: "সংরক্ষণ হচ্ছে…", save: "সংরক্ষণ করুন",
    cancel: "বাতিল করুন", close: "বন্ধ করুন", ok: "ঠিক আছে", yes: "হ্যাঁ", no: "না",
    error: "ত্রুটি", warning: "সতর্কতা", success: "সাফল্য", generate: "তৈরি করুন",
    result: "ফলাফল", provider: "প্রদানকারী", model: "মডেল", temperature: "তাপমাত্রা",
    apiKey: "API কী (ঐচ্ছিক ওভাররাইড)", systemPrompt: "সিস্টেম প্রম্পট ওভাররাইড",
    advancedOptions: "উন্নত বিকল্প", examplePrompts: "উদাহরণ প্রম্পট",
    manageModels: "মডেল পরিচালনা করুন", selectProvider: "প্রদানকারী নির্বাচন করুন",
    selectModel: "মডেল নির্বাচন করুন", prompt: "প্রম্পট",
    leaveEmptyForGlobalKey: "গ্লোবাল কী ব্যবহারের জন্য খালি রাখুন",
    createdFiles: "তৈরি ফাইল", viewSteps: "ধাপ দেখুন ({n})",
    waitingForLogs: "লগের জন্য অপেক্ষা করছে…", errorsDetected: "ত্রুটি পাওয়া গেছে",
  },
  settings: {
    title: "কনফিগারেশন",
    subtitle: "আপনার ইন্টেলিজেন্স ইঞ্জিন, মডেল এবং সিস্টেম প্রম্পট পরিচালনা করুন।",
    tabs: { general: "সাধারণ", providers: "প্রদানকারী", models: "মডেল", prompts: "প্রম্পট", secrets: "গোপন" },
  },
  general: {
    title: "সাধারণ পছন্দ",
    sections: { networkApi: "নেটওয়ার্ক ও API", preferredIntelligence: "পছন্দের ইন্টেলিজেন্স", appearance: "চেহারা", language: "ভাষা" },
    fields: {
      backendUrl: "ব্যাকএন্ড URL", backendUrlHint: "আপনার Unity Generator ব্যাকএন্ড সেবার ঠিকানা",
      outputBasePath: "বেস পাথ (আউটপুট)", outputBasePathHint: "তৈরি ফাইল কোথায় সংরক্ষিত হয়",
      unityEditorPath: "Unity এডিটর পাথ (ঐচ্ছিক)", unityEditorPathHint: "Unity এডিটর এক্সিকিউটেবলের সম্পূর্ণ পাথ",
      preferredLlm: "ডিফল্ট টেক্সট/লজিক প্রদানকারী", preferredLlmModel: "ডিফল্ট টেক্সট/লজিক মডেল",
      preferredImage: "ডিফল্ট ইমেজ জেনারেশন প্রদানকারী", preferredImageModel: "ডিফল্ট ইমেজ জেনারেশন মডেল",
      preferredAudio: "ডিফল্ট ভয়েস (TTS) প্রদানকারী", preferredAudioModel: "ডিফল্ট ভয়েস (TTS) মডেল",
      preferredMusic: "ডিফল্ট মিউজিক প্রদানকারী", preferredMusicModel: "ডিফল্ট মিউজিক মডেল",
      theme: "থিম", language: "ইন্টারফেস ভাষা",
    },
    actions: { saveAll: "সব পরিবর্তন সংরক্ষণ করুন" },
    status: {
      saving: "সংরক্ষণ হচ্ছে…", saved: "পছন্দ সফলভাবে সংরক্ষিত হয়েছে।",
      modelNotRegistered: 'মডেল "{model}" প্রদানকারী "{provider}"-এর জন্য নিবন্ধিত নয়।',
      networkError: "নেটওয়ার্ক ত্রুটি: ব্যাকএন্ডে সংযোগ করা যায়নি।",
    },
  },
  code: {
    title: "Unity C# কোড", subtitle: "AI ব্যবহার করে Unity C# স্ক্রিপ্ট তৈরি করুন।",
    fields: { prompt: "প্রম্পট", maxTokens: "সর্বোচ্চ টোকেন" },
    actions: { generate: "কোড তৈরি করুন" },
    activeProject: "সক্রিয় প্রকল্প: {name}", autoSave: "প্রকল্পে স্বয়ংক্রিয়ভাবে সংরক্ষণ করুন",
  },
  text: {
    title: "টেক্সট জেনারেশন", subtitle: "AI ব্যবহার করে টেক্সট কন্টেন্ট তৈরি করুন।",
    fields: { prompt: "প্রম্পট", length: "দৈর্ঘ্য" }, actions: { generate: "টেক্সট তৈরি করুন" },
  },
  image: {
    title: "ইমেজ জেনারেশন", subtitle: "AI ব্যবহার করে ইমেজ তৈরি করুন।",
    fields: { prompt: "প্রম্পট", aspectRatio: "আসপেক্ট রেশিও", quality: "গুণমান", textureName: "টেক্সচার নাম", textureType: "টেক্সচার ধরন" },
    actions: { generate: "ইমেজ তৈরি করুন", saveToUnity: "Unity-তে সংরক্ষণ করুন" },
  },
  sprites: {
    title: "2D স্প্রাইট", badge: "পিক্সেল আর্টের জন্য অপ্টিমাইজড", subtitle: "Unity-র জন্য 2D স্প্রাইট তৈরি করুন।",
    fields: { prompt: "প্রম্পট", resolution: "রেজোলিউশন", paletteSize: "প্যালেট আকার", autoCrop: "স্বচ্ছ প্রান্ত স্বয়ংক্রিয়ভাবে কাটুন", colors: "{n} রঙ" },
    preview: "প্রিভিউ এলাকা", actions: { generate: "স্প্রাইট তৈরি করুন" },
  },
  audio: {
    title: "অডিও জেনারেশন", subtitle: "AI ব্যবহার করে অডিও রিসোর্স তৈরি করুন।",
    generationType: "জেনারেশন ধরন", speechTts: "বক্তৃতা (TTS)", atmosphericMusic: "পরিবেশগত সংগীত",
    fields: { prompt: "প্রম্পট", musicDescription: "সংগীত বিবরণ", speechPrompt: "বক্তৃতা প্রম্পট", voiceOptional: "কণ্ঠস্বর (ঐচ্ছিক)", musicModel: "মিউজিক মডেল", stability: "স্থিতিশীলতা", audioClipName: "অডিও ক্লিপ নাম", audioFormat: "অডিও ফরম্যাট" },
    actions: { generate: "অডিও তৈরি করুন", saveToUnity: "Unity-তে সংরক্ষণ করুন" },
  },
  scenes: {
    title: "দৃশ্য নির্মাতা", subtitle: "AI ব্যবহার করে Unity দৃশ্য তৈরি করুন।",
    fields: { prompt: "দৃশ্য বিবরণ" }, actions: { generate: "দৃশ্য তৈরি করুন" },
    mediaReady: "মিডিয়া আমদানির জন্য প্রস্তুত",
    mediaReadyText: "{type} \"{name}\" Unity-তে আমদানির জন্য প্রস্তুত। প্রম্পট পর্যালোচনা করুন এবং চালিয়ে যেতে \"দৃশ্য তৈরি করুন\" ক্লিক করুন।",
    mediaTypeImage: "ছবি", mediaTypeAudio: "অডিও",
  },
  unityUi: {
    title: "Unity UI", subtitle: "AI ব্যবহার করে Unity UI উপাদান তৈরি করুন।",
    fields: { uiSystem: "UI সিস্টেম", elementType: "উপাদান ধরন", prompt: "UI উপাদান বিবরণ", outputFormat: "আউটপুট ফরম্যাট", anchorPreset: "অ্যাঙ্কর প্রিসেট", colourTheme: "রঙ থিম (ঐচ্ছিক)", includeAnimations: "অ্যানিমেশন অন্তর্ভুক্ত করুন" },
    actions: { generate: "UI তৈরি করুন" },
  },
  unityPhysics: {
    title: "Unity পদার্থবিজ্ঞান", subtitle: "Unity পদার্থবিজ্ঞান কনফিগারেশন তৈরি করুন।",
    fields: { physicsBackend: "পদার্থবিজ্ঞান ইঞ্জিন", simulationMode: "সিমুলেশন মোড", gravityPreset: "মাধ্যাকর্ষণ প্রিসেট", prompt: "পদার্থবিজ্ঞান বিবরণ", includeRigidbody: "Rigidbody কনফিগারেশন অন্তর্ভুক্ত করুন", includeColliders: "Collider কনফিগারেশন অন্তর্ভুক্ত করুন", includeLayers: "পদার্থবিজ্ঞান স্তর অন্তর্ভুক্ত করুন" },
    actions: { generate: "পদার্থবিজ্ঞান কনফিগারেশন তৈরি করুন" },
    quickActions: "দ্রুত ক্রিয়া",
  },
  unityProject: {
    title: "Unity প্রকল্প", subtitle: "সম্পূর্ণ Unity প্রকল্প কাঠামো তৈরি করুন।",
    engineSettings: "Unity ইঞ্জিন সেটিংস",
    fields: { projectName: "প্রকল্পের নাম", unityTemplate: "Unity টেমপ্লেট", unityVersion: "Unity সংস্করণ", targetPlatform: "লক্ষ্য প্ল্যাটফর্ম", generateDefaultScene: "ডিফল্ট দৃশ্য তৈরি করুন", autoInstallPackages: "UPM প্যাকেজ স্বয়ংক্রিয়ভাবে ইনস্টল করুন", setupUrp: "URP কনফিগার করুন", upmPackages: "UPM প্যাকেজ (কমা দিয়ে আলাদা)", sceneName: "দৃশ্যের নাম", unityEditorPath: "Unity এডিটর পাথ (ঐচ্ছিক)", timeout: "টাইমআউট (সেকেন্ড)", resultJson: "ফলাফল (JSON)" },
    actions: { generate: "প্রকল্প তৈরি করুন", finalize: "প্রকল্প চূড়ান্ত করুন", openFolder: "আউটপুট ফোল্ডার খুলুন", addVersion: "Unity সংস্করণ যোগ করুন", downloadZip: "সম্পূর্ণ প্রকল্প ডাউনলোড করুন (.zip)" },
    dialogs: { addVersion: { title: "Unity সংস্করণ যোগ করুন", versionId: "সংস্করণ ID", label: "লেবেল (ঐচ্ছিক)" } },
  },
  theme: { light: "হালকা", dark: "গাঢ়", system: "সিস্টেম" },
  languages: {
    en: "ইংরেজি", es: "স্পেনীয়", ca: "কাতালান", eu: "বাস্ক", oc: "অক্সিটান", uk: "ইউক্রেনীয়",
    pt: "পর্তুগিজ", gl: "গ্যালিশিয়ান", fr: "ফরাসি", it: "ইতালীয়", pl: "পোলিশ", zh: "চীনা",
    ar: "আরবি", de: "জার্মান", hi: "হিন্দি", bn: "বাংলা", ur: "উর্দু",
    id: "ইন্দোনেশিয়ান", ja: "জাপানি", vi: "ভিয়েতনামি", ko: "কোরিয়ান",
  },
} as const;
