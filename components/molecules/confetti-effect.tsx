import { View } from "react-native";

interface ConfettiEffectProps {
  isRunning?: boolean;
  duration?: number;
}

/**
 * 紙吹雪エフェクト（プレースホルダー）
 */
export function ConfettiEffect({ isRunning = false }: ConfettiEffectProps) {
  if (!isRunning) return null;
  return <View />;
}
