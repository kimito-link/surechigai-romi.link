import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Appearance, View } from "react-native";
import { colorScheme as nativewindColorScheme, vars } from "nativewind";

import { SchemeColors, type ColorScheme } from "@/constants/theme";

/**
 * Theme Provider
 * v6.36: ダークモード専用化（テーマ切り替え機能を削除）
 */
const FIXED_SCHEME: ColorScheme = "dark";

type ThemeContextValue = {
  colorScheme: ColorScheme;
  // 後方互換性のため残すが、常にdarkを返す
  themeMode: "dark";
  setColorScheme: (scheme: ColorScheme) => void;
  setThemeMode: (mode: "dark") => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);

  const applyScheme = useCallback(() => {
    nativewindColorScheme.set(FIXED_SCHEME);
    Appearance.setColorScheme?.(FIXED_SCHEME);
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      root.dataset.theme = FIXED_SCHEME;
      root.classList.add("dark");
      const palette = SchemeColors[FIXED_SCHEME];
      Object.entries(palette).forEach(([token, value]) => {
        root.style.setProperty(`--color-${token}`, value);
      });
    }
  }, []);

  useEffect(() => {
    applyScheme();
    setIsInitialized(true);
  }, [applyScheme]);

  const themeVariables = useMemo(
    () =>
      vars({
        "color-primary": SchemeColors[FIXED_SCHEME].primary,
        "color-background": SchemeColors[FIXED_SCHEME].background,
        "color-surface": SchemeColors[FIXED_SCHEME].surface,
        "color-foreground": SchemeColors[FIXED_SCHEME].foreground,
        "color-muted": SchemeColors[FIXED_SCHEME].muted,
        "color-border": SchemeColors[FIXED_SCHEME].border,
        "color-success": SchemeColors[FIXED_SCHEME].success,
        "color-warning": SchemeColors[FIXED_SCHEME].warning,
        "color-error": SchemeColors[FIXED_SCHEME].error,
      }),
    [],
  );

  // 後方互換性のためのダミー関数
  const setColorScheme = useCallback(() => {
    // ダークモード専用なので何もしない
  }, []);

  const setThemeMode = useCallback(() => {
    // ダークモード専用なので何もしない
  }, []);

  const toggleTheme = useCallback(() => {
    // ダークモード専用なので何もしない
  }, []);

  const value = useMemo(
    () => ({
      colorScheme: FIXED_SCHEME,
      themeMode: "dark" as const,
      setColorScheme,
      setThemeMode,
      toggleTheme,
    }),
    [setColorScheme, setThemeMode, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>
      <View style={[{ flex: 1 }, themeVariables]}>{children}</View>
    </ThemeContext.Provider>
  );
}

export function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useThemeContext must be used within ThemeProvider");
  }
  return ctx;
}
