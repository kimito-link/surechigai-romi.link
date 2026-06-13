import { useEffect, useRef, createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { Text, Animated, StyleSheet, Platform } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { color, palette } from "@/theme/tokens";
import * as Haptics from "expo-haptics";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  onHide: () => void;
  action?: {
    label: string;
    onPress: () => void;
  };
}

const toastConfig = {
  success: {
    icon: "check-circle" as const,
    bg: color.toastSuccessBg,
    border: color.successDark,
    iconColor: color.successDark,
  },
  error: {
    icon: "error" as const,
    bg: color.toastErrorBg,
    border: color.danger,
    iconColor: color.danger,
  },
  warning: {
    icon: "warning" as const,
    bg: color.toastWarningBg,
    border: color.warning,
    iconColor: color.warning,
  },
  info: {
    icon: "info" as const,
    bg: color.toastInfoBg,
    border: color.info,
    iconColor: color.info,
  },
};

/**
 * 統一されたトースト通知コンポーネント
 * 
 * UI/UXガイドに基づく設計:
 * - 即時フィードバック: 操作結果を即座に通知
 * - 視覚的に明確: アイコン、色、テキストで状態を表現
 * - 自動消去: 指定時間後に自動的に消える
 * - 触覚フィードバック: 成功/エラー時に振動
 */
export function Toast({
  visible,
  message,
  type = "info",
  duration = 3000,
  onHide,
  action,
}: ToastProps) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const config = toastConfig[type];

  const hideToast = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  }, [onHide, opacity, translateY]);

  useEffect(() => {
    if (visible) {
      // 触覚フィードバック
      if (Platform.OS !== "web") {
        if (type === "success") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else if (type === "error") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } else if (type === "warning") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
      }

      // 表示アニメーション
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 10,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // 自動消去
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, hideToast, opacity, translateY, type, visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: config.bg,
          borderColor: config.border,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <MaterialIcons name={config.icon} size={24} color={config.iconColor} />
      <Text style={styles.message}>{message}</Text>
      {action && (
        <Text style={styles.action} onPress={action.onPress}>
          {action.label}
        </Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 60,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    zIndex: 9999,
    shadowColor: palette.gray900,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  message: {
    flex: 1,
    color: color.textWhite,
    fontSize: 15,
    fontWeight: "500",
    marginLeft: 12,
    lineHeight: 20,
  },
  action: {
    color: color.textWhite,
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 12,
    textDecorationLine: "underline",
  },
});

// トースト状態管理用のコンテキスト

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  showSuccess: (message: string) => void;
  showError: (message: string, requestId?: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
  /** 開発モードでrequestId付きエラーを表示 (v6.41) */
  showErrorWithRequestId: (message: string, requestId?: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toastState, setToastState] = useState<{
    visible: boolean;
    message: string;
    type: ToastType;
    duration: number;
  }>({
    visible: false,
    message: "",
    type: "info",
    duration: 3000,
  });

  const showToast = useCallback((message: string, type: ToastType = "info", duration: number = 3000) => {
    setToastState({ visible: true, message, type, duration });
  }, []);

  const showSuccess = useCallback((message: string) => showToast(message, "success"), [showToast]);
  
  // v6.41: requestId対応のエラー表示
  const showError = useCallback((message: string, requestId?: string) => {
    // 開発モードではrequestIdを表示
    if (__DEV__ && requestId) {
      showToast(`${message} [${requestId}]`, "error", 5000);
    } else {
      showToast(message, "error");
    }
  }, [showToast]);
  
  const showWarning = useCallback((message: string) => showToast(message, "warning"), [showToast]);
  const showInfo = useCallback((message: string) => showToast(message, "info"), [showToast]);
  
  // v6.41: requestId付きエラー表示（明示的に呼び出す場合）
  const showErrorWithRequestId = useCallback((message: string, requestId?: string) => {
    if (requestId) {
      // 開発モード: 完全なrequestIdを表示
      // 本番モード: 短縮版を表示（ユーザーがサポートに報告できるように）
      const displayId = __DEV__ ? requestId : requestId.slice(-8);
      showToast(`${message} [ID: ${displayId}]`, "error", 5000);
    } else {
      showToast(message, "error");
    }
  }, [showToast]);

  const hideToast = useCallback(() => {
    setToastState((prev) => ({ ...prev, visible: false }));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showWarning, showInfo, showErrorWithRequestId }}>
      {children}
      <Toast
        visible={toastState.visible}
        message={toastState.message}
        type={toastState.type}
        duration={toastState.duration}
        onHide={hideToast}
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
