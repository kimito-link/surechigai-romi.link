/**
 * かんたん表示（文字を大きくする）
 *
 * nagano_giin_complete_guide の easy-large（文字拡大）UXを移植したもの。
 * PCやスマホに不慣れな人でも読みやすく・押しやすくするためのアクセシビリティ機能。
 *
 * 仕組み: Text / TextInput の render を一度だけパッチし、全文字に倍率をかける。
 *   各コンポーネントが fontSize を直書きしていても、flatten して掛け直すので
 *   画面側を1つ1つ書き換えずにアプリ全体へ一括適用できる。
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Text, TextInput, StyleSheet, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "romi.textScale.v1";
/** 「大きく」したときの倍率（読みやすさと崩れにくさのバランス） */
export const LARGE_TEXT_SCALE = 1.2;
const IS_WEB = Platform.OS === "web";

// Text.render が参照するモジュールレベルの現在倍率（Native 用）。
let currentScale = 1;

/**
 * Web: ルート要素に CSS zoom をかけ、文字も操作ボタンも一括で拡大する。
 *   再マウント不要で即時反映でき、タップ領域も大きくなる（不慣れな人向け）。
 */
function applyWebZoom(large: boolean) {
  if (!IS_WEB || typeof document === "undefined") return;
  const root = document.documentElement as HTMLElement & {
    style: CSSStyleDeclaration & { zoom?: string };
  };
  root.style.zoom = large ? String(LARGE_TEXT_SCALE) : "";
}

let patched = false;
function patchTextScaling() {
  if (patched) return;
  patched = true;

  for (const Comp of [Text, TextInput] as unknown as {
    render?: (...args: unknown[]) => React.ReactElement | null;
  }[]) {
    const original = Comp.render;
    if (typeof original !== "function") continue;
    Comp.render = function patchedRender(this: unknown, ...args: unknown[]) {
      const element = original.apply(this, args) as React.ReactElement<{
        style?: unknown;
      }> | null;
      if (currentScale === 1 || !element) return element;
      const flat = (StyleSheet.flatten(element.props.style) ?? {}) as {
        fontSize?: number;
        lineHeight?: number;
      };
      const fontSize = typeof flat.fontSize === "number" ? flat.fontSize : 14;
      const extra: { fontSize: number; lineHeight?: number } = {
        fontSize: Math.round(fontSize * currentScale),
      };
      if (typeof flat.lineHeight === "number") {
        extra.lineHeight = Math.round(flat.lineHeight * currentScale);
      }
      return React.cloneElement(element, {
        style: [element.props.style, extra],
      });
    };
  }
}
patchTextScaling();

interface TextScaleContextValue {
  isLarge: boolean;
  toggle: () => void;
  setLarge: (large: boolean) => void;
}

const TextScaleContext = createContext<TextScaleContextValue>({
  isLarge: false,
  toggle: () => {},
  setLarge: () => {},
});

export function TextScaleProvider({ children }: { children: React.ReactNode }) {
  const [isLarge, setIsLarge] = useState(false);
  // version を変えると配下が再レンダリングされ、パッチ後の倍率が即反映される。
  const [version, setVersion] = useState(0);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => {
        if (v === "1") {
          if (IS_WEB) {
            applyWebZoom(true);
          } else {
            currentScale = LARGE_TEXT_SCALE;
            setVersion((n) => n + 1);
          }
          setIsLarge(true);
        }
      })
      .catch(() => {});
  }, []);

  const setLarge = useCallback((large: boolean) => {
    if (IS_WEB) {
      // Web は zoom で即時反映（再マウント・画面リセットなし）
      applyWebZoom(large);
    } else {
      // Native は Text パッチの倍率を変え、配下を再マウントして反映
      currentScale = large ? LARGE_TEXT_SCALE : 1;
      setVersion((n) => n + 1);
    }
    setIsLarge(large);
    AsyncStorage.setItem(STORAGE_KEY, large ? "1" : "0").catch(() => {});
  }, []);

  const toggle = useCallback(() => setLarge(!isLarge), [setLarge, isLarge]);

  return (
    <TextScaleContext.Provider value={{ isLarge, toggle, setLarge }}>
      <React.Fragment key={version}>{children}</React.Fragment>
    </TextScaleContext.Provider>
  );
}

export function useTextScale() {
  return useContext(TextScaleContext);
}
