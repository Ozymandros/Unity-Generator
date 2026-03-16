/**
 * Korean (ko) locale.
 */
export default {
  app: {
    title: "Unity Generator",
    status: { online: "온라인", offline: "오프라인" },
    nav: {
      settings: "설정", scenes: "씬", code: "코드", text: "텍스트",
      image: "이미지", sprites: "스프라이트", audio: "오디오",
      unityUi: "Unity UI", unityPhysics: "Unity 물리", unityProject: "Unity 프로젝트",
    },
    actions: { repository: "저장소" },
  },
  common: {
    loading: "로딩 중…", saving: "저장 중…", save: "저장",
    cancel: "취소", close: "닫기", ok: "확인", yes: "예", no: "아니오",
    error: "오류", warning: "경고", success: "성공", generate: "생성",
    result: "결과", provider: "공급자", model: "모델", temperature: "온도",
    apiKey: "API 키 (선택적 재정의)", systemPrompt: "시스템 프롬프트 재정의",
    advancedOptions: "고급 옵션", examplePrompts: "프롬프트 예시",
    manageModels: "모델 관리", selectProvider: "공급자 선택",
    selectModel: "모델 선택", prompt: "프롬프트",
    leaveEmptyForGlobalKey: "전역 키를 사용하려면 비워두세요",
    createdFiles: "생성된 파일", viewSteps: "단계 보기 ({n})",
    waitingForLogs: "로그 대기 중…", errorsDetected: "오류 감지됨",
  },
  settings: {
    title: "설정",
    subtitle: "인텔리전스 엔진, 모델 및 시스템 프롬프트를 관리합니다.",
    tabs: { general: "일반", providers: "공급자", models: "모델", prompts: "프롬프트", secrets: "비밀" },
  },
  general: {
    title: "일반 설정",
    sections: { networkApi: "네트워크 및 API", preferredIntelligence: "선호 인텔리전스", appearance: "외관", language: "언어" },
    fields: {
      backendUrl: "백엔드 URL", backendUrlHint: "Unity Generator 백엔드 서비스 주소",
      outputBasePath: "기본 경로 (출력)", outputBasePathHint: "생성된 파일이 저장되는 위치",
      unityEditorPath: "Unity 에디터 경로 (선택)", unityEditorPathHint: "Unity 에디터 실행 파일의 전체 경로",
      preferredLlm: "기본 텍스트/로직 공급자", preferredLlmModel: "기본 텍스트/로직 모델",
      preferredImage: "기본 이미지 생성 공급자", preferredImageModel: "기본 이미지 생성 모델",
      preferredAudio: "기본 음성 (TTS) 공급자", preferredAudioModel: "기본 음성 (TTS) 모델",
      preferredMusic: "기본 음악 공급자", preferredMusicModel: "기본 음악 모델",
      theme: "테마", language: "인터페이스 언어",
    },
    actions: { saveAll: "모든 변경사항 저장" },
    status: {
      saving: "저장 중…", saved: "설정이 성공적으로 저장되었습니다.",
      modelNotRegistered: '모델 "{model}"은(는) 공급자 "{provider}"에 등록되지 않았습니다.',
      networkError: "네트워크 오류: 백엔드에 연결할 수 없습니다.",
    },
  },
  code: {
    title: "Unity C# 코드", subtitle: "AI를 사용하여 Unity C# 스크립트를 생성합니다.",
    fields: { prompt: "프롬프트", maxTokens: "최대 토큰" },
    actions: { generate: "코드 생성" },
    activeProject: "활성 프로젝트: {name}", autoSave: "프로젝트에 자동 저장",
  },
  text: {
    title: "텍스트 생성", subtitle: "AI를 사용하여 텍스트 콘텐츠를 생성합니다.",
    fields: { prompt: "프롬프트", length: "길이" }, actions: { generate: "텍스트 생성" },
  },
  image: {
    title: "이미지 생성", subtitle: "AI를 사용하여 이미지를 생성합니다.",
    fields: { prompt: "프롬프트", aspectRatio: "화면 비율", quality: "품질", textureName: "텍스처 이름", textureType: "텍스처 유형" },
    actions: { generate: "이미지 생성", saveToUnity: "Unity에 저장" },
  },
  sprites: {
    title: "2D 스프라이트", badge: "픽셀 아트에 최적화", subtitle: "Unity용 2D 스프라이트를 생성합니다.",
    fields: { prompt: "프롬프트", resolution: "해상도", paletteSize: "팔레트 크기", autoCrop: "투명 가장자리 자동 자르기", colors: "{n}가지 색상" },
    preview: "미리보기 영역", actions: { generate: "스프라이트 생성" },
  },
  audio: {
    title: "오디오 생성", subtitle: "AI를 사용하여 오디오 에셋을 생성합니다.",
    generationType: "생성 유형", speechTts: "음성 (TTS)", atmosphericMusic: "분위기 음악",
    fields: { prompt: "프롬프트", musicDescription: "음악 설명", speechPrompt: "음성 프롬프트", voiceOptional: "음성 (선택)", musicModel: "음악 모델", stability: "안정성", audioClipName: "오디오 클립 이름", audioFormat: "오디오 형식" },
    actions: { generate: "오디오 생성", saveToUnity: "Unity에 저장" },
  },
  scenes: {
    title: "씬 생성기", subtitle: "AI를 사용하여 Unity 씬을 생성합니다.",
    fields: { prompt: "씬 설명" }, actions: { generate: "씬 생성" },
    mediaReady: "미디어 가져오기 준비 완료",
    mediaReadyText: "{type} \"{name}\"을(를) Unity로 가져올 준비가 되었습니다. 프롬프트를 검토하고 \"씬 생성\"을 클릭하여 계속하세요.",
    mediaTypeImage: "이미지", mediaTypeAudio: "오디오",
  },
  unityUi: {
    title: "Unity UI", subtitle: "AI를 사용하여 Unity UI 컴포넌트를 생성합니다.",
    fields: { uiSystem: "UI 시스템", elementType: "요소 유형", prompt: "UI 요소 설명", outputFormat: "출력 형식", anchorPreset: "앵커 프리셋", colourTheme: "색상 테마 (선택)", includeAnimations: "애니메이션 포함" },
    actions: { generate: "UI 생성" },
  },
  unityPhysics: {
    title: "Unity 물리", subtitle: "Unity 물리 설정 생성 — Rigidbodies, 콜라이더, 중력 등.",
    fields: { physicsBackend: "물리 엔진", simulationMode: "시뮬레이션 모드", gravityPreset: "중력 프리셋", prompt: "물리 설명", includeRigidbody: "Rigidbody 설정 포함", includeColliders: "콜라이더 설정 포함", includeLayers: "물리 레이어 포함" },
    actions: { generate: "물리 설정 생성" },
    quickActions: "빠른 작업",
  },
  unityProject: {
    title: "Unity 프로젝트", subtitle: "완전한 Unity 프로젝트 구조를 생성합니다.",
    engineSettings: "Unity 엔진 설정",
    fields: { projectName: "프로젝트 이름", unityTemplate: "Unity 템플릿", unityVersion: "Unity 버전", targetPlatform: "대상 플랫폼", generateDefaultScene: "기본 씬 생성", autoInstallPackages: "UPM 패키지 자동 설치", setupUrp: "URP 설정", upmPackages: "UPM 패키지 (쉼표로 구분)", sceneName: "씬 이름", unityEditorPath: "Unity 에디터 경로 (선택)", timeout: "타임아웃 (초)", resultJson: "결과 (JSON)" },
    actions: { generate: "프로젝트 생성", finalize: "프로젝트 완성", openFolder: "출력 폴더 열기", addVersion: "Unity 버전 추가", downloadZip: "완성된 프로젝트 다운로드 (.zip)" },
    dialogs: { addVersion: { title: "Unity 버전 추가", versionId: "버전 ID", label: "레이블 (선택)" } },
  },
  theme: { light: "라이트", dark: "다크", system: "시스템" },
  languages: {
    en: "영어", es: "스페인어", ca: "카탈루냐어", eu: "바스크어", oc: "오크어", uk: "우크라이나어",
    pt: "포르투갈어", gl: "갈리시아어", fr: "프랑스어", it: "이탈리아어", pl: "폴란드어", zh: "중국어",
    ar: "아랍어", de: "독일어", hi: "힌디어", bn: "벵골어", ur: "우르두어",
    id: "인도네시아어", ja: "일본어", vi: "베트남어", ko: "한국어",
  },
} as const;
