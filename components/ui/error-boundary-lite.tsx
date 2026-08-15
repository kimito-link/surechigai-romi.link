import React, { Component, type ReactNode, type ErrorInfo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { color } from "@/theme/tokens";
import {
  isChunkLoadError,
  tryRecoverFromChunkError,
} from "@/lib/chunk-load-recovery";

type Props = {
  screenName?: string;
  children: ReactNode;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

/** MaterialIcons 非依存の軽量 ErrorBoundary（guest entry 向け）。 */
export class ErrorBoundaryLite extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const prefix = this.props.screenName ? `[ErrorBoundaryLite][${this.props.screenName}]` : "[ErrorBoundaryLite]";
    console.error(prefix, error, errorInfo.componentStack);

    // 遅延読み込みチャンクの取得失敗は、ページを読み込み直せば直ることが多い
    // （古い親チャンクが既に無い子チャンク名を指している状態。2026-08-15 実機で発生）。
    // 「再試行」ボタンは同じ古い親を使い続けるので押しても直らない。
    // 1セッション1回だけ自動リロードする（無限ループにしない）。
    tryRecoverFromChunkError(error);
  }

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      const chunkFailed = isChunkLoadError(this.state.error);
      return (
        <View style={styles.container}>
          <Text style={styles.title}>
            {chunkFailed ? "読み込みに失敗しました" : "エラーが発生しました"}
          </Text>
          <Text style={styles.message} numberOfLines={3}>
            {chunkFailed
              ? "通信状況が不安定か、アプリが更新された可能性があります。"
              : this.state.error.message}
          </Text>
          <Pressable
            onPress={() => {
              // チャンク落ちは state を戻しても同じ古い子チャンクを取りに行くだけ。
              // ページごと読み込み直す（自動リロード済みで直らなかった場合の手動導線）。
              if (chunkFailed && typeof window !== "undefined") {
                window.location.reload();
                return;
              }
              this.setState({ hasError: false, error: null });
            }}
            style={styles.button}
          >
            <Text style={styles.buttonText}>
              {chunkFailed ? "再読み込み" : "再試行"}
            </Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: color.surface,
    gap: 12,
  },
  title: {
    color: color.textPrimary,
    fontSize: 18,
    fontWeight: "700",
  },
  message: {
    color: color.textMuted,
    fontSize: 14,
    textAlign: "center",
    maxWidth: 280,
  },
  button: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: color.accentPrimary,
  },
  buttonText: {
    color: color.textWhite,
    fontWeight: "700",
  },
});
