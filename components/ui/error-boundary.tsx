/**
 * ErrorBoundary - 汎用エラーバウンダリコンポーネント
 * 
 * React 18のクラスコンポーネントを使用してエラーをキャッチし、
 * アプリ全体のクラッシュを防ぎます。
 * 
 * 使用例:
 * ```tsx
 * <ErrorBoundary fallback={<ErrorFallback />}>
 *   <RiskyComponent />
 * </ErrorBoundary>
 * ```
 */

import React, { Component, type ReactNode, type ErrorInfo } from "react";
import { View, Text, StyleSheet } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { color, typography } from "@/theme/tokens";
import { RetryButton } from "./retry-button";

// エラーバウンダリのProps型
export interface ErrorBoundaryProps {
  /** 画面・コンポーネント名（ログ・表示の特定用） */
  screenName?: string;
  /** エラー時に表示するフォールバックUI */
  fallback?: ReactNode;
  /** エラー時に表示するフォールバックUIを返す関数 */
  fallbackRender?: (props: FallbackProps) => ReactNode;
  /** エラー発生時のコールバック */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** リトライ時のコールバック */
  onReset?: () => void;
  /** 子コンポーネント */
  children: ReactNode;
}

// フォールバックコンポーネントに渡されるProps
export interface FallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
  /** エラー発生箇所の識別名 */
  screenName?: string;
}

// エラーバウンダリの状態型
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary - クラスコンポーネント
 * 
 * React 18ではエラーバウンダリはクラスコンポーネントでのみ実装可能
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { screenName } = this.props;
    const prefix = screenName ? `[ErrorBoundary][${screenName}]` : "[ErrorBoundary]";
    console.error(prefix, "Caught error:", error);
    console.error(prefix, "Component stack:", errorInfo.componentStack);
    this.props.onError?.(error, errorInfo);
  }

  resetErrorBoundary = (): void => {
    this.props.onReset?.();
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback, fallbackRender } = this.props;

    if (hasError && error) {
      // fallbackRenderが指定されていればそれを使用
      if (fallbackRender) {
        return fallbackRender({
          error,
          resetErrorBoundary: this.resetErrorBoundary,
          screenName: this.props.screenName,
        });
      }

      // fallbackが指定されていればそれを使用
      if (fallback) {
        return fallback;
      }

      // デフォルトのフォールバックUI
      return (
        <DefaultErrorFallback
          error={error}
          resetErrorBoundary={this.resetErrorBoundary}
          screenName={this.props.screenName}
        />
      );
    }

    return children;
  }
}

/**
 * DefaultErrorFallback - デフォルトのエラー表示UI（screenName で発生箇所を表示）
 */
function DefaultErrorFallback({ error, resetErrorBoundary, screenName }: FallbackProps) {
  return (
    <View style={styles.container}>
      <MaterialIcons name="error-outline" size={48} color={color.danger} />
      <Text style={styles.title}>エラーが発生しました</Text>
      {screenName ? (
        <Text style={styles.screenName} numberOfLines={1}>{screenName}</Text>
      ) : null}
      <Text style={styles.message} numberOfLines={3}>
        {error.message}
      </Text>
      <RetryButton onPress={resetErrorBoundary} variant="primary" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: color.surface,
    borderRadius: 16,
    gap: 12,
  },
  title: {
    color: color.textWhite,
    fontSize: typography.fontSize.lg,
    fontWeight: "bold",
  },
  screenName: {
    color: color.textHint,
    fontSize: typography.fontSize.xs,
    marginTop: 4,
  },
  message: {
    color: color.textMuted,
    fontSize: typography.fontSize.sm,
    textAlign: "center",
    maxWidth: 280,
  },
});

export default ErrorBoundary;
