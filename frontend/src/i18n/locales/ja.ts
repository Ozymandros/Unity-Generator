/**
 * Japanese (ja) locale.
 */
export default {
  app: {
    title: "Unity Generator",
    status: { online: "オンライン", offline: "オフライン" },
    nav: {
      settings: "設定", scenes: "シーン", code: "コード", text: "テキスト",
      image: "画像", sprites: "スプライト", audio: "オーディオ",
      unityUi: "Unity UI", unityPhysics: "Unity 物理", unityProject: "Unity プロジェクト",
    },
    actions: { repository: "リポジトリ" },
  },
  common: {
    loading: "読み込み中…", saving: "保存中…", save: "保存",
    cancel: "キャンセル", close: "閉じる", ok: "OK", yes: "はい", no: "いいえ",
    error: "エラー", warning: "警告", success: "成功", generate: "生成",
    result: "結果", provider: "プロバイダー", model: "モデル", temperature: "温度",
    apiKey: "APIキー（任意のオーバーライド）", systemPrompt: "システムプロンプトのオーバーライド",
    advancedOptions: "詳細オプション", examplePrompts: "プロンプト例",
    manageModels: "モデルを管理", selectProvider: "プロバイダーを選択",
    selectModel: "モデルを選択", prompt: "プロンプト",
    leaveEmptyForGlobalKey: "グローバルキーを使用するには空白のままにしてください",
    createdFiles: "作成されたファイル", viewSteps: "ステップを表示 ({n})",
    waitingForLogs: "ログを待機中…", errorsDetected: "エラーが検出されました",
  },
  settings: {
    title: "設定",
    subtitle: "インテリジェンスエンジン、モデル、システムプロンプトを管理します。",
    tabs: { general: "一般", providers: "プロバイダー", models: "モデル", prompts: "プロンプト", secrets: "シークレット" },
  },
  general: {
    title: "一般設定",
    sections: { networkApi: "ネットワークとAPI", preferredIntelligence: "優先インテリジェンス", appearance: "外観", language: "言語" },
    fields: {
      backendUrl: "バックエンドURL", backendUrlHint: "Unity Generatorバックエンドサービスのアドレス",
      outputBasePath: "ベースパス（出力）", outputBasePathHint: "生成されたファイルの保存場所",
      unityEditorPath: "Unityエディターパス（任意）", unityEditorPathHint: "Unityエディター実行ファイルへのフルパス",
      preferredLlm: "デフォルトのテキスト/ロジックプロバイダー", preferredLlmModel: "デフォルトのテキスト/ロジックモデル",
      preferredImage: "デフォルトの画像生成プロバイダー", preferredImageModel: "デフォルトの画像生成モデル",
      preferredAudio: "デフォルトの音声（TTS）プロバイダー", preferredAudioModel: "デフォルトの音声（TTS）モデル",
      preferredMusic: "デフォルトの音楽プロバイダー", preferredMusicModel: "デフォルトの音楽モデル",
      theme: "テーマ", language: "インターフェース言語",
    },
    actions: { saveAll: "すべての変更を保存" },
    status: {
      saving: "保存中…", saved: "設定が正常に保存されました。",
      modelNotRegistered: 'モデル"{model}"はプロバイダー"{provider}"に登録されていません。',
      networkError: "ネットワークエラー：バックエンドに接続できません。",
    },
  },
  code: {
    title: "Unity C#コード", subtitle: "AIを使用してUnity C#スクリプトを生成します。",
    fields: { prompt: "プロンプト", maxTokens: "最大トークン数" },
    actions: { generate: "コードを生成" },
    activeProject: "アクティブプロジェクト: {name}", autoSave: "プロジェクトに自動保存",
  },
  text: {
    title: "テキスト生成", subtitle: "AIを使用してテキストコンテンツを生成します。",
    fields: { prompt: "プロンプト", length: "長さ" }, actions: { generate: "テキストを生成" },
  },
  image: {
    title: "画像生成", subtitle: "AIを使用して画像を生成します。",
    fields: { prompt: "プロンプト", aspectRatio: "アスペクト比", quality: "品質", textureName: "テクスチャ名", textureType: "テクスチャタイプ" },
    actions: { generate: "画像を生成", saveToUnity: "Unityに保存" },
  },
  sprites: {
    title: "2Dスプライト", badge: "ピクセルアート向けに最適化", subtitle: "Unity用の2Dスプライトを生成します。",
    fields: { prompt: "プロンプト", resolution: "解像度", paletteSize: "パレットサイズ", autoCrop: "透明な端を自動トリミング", colors: "{n}色" },
    preview: "プレビューエリア", actions: { generate: "スプライトを生成" },
  },
  audio: {
    title: "オーディオ生成", subtitle: "AIを使用してオーディオアセットを生成します。",
    generationType: "生成タイプ", speechTts: "音声（TTS）", atmosphericMusic: "雰囲気音楽",
    fields: { prompt: "プロンプト", musicDescription: "音楽の説明", speechPrompt: "音声プロンプト", voiceOptional: "ボイス（任意）", musicModel: "音楽モデル", stability: "安定性", audioClipName: "オーディオクリップ名", audioFormat: "オーディオフォーマット" },
    actions: { generate: "オーディオを生成", saveToUnity: "Unityに保存" },
  },
  scenes: {
    title: "シーンクリエーター", subtitle: "AIを使用してUnityシーンを生成します。",
    fields: { prompt: "シーンの説明" }, actions: { generate: "シーンを作成" },
    mediaReady: "メディアのインポート準備完了",
    mediaReadyText: "{type}「{name}」はUnityにインポートする準備ができています。プロンプトを確認して「シーンを作成」をクリックして続行してください。",
    mediaTypeImage: "画像", mediaTypeAudio: "オーディオ",
  },
  unityUi: {
    title: "Unity UI", subtitle: "AIを使用してUnity UIコンポーネントを生成します。",
    fields: { uiSystem: "UIシステム", elementType: "要素タイプ", prompt: "UI要素の説明", outputFormat: "出力フォーマット", anchorPreset: "アンカープリセット", colourTheme: "カラーテーマ（任意）", includeAnimations: "アニメーションを含める" },
    actions: { generate: "UIを生成" },
  },
  unityPhysics: {
    title: "Unity物理", subtitle: "Unity物理設定を生成します — Rigidbodies、コライダー、重力など。",
    fields: { physicsBackend: "物理エンジン", simulationMode: "シミュレーションモード", gravityPreset: "重力プリセット", prompt: "物理の説明", includeRigidbody: "Rigidbody設定を含める", includeColliders: "コライダー設定を含める", includeLayers: "物理レイヤーを含める" },
    actions: { generate: "物理設定を生成" },
    quickActions: "クイックアクション",
  },
  unityProject: {
    title: "Unityプロジェクト", subtitle: "完全なUnityプロジェクト構造を生成します。",
    engineSettings: "Unityエンジン設定",
    fields: { projectName: "プロジェクト名", unityTemplate: "Unityテンプレート", unityVersion: "Unityバージョン", targetPlatform: "ターゲットプラットフォーム", generateDefaultScene: "デフォルトシーンを生成", autoInstallPackages: "UPMパッケージを自動インストール", setupUrp: "URPを設定", upmPackages: "UPMパッケージ（カンマ区切り）", sceneName: "シーン名", unityEditorPath: "Unityエディターパス（任意）", timeout: "タイムアウト（秒）", resultJson: "結果（JSON）" },
    actions: { generate: "プロジェクトを生成", finalize: "プロジェクトを完成", openFolder: "出力フォルダーを開く", addVersion: "Unityバージョンを追加", downloadZip: "完成したプロジェクトをダウンロード（.zip）" },
    dialogs: { addVersion: { title: "Unityバージョンを追加", versionId: "バージョンID", label: "ラベル（任意）" } },
  },
  theme: { light: "ライト", dark: "ダーク", system: "システム" },
  languages: {
    en: "英語", es: "スペイン語", ca: "カタルーニャ語", eu: "バスク語", oc: "オック語", uk: "ウクライナ語",
    pt: "ポルトガル語", gl: "ガリシア語", fr: "フランス語", it: "イタリア語", pl: "ポーランド語", zh: "中国語",
    ar: "アラビア語", de: "ドイツ語", hi: "ヒンディー語", bn: "ベンガル語", ur: "ウルドゥー語",
    id: "インドネシア語", ja: "日本語", vi: "ベトナム語", ko: "韓国語",
  },
} as const;
