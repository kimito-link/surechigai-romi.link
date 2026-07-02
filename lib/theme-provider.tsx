import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Appearance, Platform, View, type ViewStyle } from "react-native";
import { SchemeColors, type ColorScheme } from "@/constants/theme";
import { scheduleAfterWindowLoad } from "@/lib/schedule-after-idle";

/**
 * Theme Provider
 * SSR（+html / global.css）と一致するライト基調。
 */
const FIXED_SCHEME: ColorScheme = "light";

type ThemeContextValue = {
  colorScheme: ColorScheme;
  themeMode: "light";
  setColorScheme: (scheme: ColorScheme) => void;
  setThemeMode: (mode: "light") => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyDocumentTheme(): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset.theme = FIXED_SCHEME;
  root.classList.remove("dark");
  root.classList.add("light");
  const palette = SchemeColors[FIXED_SCHEME];
  Object.entries(palette).forEach(([token, value]) => {
    root.style.setProperty(`--color-${token}`, value);
  });
}

type ThemeProviderProps = {
  children: React.ReactNode;
  /** Guest `/` 初回 paint 用: NativeWind vars を load 後まで defer。 */
  deferNativeWind?: boolean;
};

export function ThemeProvider({ children, deferNativeWind = false }: ThemeProviderProps) {
  const [nativeWindStyle, setNativeWindStyle] = useState<ViewStyle | undefined>(undefined);

  useEffect(() => {
    if (Platform.OS !== "web") {
      void import("@/lib/_core/nativewind-pressable");
      Appearance.setColorScheme?.(FIXED_SCHEME);
      void import("nativewind").then(({ colorScheme, vars }) => {
        colorScheme.set(FIXED_SCHEME);
        setNativeWindStyle(
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
        );
      });
      return;
    }

    applyDocumentTheme();

    const loadNativeWind = () => {
      void import("nativewind").then(({ colorScheme, vars }) => {
        colorScheme.set(FIXED_SCHEME);
        Appearance.setColorScheme?.(FIXED_SCHEME);
        setNativeWindStyle(
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
        );
      });
    };

    if (deferNativeWind) {
      return scheduleAfterWindowLoad(loadNativeWind);
    }
    loadNativeWind();
  }, [deferNativeWind]);

  const setColorScheme = useCallback(() => {}, []);
  const setThemeMode = useCallback(() => {}, []);
  const toggleTheme = useCallback(() => {}, []);

  const value = useMemo(
    () => ({
      colorScheme: FIXED_SCHEME,
      themeMode: "light" as const,
      setColorScheme,
      setThemeMode,
      toggleTheme,
    }),
    [setColorScheme, setThemeMode, toggleTheme],
  );

  // Web: NativeWind の CSS 変数は applyDocumentTheme() が documentElement に
  // 同期設定済み（子孫へ継承で届く）。ルート View へ vars() を後付けすると、
  // window.load 後の setNativeWindStyle でルート以下が再ペイントされ、
  // SSG 済みの LCP 要素が「再ペイント時刻」で確定してしまう（LCP=JS完了に張り付く）。
  // よって Web ではルート View への二重注入を避け、初回 paint を LCP として成立させる。
  const shellStyle = useMemo(
    () => ({
      flex: 1,
      backgroundColor: SchemeColors[FIXED_SCHEME].background,
      ...(Platform.OS === "web" ? {} : (nativeWindStyle ?? {})),
    }),
    [nativeWindStyle],
  );

  return (
    <ThemeContext.Provider value={value}>
      <View style={shellStyle}>{children}</View>
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
