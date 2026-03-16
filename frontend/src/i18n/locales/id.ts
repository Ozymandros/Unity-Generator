/**
 * Indonesian (id) locale.
 */
export default {
  app: {
    title: "Unity Generator",
    status: { online: "Online", offline: "Offline" },
    nav: {
      settings: "Pengaturan", scenes: "Adegan", code: "Kode", text: "Teks",
      image: "Gambar", sprites: "Sprites", audio: "Audio",
      unityUi: "Unity UI", unityPhysics: "Unity Fisika", unityProject: "Proyek Unity",
    },
    actions: { repository: "Repositori" },
  },
  common: {
    loading: "Memuat…", saving: "Menyimpan…", save: "Simpan",
    cancel: "Batal", close: "Tutup", ok: "OK", yes: "Ya", no: "Tidak",
    error: "Kesalahan", warning: "Peringatan", success: "Berhasil", generate: "Buat",
    result: "Hasil", provider: "Penyedia", model: "Model", temperature: "Suhu",
    apiKey: "Kunci API (penggantian opsional)", systemPrompt: "Penggantian prompt sistem",
    advancedOptions: "Opsi lanjutan", examplePrompts: "Contoh prompt",
    manageModels: "Kelola model", selectProvider: "Pilih penyedia",
    selectModel: "Pilih model", prompt: "Prompt",
    leaveEmptyForGlobalKey: "Kosongkan untuk menggunakan kunci global",
    createdFiles: "File yang dibuat", viewSteps: "Lihat langkah ({n})",
    waitingForLogs: "Menunggu log…", errorsDetected: "Kesalahan terdeteksi",
  },
  settings: {
    title: "Konfigurasi",
    subtitle: "Kelola mesin kecerdasan, model, dan prompt sistem Anda.",
    tabs: { general: "Umum", providers: "Penyedia", models: "Model", prompts: "Prompt", secrets: "Rahasia" },
  },
  general: {
    title: "Preferensi umum",
    sections: { networkApi: "Jaringan & API", preferredIntelligence: "Kecerdasan pilihan", appearance: "Tampilan", language: "Bahasa" },
    fields: {
      backendUrl: "URL backend", backendUrlHint: "Alamat layanan backend Unity Generator Anda",
      outputBasePath: "Jalur dasar (output)", outputBasePathHint: "Tempat file yang dihasilkan disimpan",
      unityEditorPath: "Jalur editor Unity (opsional)", unityEditorPathHint: "Jalur lengkap ke executable editor Unity",
      preferredLlm: "Penyedia teks/logika default", preferredLlmModel: "Model teks/logika default",
      preferredImage: "Penyedia pembuatan gambar default", preferredImageModel: "Model pembuatan gambar default",
      preferredAudio: "Penyedia suara (TTS) default", preferredAudioModel: "Model suara (TTS) default",
      preferredMusic: "Penyedia musik default", preferredMusicModel: "Model musik default",
      theme: "Tema", language: "Bahasa antarmuka",
    },
    actions: { saveAll: "Simpan semua perubahan" },
    status: {
      saving: "Menyimpan…", saved: "Preferensi berhasil disimpan.",
      modelNotRegistered: 'Model "{model}" tidak terdaftar untuk penyedia "{provider}".',
      networkError: "Kesalahan jaringan: tidak dapat menghubungi backend.",
    },
  },
  code: {
    title: "Kode C# Unity", subtitle: "Buat skrip C# Unity menggunakan AI.",
    fields: { prompt: "Prompt", maxTokens: "Token maksimum" },
    actions: { generate: "Buat kode" },
    activeProject: "Proyek aktif: {name}", autoSave: "Simpan otomatis ke proyek",
  },
  text: {
    title: "Pembuatan teks", subtitle: "Buat konten teks menggunakan AI.",
    fields: { prompt: "Prompt", length: "Panjang" }, actions: { generate: "Buat teks" },
  },
  image: {
    title: "Pembuatan gambar", subtitle: "Buat gambar menggunakan AI.",
    fields: { prompt: "Prompt", aspectRatio: "Rasio aspek", quality: "Kualitas", textureName: "Nama tekstur", textureType: "Jenis tekstur" },
    actions: { generate: "Buat gambar", saveToUnity: "Simpan ke Unity" },
  },
  sprites: {
    title: "Sprites 2D", badge: "Dioptimalkan untuk Pixel Art", subtitle: "Buat sprite 2D untuk Unity.",
    fields: { prompt: "Prompt", resolution: "Resolusi", paletteSize: "Ukuran palet", autoCrop: "Potong tepi transparan otomatis", colors: "{n} warna" },
    preview: "Area pratinjau", actions: { generate: "Buat sprites" },
  },
  audio: {
    title: "Pembuatan audio", subtitle: "Buat aset audio menggunakan AI.",
    generationType: "Jenis pembuatan", speechTts: "Ucapan (TTS)", atmosphericMusic: "Musik atmosfer",
    fields: { prompt: "Prompt", musicDescription: "Deskripsi musik", speechPrompt: "Prompt ucapan", voiceOptional: "Suara (opsional)", musicModel: "Model musik", stability: "Stabilitas", audioClipName: "Nama klip audio", audioFormat: "Format audio" },
    actions: { generate: "Buat audio", saveToUnity: "Simpan ke Unity" },
  },
  scenes: {
    title: "Pembuat adegan", subtitle: "Buat adegan Unity menggunakan AI.",
    fields: { prompt: "Deskripsi adegan" }, actions: { generate: "Buat adegan" },
    mediaReady: "Media siap diimpor",
    mediaReadyText: "{type} \"{name}\" siap diimpor ke Unity. Tinjau prompt dan klik \"Buat adegan\" untuk melanjutkan.",
    mediaTypeImage: "Gambar", mediaTypeAudio: "Audio",
  },
  unityUi: {
    title: "Unity UI", subtitle: "Buat komponen UI Unity menggunakan AI.",
    fields: { uiSystem: "Sistem UI", elementType: "Jenis elemen", prompt: "Deskripsi elemen UI", outputFormat: "Format output", anchorPreset: "Preset jangkar", colourTheme: "Tema warna (opsional)", includeAnimations: "Sertakan animasi" },
    actions: { generate: "Buat UI" },
  },
  unityPhysics: {
    title: "Unity Fisika", subtitle: "Buat konfigurasi fisika Unity — Rigidbodies, collider, gravitasi, dan lainnya.",
    fields: { physicsBackend: "Mesin fisika", simulationMode: "Mode simulasi", gravityPreset: "Preset gravitasi", prompt: "Deskripsi fisika", includeRigidbody: "Sertakan konfigurasi Rigidbody", includeColliders: "Sertakan konfigurasi collider", includeLayers: "Sertakan lapisan fisika" },
    actions: { generate: "Buat konfigurasi fisika" },
    quickActions: "Tindakan cepat",
  },
  unityProject: {
    title: "Proyek Unity", subtitle: "Buat struktur proyek Unity yang lengkap.",
    engineSettings: "Pengaturan mesin Unity",
    fields: { projectName: "Nama proyek", unityTemplate: "Template Unity", unityVersion: "Versi Unity", targetPlatform: "Platform target", generateDefaultScene: "Buat adegan default", autoInstallPackages: "Instal paket UPM otomatis", setupUrp: "Konfigurasi URP", upmPackages: "Paket UPM (dipisahkan koma)", sceneName: "Nama adegan", unityEditorPath: "Jalur editor Unity (opsional)", timeout: "Batas waktu (detik)", resultJson: "Hasil (JSON)" },
    actions: { generate: "Buat proyek", finalize: "Selesaikan proyek", openFolder: "Buka folder output", addVersion: "Tambah versi Unity", downloadZip: "Unduh proyek selesai (.zip)" },
    dialogs: { addVersion: { title: "Tambah versi Unity", versionId: "ID versi", label: "Label (opsional)" } },
  },
  theme: { light: "Terang", dark: "Gelap", system: "Sistem" },
  languages: {
    en: "Inggris", es: "Spanyol", ca: "Katalan", eu: "Basque", oc: "Oksitan", uk: "Ukraina",
    pt: "Portugis", gl: "Galisia", fr: "Prancis", it: "Italia", pl: "Polandia", zh: "Tionghoa",
    ar: "Arab", de: "Jerman", hi: "Hindi", bn: "Bengali", ur: "Urdu",
    id: "Indonesia", ja: "Jepang", vi: "Vietnam", ko: "Korea",
  },
} as const;
