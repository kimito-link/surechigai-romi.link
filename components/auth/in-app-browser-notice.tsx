/**
 * アプリ内ブラウザ検出と外部ブラウザ誘導（kimitolink InAppBrowserNotice 準拠）。
 * Web のみ動作。Native では null。
 */
import { useEffect, useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import {
  buildAndroidChromeIntentUrl,
  escapeStrategyFor,
  isInAppBrowser,
  type EscapeStrategy,
} from "@/lib/in-app-browser";
import { palette } from "@/theme/tokens";

export function InAppBrowserNotice() {
  const [isInApp, setIsInApp] = useState(false);
  const [strategy, setStrategy] = useState<EscapeStrategy>("copy-link");
  const [targetUrl, setTargetUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof navigator === "undefined") return;
    const ua = navigator.userAgent || "";
    if (!isInAppBrowser(ua)) return;
    setIsInApp(true);
    setStrategy(escapeStrategyFor(ua));
    setTargetUrl(window.location.href);
  }, []);

  if (Platform.OS !== "web" || !isInApp) return null;

  const handleAndroidOpen = () => {
    const intentUrl = buildAndroidChromeIntentUrl(targetUrl);
    if (intentUrl) window.location.href = intentUrl;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(targetUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
    } catch {
      // クリップボード不可の環境では手順案内に任せる。
    }
  };

  return (
    <View
      accessibilityRole="alert"
      style={{
        width: "100%",
        maxWidth: 448,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: palette.kimitoOrange,
        backgroundColor: "#FFF7ED",
        padding: 16,
      }}
    >
      <Text style={{ fontWeight: "800", fontSize: 15, color: palette.kimitoOrange }}>
        この画面のままだとログインできないことがあります
      </Text>
      <Text style={{ marginTop: 8, fontSize: 15, lineHeight: 22, color: palette.gray800 }}>
        いまアプリの中のブラウザで開いています。X のログインは、ふだんお使いのブラウザ（Chrome や Safari）で開くと、うまくいきます。
      </Text>

      {strategy === "android-intent" ? (
        <Pressable
          onPress={handleAndroidOpen}
          accessibilityRole="button"
          style={{
            marginTop: 12,
            minHeight: 48,
            borderRadius: 12,
            backgroundColor: palette.kimitoOrange,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 20,
          }}
        >
          <Text style={{ fontWeight: "800", fontSize: 16, color: palette.white }}>
            ふだんのブラウザで開く
          </Text>
        </Pressable>
      ) : (
        <Pressable
          onPress={handleCopy}
          accessibilityRole="button"
          style={{
            marginTop: 12,
            minHeight: 48,
            borderRadius: 12,
            backgroundColor: palette.kimitoOrange,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 20,
          }}
        >
          <Text style={{ fontWeight: "800", fontSize: 16, color: palette.white }}>
            {copied ? "コピーしました！" : "このページのリンクをコピー"}
          </Text>
        </Pressable>
      )}

      {strategy === "copy-link" && copied ? (
        <Text style={{ marginTop: 8, fontSize: 14, fontWeight: "600", color: palette.gray700 }}>
          Safari を開いて、上のアドレス欄に貼り付けて移動してください。
        </Text>
      ) : null}

      <Pressable
        onPress={() => setManualOpen((v) => !v)}
        accessibilityRole="button"
        style={{ marginTop: 12 }}
      >
        <Text style={{ fontWeight: "700", fontSize: 14, color: palette.kimitoOrange }}>
          {manualOpen ? "手順を閉じる" : "うまくいかないときは（手順を見る）"}
        </Text>
      </Pressable>
      {manualOpen ? (
        <View style={{ marginTop: 8, paddingLeft: 8, gap: 6 }}>
          <Text style={{ fontSize: 14, lineHeight: 20, color: palette.gray800 }}>
            1. 画面の右上のメニュー（「…」や「⋮」）を押す
          </Text>
          <Text style={{ fontSize: 14, lineHeight: 20, color: palette.gray800 }}>
            2. 「ブラウザで開く」「外部ブラウザで開く」を選ぶ
          </Text>
          <Text style={{ fontSize: 14, lineHeight: 20, color: palette.gray800 }}>
            3. 開いたブラウザで、もう一度「X で続ける」を押す
          </Text>
        </View>
      ) : null}
    </View>
  );
}
