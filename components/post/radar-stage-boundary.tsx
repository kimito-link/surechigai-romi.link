import { Component, type ReactNode, type ErrorInfo } from "react";
import { View } from "react-native";
import { color } from "@/theme/tokens";

type Props = {
  style?: object;
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

/**
 * レーダーステージ（地図 + 封筒/居場所マーカー）専用の ErrorBoundary。
 * docs/auth-home-oom-diagnosis-v2.md Phase 0-2: 地図起因のクラッシュでも
 * ステータスライン・封筒レール・シグナル一覧という「使える画面」を守るため、
 * 障害範囲をこのステージ配下に閉じ込める。
 */
export class RadarStageBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("[RadarStageBoundary]", error, errorInfo.componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return <View style={[{ backgroundColor: color.bg }, this.props.style]} />;
    }
    return this.props.children;
  }
}
