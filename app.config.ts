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
    permissions: ["POST_NOTIFICATIONS", "ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION", "FOREGROUND_SERVICE"],
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
    "expo-audio",
    "expo-font",
    "expo-video",
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
