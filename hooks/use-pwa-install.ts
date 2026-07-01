/**
 * PWA インストール検出 — beforeinstallprompt / standalone / プラットフォーム分岐
 */

import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { isPwaStandalone } from "@/features/onboarding/slide-visibility";

export const INSTALL_PROMPT_DISMISSED_KEY = "@install_prompt_dismissed";

export type PwaPlatform = "ios" | "android" | "desktop" | "unknown";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function detectPlatform(): PwaPlatform {
  if (Platform.OS !== "web" || typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  if (/Android/.test(ua)) return "android";
  return "desktop";
}

export function usePwaInstall() {
  const [isStandalone, setIsStandalone] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true);
  const [platform] = useState<PwaPlatform>(() => detectPlatform());
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") {
      setReady(true);
      return;
    }

    setIsStandalone(isPwaStandalone());

    void AsyncStorage.getItem(INSTALL_PROMPT_DISMISSED_KEY).then((value) => {
      setIsDismissed(value === "true");
      setReady(true);
    });

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const onAppInstalled = () => {
      setIsStandalone(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) return false;
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
        setIsInstallable(false);
        return true;
      }
    } catch (error) {
      console.error("PWA install prompt failed:", error);
    }
    return false;
  }, [deferredPrompt]);

  const dismissPrompt = useCallback(async () => {
    await AsyncStorage.setItem(INSTALL_PROMPT_DISMISSED_KEY, "true");
    setIsDismissed(true);
  }, []);

  const shouldShowInstallUi =
    Platform.OS === "web" && ready && !isStandalone && !isDismissed;

  return {
    isStandalone,
    isInstallable,
    isDismissed,
    shouldShowInstallUi,
    platform,
    promptInstall,
    dismissPrompt,
    ready,
  };
}
