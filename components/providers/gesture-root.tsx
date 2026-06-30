import { GestureHandlerRootView } from "react-native-gesture-handler";
import type { ReactNode } from "react";
import type { ViewProps } from "react-native";

export function GestureRoot({
  children,
  style,
}: {
  children: ReactNode;
  style?: ViewProps["style"];
}) {
  return <GestureHandlerRootView style={style}>{children}</GestureHandlerRootView>;
}
