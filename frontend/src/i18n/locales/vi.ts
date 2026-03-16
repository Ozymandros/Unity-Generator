/**
 * Vietnamese (vi) locale.
 */
export default {
  app: {
    title: "Unity Generator",
    status: { online: "Trực tuyến", offline: "Ngoại tuyến" },
    nav: {
      settings: "Cài đặt", scenes: "Cảnh", code: "Mã", text: "Văn bản",
      image: "Hình ảnh", sprites: "Sprites", audio: "Âm thanh",
      unityUi: "Unity UI", unityPhysics: "Unity Vật lý", unityProject: "Dự án Unity",
    },
    actions: { repository: "Kho lưu trữ" },
  },
  common: {
    loading: "Đang tải…", saving: "Đang lưu…", save: "Lưu",
    cancel: "Hủy", close: "Đóng", ok: "OK", yes: "Có", no: "Không",
    error: "Lỗi", warning: "Cảnh báo", success: "Thành công", generate: "Tạo",
    result: "Kết quả", provider: "Nhà cung cấp", model: "Mô hình", temperature: "Nhiệt độ",
    apiKey: "Khóa API (ghi đè tùy chọn)", systemPrompt: "Ghi đè prompt hệ thống",
    advancedOptions: "Tùy chọn nâng cao", examplePrompts: "Ví dụ prompt",
    manageModels: "Quản lý mô hình", selectProvider: "Chọn nhà cung cấp",
    selectModel: "Chọn mô hình", prompt: "Prompt",
    leaveEmptyForGlobalKey: "Để trống để dùng khóa toàn cục",
    createdFiles: "Tệp đã tạo", viewSteps: "Xem các bước ({n})",
    waitingForLogs: "Đang chờ nhật ký…", errorsDetected: "Phát hiện lỗi",
  },
  settings: {
    title: "Cấu hình",
    subtitle: "Quản lý các công cụ trí tuệ, mô hình và prompt hệ thống của bạn.",
    tabs: { general: "Chung", providers: "Nhà cung cấp", models: "Mô hình", prompts: "Prompt", secrets: "Bí mật" },
  },
  general: {
    title: "Tùy chọn chung",
    sections: { networkApi: "Mạng & API", preferredIntelligence: "Trí tuệ ưa thích", appearance: "Giao diện", language: "Ngôn ngữ" },
    fields: {
      backendUrl: "URL backend", backendUrlHint: "Địa chỉ dịch vụ backend Unity Generator của bạn",
      outputBasePath: "Đường dẫn cơ sở (đầu ra)", outputBasePathHint: "Nơi lưu các tệp được tạo",
      unityEditorPath: "Đường dẫn Unity Editor (tùy chọn)", unityEditorPathHint: "Đường dẫn đầy đủ đến tệp thực thi Unity Editor",
      preferredLlm: "Nhà cung cấp văn bản/logic mặc định", preferredLlmModel: "Mô hình văn bản/logic mặc định",
      preferredImage: "Nhà cung cấp tạo ảnh mặc định", preferredImageModel: "Mô hình tạo ảnh mặc định",
      preferredAudio: "Nhà cung cấp giọng nói (TTS) mặc định", preferredAudioModel: "Mô hình giọng nói (TTS) mặc định",
      preferredMusic: "Nhà cung cấp âm nhạc mặc định", preferredMusicModel: "Mô hình âm nhạc mặc định",
      theme: "Giao diện", language: "Ngôn ngữ giao diện",
    },
    actions: { saveAll: "Lưu tất cả thay đổi" },
    status: {
      saving: "Đang lưu…", saved: "Đã lưu tùy chọn thành công.",
      modelNotRegistered: 'Mô hình "{model}" chưa được đăng ký cho nhà cung cấp "{provider}".',
      networkError: "Lỗi mạng: không thể kết nối với backend.",
    },
  },
  code: {
    title: "Mã C# Unity", subtitle: "Tạo script C# Unity bằng AI.",
    fields: { prompt: "Prompt", maxTokens: "Token tối đa" },
    actions: { generate: "Tạo mã" },
    activeProject: "Dự án đang hoạt động: {name}", autoSave: "Tự động lưu vào dự án",
  },
  text: {
    title: "Tạo văn bản", subtitle: "Tạo nội dung văn bản bằng AI.",
    fields: { prompt: "Prompt", length: "Độ dài" }, actions: { generate: "Tạo văn bản" },
  },
  image: {
    title: "Tạo hình ảnh", subtitle: "Tạo hình ảnh bằng AI.",
    fields: { prompt: "Prompt", aspectRatio: "Tỷ lệ khung hình", quality: "Chất lượng", textureName: "Tên texture", textureType: "Loại texture" },
    actions: { generate: "Tạo hình ảnh", saveToUnity: "Lưu vào Unity" },
  },
  sprites: {
    title: "Sprites 2D", badge: "Tối ưu cho Pixel Art", subtitle: "Tạo sprite 2D cho Unity.",
    fields: { prompt: "Prompt", resolution: "Độ phân giải", paletteSize: "Kích thước bảng màu", autoCrop: "Tự động cắt viền trong suốt", colors: "{n} màu" },
    preview: "Khu vực xem trước", actions: { generate: "Tạo sprites" },
  },
  audio: {
    title: "Tạo âm thanh", subtitle: "Tạo tài nguyên âm thanh bằng AI.",
    generationType: "Loại tạo", speechTts: "Giọng nói (TTS)", atmosphericMusic: "Nhạc không khí",
    fields: { prompt: "Prompt", musicDescription: "Mô tả âm nhạc", speechPrompt: "Prompt giọng nói", voiceOptional: "Giọng (tùy chọn)", musicModel: "Mô hình âm nhạc", stability: "Độ ổn định", audioClipName: "Tên clip âm thanh", audioFormat: "Định dạng âm thanh" },
    actions: { generate: "Tạo âm thanh", saveToUnity: "Lưu vào Unity" },
  },
  scenes: {
    title: "Trình tạo cảnh", subtitle: "Tạo cảnh Unity bằng AI.",
    fields: { prompt: "Mô tả cảnh" }, actions: { generate: "Tạo cảnh" },
    mediaReady: "Phương tiện sẵn sàng để nhập",
    mediaReadyText: "{type} \"{name}\" sẵn sàng để nhập vào Unity. Xem lại prompt và nhấp \"Tạo cảnh\" để tiếp tục.",
    mediaTypeImage: "Hình ảnh", mediaTypeAudio: "Âm thanh",
  },
  unityUi: {
    title: "Unity UI", subtitle: "Tạo thành phần UI Unity bằng AI.",
    fields: { uiSystem: "Hệ thống UI", elementType: "Loại phần tử", prompt: "Mô tả phần tử UI", outputFormat: "Định dạng đầu ra", anchorPreset: "Preset neo", colourTheme: "Chủ đề màu (tùy chọn)", includeAnimations: "Bao gồm hoạt ảnh" },
    actions: { generate: "Tạo UI" },
  },
  unityPhysics: {
    title: "Unity Vật lý", subtitle: "Tạo cấu hình vật lý Unity — Rigidbodies, collider, trọng lực và hơn thế.",
    fields: { physicsBackend: "Động cơ vật lý", simulationMode: "Chế độ mô phỏng", gravityPreset: "Preset trọng lực", prompt: "Mô tả vật lý", includeRigidbody: "Bao gồm cấu hình Rigidbody", includeColliders: "Bao gồm cấu hình collider", includeLayers: "Bao gồm lớp vật lý" },
    actions: { generate: "Tạo cấu hình vật lý" },
    quickActions: "Hành động nhanh",
  },
  unityProject: {
    title: "Dự án Unity", subtitle: "Tạo cấu trúc dự án Unity hoàn chỉnh.",
    engineSettings: "Cài đặt động cơ Unity",
    fields: { projectName: "Tên dự án", unityTemplate: "Template Unity", unityVersion: "Phiên bản Unity", targetPlatform: "Nền tảng mục tiêu", generateDefaultScene: "Tạo cảnh mặc định", autoInstallPackages: "Tự động cài đặt gói UPM", setupUrp: "Cấu hình URP", upmPackages: "Gói UPM (phân cách bằng dấu phẩy)", sceneName: "Tên cảnh", unityEditorPath: "Đường dẫn Unity Editor (tùy chọn)", timeout: "Thời gian chờ (giây)", resultJson: "Kết quả (JSON)" },
    actions: { generate: "Tạo dự án", finalize: "Hoàn thiện dự án", openFolder: "Mở thư mục đầu ra", addVersion: "Thêm phiên bản Unity", downloadZip: "Tải dự án hoàn thiện (.zip)" },
    dialogs: { addVersion: { title: "Thêm phiên bản Unity", versionId: "ID phiên bản", label: "Nhãn (tùy chọn)" } },
  },
  theme: { light: "Sáng", dark: "Tối", system: "Hệ thống" },
  languages: {
    en: "Tiếng Anh", es: "Tiếng Tây Ban Nha", ca: "Tiếng Catalan", eu: "Tiếng Basque",
    oc: "Tiếng Occitan", uk: "Tiếng Ukraina", pt: "Tiếng Bồ Đào Nha", gl: "Tiếng Galicia",
    fr: "Tiếng Pháp", it: "Tiếng Ý", pl: "Tiếng Ba Lan", zh: "Tiếng Trung",
    ar: "Tiếng Ả Rập", de: "Tiếng Đức", hi: "Tiếng Hindi", bn: "Tiếng Bengali",
    ur: "Tiếng Urdu", id: "Tiếng Indonesia", ja: "Tiếng Nhật", vi: "Tiếng Việt", ko: "Tiếng Hàn",
  },
} as const;
