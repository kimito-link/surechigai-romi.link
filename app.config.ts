// Load environment variables with proper priority (system > .env)
import "./scripts/load-env.js";
import type { ExpoConfig } from "expo/config";
import appConfigJson from "./app.config.json" with { type: "json" };

const bundleId = appConfigJson.identity.bundleId;
const scheme = appConfigJson.identity.iosScheme;

const APP_VERSION = appConfigJson.stores.marketingVersion;

const env = {
  appName: appConfigJson.identity.displayName,
  appSlug: appConfigJson.identity.shortName,
  scheme,
  iosBundleId: bundleId,
  androidPackage: appConfigJson.stores.playPackageName,
  appVersion: APP_VERSION,
};

const config: ExpoConfig = {
  name: env.appName,
  slug: env.appSlug,
  version: env.appVersion,
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: env.scheme,
  "userInterfaceStyle": "dark",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: env.iosBundleId,
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        "すれ違った場所を記録し、思い出の場所を後からたどるために使用します",
      // 標準HTTPS(TLS)以外の独自暗号化を実装していないため輸出コンプライアンス対象外。
      // これが無いとASC提出前に手動設定を求められる（今回のビルドログで検出）。
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#00427B",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: env.androidPackage,
    // FOREGROUND_SERVICE は要求しない。バックグラウンド位置取得(TaskManager /
    // startLocationUpdatesAsync)の実装が 0 件で、位置取得は前景の
    // requestForegroundPermissionsAsync のみ（hooks/use-live-presence.ts）。
    // 使わない権限を宣言すると Google Play で用途申告を求められ審査が滞る。
    permissions: ["POST_NOTIFICATIONS", "ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION"],
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [
          {
            scheme: env.scheme,
            host: "*",
          },
        ],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    [
      "expo-router",
      {
        origin: "https://surechigai.kimito.link",
        asyncRoutes: {
          web: true,
          default: "development",
        },
      },
    ],
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#00427B",
      },
    ],
    [
      "expo-build-properties",
      {
        android: {
          buildArchs: ["armeabi-v7a", "arm64-v8a"],
        },
      },
    ],
    "expo-asset",
    // expo-audio / expo-video はプラグイン登録から外している。
    // アプリ本体からの import が 0 件で、登録すると expo-audio が RECORD_AUDIO(マイク)と
    // MODIFY_AUDIO_SETTINGS を AndroidManifest に自動追加してしまうため
    // （未使用の権限はストア審査で用途を問われる典型的な却下要因）。
    // LP の BGM は public/lp/app.js の素の Web Audio で鳴らしており expo-audio を使わない。
    // ネイティブで音声/動画を使う実装を入れる時に、ここへ戻すこと。
    "expo-font",
    "expo-web-browser",
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    eas: {
      projectId: "a58f673f-25cd-4713-9d1c-0d1062a68426",
    },
  },
};

export default config;
