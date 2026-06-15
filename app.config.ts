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
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: env.iosBundleId,
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#4F86C6",
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
        origin: "https://surechigai-romi.link",
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
        backgroundColor: "#ffffff",
        dark: {
          backgroundColor: "#000000",
        },
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
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};

export default config;
