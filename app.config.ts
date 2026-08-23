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
    // iPhone 専用（2026-08-07）。CI は Capacitor 時代から
    // TARGETED_DEVICE_FAMILY = "1" を強制しており、その意図に合わせる。
    // App Store は iPad 対応を宣言すると iPad でのスクショと動作を要求する
    // （Guideline 2.1(a)「iPad で期待どおり動くこと」）。
    // 位置情報アプリで iPad の需要は薄く、審査変数を増やすだけなので false。
    supportsTablet: false,
    bundleIdentifier: env.iosBundleId,
    infoPlist: {
      // 「記録」だけでなく「他の利用者に市区町村粒度で共有される」ことまで書く。
      // 実態より狭い説明は Guideline 5.1.2(目的外利用)の指摘余地になるため。
      NSLocationWhenInUseUsageDescription:
        "すれ違った場所を記録して思い出の場所を後からたどるため、および近くにいた他の利用者とのすれ違いを市区町村の粒度で表示するために使用します",
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
        /* ★2026-08-23 に方式を直した。それまでの見え方と、なぜ直すか:

           旧: 背景を焼き込んだ**ネイビーの正方形** 600px を imageWidth:200 で置いていた。
           expo-splash-screen は 288dp キャンバスに画像を中央合成し、**背景は自分で敷く**
           （@expo/prebuild-config の withAndroidSplashImages.js:166）。
           そこへ不透過の正方形を渡すと 288dp 全面がネイビーで埋まり、
           ★Android 12+ が**円形にトリミング**するので「ネイビーの円」になっていた。
           実測: 生成物の絵柄 bbox 287x287dp / 半対角 202.9dp に対し
           ★安全円の半径は 96.0dp（Android 公式: 288dp キャンバス・直径192dp の円）。

           新: 画像は**透過PNG 1024px**（Expo 公式の推奨サイズ）。絵柄は安全円の内側
           （実測: 半対角比 0.285 < 0.333）。背景は下の backgroundColor に任せる。 */
        image: "./assets/images/splash-icon.png",
        /* dp 指定（px ではない）。Android xxxhdpi は 4x なので 240dp → 960px を要求する。
           素材が 1024px あるのでアップスケールは起きない（ここが 1024 にした理由）。

           ★240 の根拠（実測から逆算）: 透過にしたことで絵柄の半対角は 43.0dp まで縮み、
           安全円の半径 96.0dp に対して **2.23倍の余裕**ができた。
           そのまま 150 だと画面で小さく見えて寂しいので上げる。
           ただし安全円ぎりぎり(335 相当)は機種差で切れるため、余裕の8割程度に留める。
           ★不透過だった旧素材では 136 が数学的上限だった。透過にして初めて大きくできる。 */
        imageWidth: 240,
        resizeMode: "contain",
        /* ★本体の地色と揃える（チカつき対策）。
           旧構成は splash=#00427B（ネイビー）→ 本体=#F0F4F8（ほぼ白）で、
           起動直後に**濃紺から白へ切り替わる**のが見えていた。
           PWA manifest(#E2EDF7) と Web のスプラッシュ地も明色なので、
           ★4箇所のうちネイティブだけが違う状態だった。明色側へ寄せる。 */
        backgroundColor: "#E2EDF7",
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
    // expo-audio / expo-video は **依存ごと削除した**（2026-08-12）。
    //
    // ⚠️ プラグイン登録から外すだけでは足りない。
    //    以前は「plugins に載せない」対応だけしていたが、
    //    パッケージが node_modules にある限り Android のマニフェストマージが働き、
    //    expo-audio が宣言する FOREGROUND_SERVICE_MEDIA_PLAYBACK が
    //    アプリ本体の AndroidManifest に入ってしまう。
    //    その結果 Play Console に「フォアグラウンドサービスの権限」の申告が要求され、
    //    しかも「その他」を選ぶと**用途を示す動画の提出**まで求められた（実際に詰まった）。
    //    使っていない権限のために動画を作るのは本末転倒なので、依存を消すのが正解。
    //
    // 実測: app/ components/ lib/ hooks/ modules/ features/ からの import は 0 件、
    //       他パッケージからの依存も 0 件。
    // LP の BGM は public/lp/app.js の素の Web Audio で鳴らしており expo-audio を使わない。
    // ネイティブで音声/動画を使う実装を入れる時に、pnpm add で戻すこと。
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
