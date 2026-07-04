/**
 * Web: MaterialIcons フォント（~349KB）を load 後まで defer。
 * 既知アイコンは SVG、それ以外は load まで軽量プレースホルダ。
 *
 * 2026-07-04 障害対応（本番全面凍結→OOMの根本修正）:
 * 旧実装は `import("@expo/vector-icons/MaterialIcons")` の動的 import 経由で
 * 実体アイコンを描画していたが、この構成には2つの致命傷があった。
 * 1. ttf アセットが静的エクスポートに含まれなくなる（本番は未知パスに
 *    200/HTML を返すため、フォントは常に壊れた状態だった）。
 * 2. 動的 import されたチャンクから実体アイコンを描画すると、React 19 で
 *    無限 sync 再レンダリングに陥り、scheduler がメインスレッドを専有して
 *    タブ全体が凍結→数分後に Out of Memory する（静的 import なら起きないことを
 *    ビルド比較で実証済み。チャンク境界による module 二重化が原因とみられる）。
 * 対策: アイコン JS は【静的 import 必須】（動的 import に戻さないこと）。
 * 重い方の実体＝フォント ttf(~349KB) のダウンロードだけを FontFace 使用時まで
 * 遅延し、`Font.loadAsync` 成功と `Font.isLoaded` を確認できた場合に限り
 * 実体アイコンへ切り替える。失敗時は SVG/プレースホルダ表示のまま（凍結経路を遮断）。
 * フォント到着の通知は module 単一の外部ストア + useSyncExternalStore で行い、
 * インスタンスごとの setState を持たない。
 * 詳細: docs/investigation/auth-home-oom-root-cause.md
 */
import { useEffect, useSyncExternalStore, type ComponentType } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import * as Font from "expo-font";
import { scheduleAfterWindowLoad } from "@/lib/schedule-after-idle";
import { MaterialIconSvg, hasMaterialSvgPath } from "@/lib/icons/material-icon-svg";

const FONT_FAMILY = "MaterialIcons";

// 静的 asset import: エクスポートに ttf を確実に含める（フォント JS 本体は読み込まない）
// eslint-disable-next-line @typescript-eslint/no-var-requires
const materialIconsFontAsset: number = require("@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialIcons.ttf");

type RealMaterialIcons = ComponentType<{
  name: string;
  size?: number;
  color?: string;
  style?: object;
}>;

// 静的 import 必須: 動的 import 経由で描画すると本番で無限再レンダリング→OOM（冒頭コメント参照）
// eslint-disable-next-line @typescript-eslint/no-var-requires
const StaticRealIcons = require("@expo/vector-icons/MaterialIcons").default as RealMaterialIcons;
let RealIcons: RealMaterialIcons | null = null;
let loadTask: Promise<void> | null = null;
let loadScheduled = false;
const listeners = new Set<() => void>();

function loadMaterialIconsFont(): Promise<void> {
  if (RealIcons) return Promise.resolve();
  if (!loadTask) {
    loadTask = (async () => {
      await Font.loadAsync({ [FONT_FAMILY]: materialIconsFontAsset });
      if (!Font.isLoaded(FONT_FAMILY)) {
        throw new Error("MaterialIcons font did not load");
      }
      RealIcons = StaticRealIcons;
      for (const notify of listeners) notify();
    })().catch((error) => {
      // フォントが使えない環境では SVG/プレースホルダのまま運用する（凍結防止）
      console.warn("[icons] MaterialIcons font disabled:", error?.message ?? error);
    });
  }
  return loadTask;
}

/** load 後（既に complete なら idle）にフォントロードを1回だけ予約する。 */
function scheduleFontLoadOnce(): void {
  if (loadScheduled || RealIcons) return;
  loadScheduled = true;
  scheduleAfterWindowLoad(() => {
    void loadMaterialIconsFont();
  });
}

/** load 後 prefetch 用（認証ルート向け）。 */
export function prefetchMaterialIconsFont(): void {
  scheduleFontLoadOnce();
}

function subscribeFont(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

function getFontSnapshot(): RealMaterialIcons | null {
  return RealIcons;
}

function getFontServerSnapshot(): RealMaterialIcons | null {
  return null;
}

type MaterialIconProps = {
  name: string;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
};

export default function MaterialIcons({ name, size = 24, color = "#000", style }: MaterialIconProps) {
  const Real = useSyncExternalStore(subscribeFont, getFontSnapshot, getFontServerSnapshot);
  const needsFont = !hasMaterialSvgPath(name);

  useEffect(() => {
    if (needsFont && !Real) scheduleFontLoadOnce();
  }, [needsFont, Real]);

  if (!needsFont) {
    return (
      <View style={[{ width: size, height: size, alignItems: "center", justifyContent: "center" }, style]}>
        <MaterialIconSvg name={name} size={size} color={String(color)} />
      </View>
    );
  }

  if (Real) {
    return <Real name={name} size={size} color={color} style={style as object | undefined} />;
  }

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 4,
          backgroundColor: "rgba(0,66,123,0.08)",
        },
        style,
      ]}
    />
  );
}
