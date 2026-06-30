import React, { Component, type ReactNode, type ErrorInfo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { color } from "@/theme/tokens";

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
  }

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>エラーが発生しました</Text>
          <Text style={styles.message} numberOfLines={3}>
            {this.state.error.message}
          </Text>
          <Pressable
            onPress={() => this.setState({ hasError: false, error: null })}
            style={styles.button}
          >
            <Text style={styles.buttonText}>再試行</Text>
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
