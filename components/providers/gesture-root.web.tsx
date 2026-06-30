import { View, type ViewProps } from "react-native";
import type { ReactNode } from "react";

/** Web 初回 bundle から react-native-gesture-handler を外す。 */
export function GestureRoot({
  children,
  style,
}: {
  children: ReactNode;
  style?: ViewProps["style"];
}) {
  return <View style={style}>{children}</View>;
}
