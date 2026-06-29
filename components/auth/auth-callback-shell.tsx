/**
 * OAuth コールバック処理中の UX（kimitolink AuthCallbackShell 準拠）。
 */
import { LinearGradient } from "expo-linear-gradient";
import { ReactNode, useEffect, useRef } from "react";
import { Animated, Easing, Platform, ScrollView, Text, View } from "react-native";
import { palette } from "@/theme/tokens";

type AuthCallbackShellProps = {
  children: ReactNode;
};

function SpinnerRing() {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: Platform.OS !== "web",
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  return (
    <Animated.View
      accessibilityLabel="ログイン処理中"
      style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 4,
        borderColor: "rgba(0,66,123,0.15)",
        borderTopColor: palette.kimitoBlue,
        transform: [{ rotate }],
      }}
    />
  );
}

export function AuthCallbackShell({ children }: AuthCallbackShellProps) {
  return (
    <LinearGradient
      colors={["rgba(226,237,247,0.8)", "#FFFFFF", "#FFFFFF"]}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          paddingHorizontal: 16,
          paddingVertical: 48,
        }}
      >
        <View
          accessibilityLiveRegion="polite"
          style={{
            width: "100%",
            maxWidth: 448,
            alignSelf: "center",
            borderRadius: 32,
            borderWidth: 1,
            borderColor: "rgba(0,66,123,0.15)",
            backgroundColor: "rgba(255,255,255,0.98)",
            paddingHorizontal: 24,
            paddingVertical: 32,
            alignItems: "center",
            shadowColor: palette.kimitoBlue,
            shadowOpacity: 0.1,
            shadowRadius: 20,
            shadowOffset: { width: 0, height: 8 },
          }}
        >
          <SpinnerRing />
          <Text
            style={{
              marginTop: 20,
              fontSize: 14,
              fontWeight: "800",
              color: palette.kimitoOrange,
            }}
          >
            Xとの接続を確認しています
          </Text>
          <Text
            style={{
              marginTop: 8,
              fontSize: 24,
              fontWeight: "800",
              color: palette.kimitoBlue,
              textAlign: "center",
            }}
          >
            ログイン処理中です
          </Text>
          <Text
            style={{
              marginTop: 12,
              fontSize: 14,
              lineHeight: 22,
              color: palette.gray700,
              textAlign: "center",
            }}
          >
            通常は数秒でアプリへ移動します。この画面を閉じたり、戻るボタンを押したりせず、そのままお待ちください。
          </Text>
          <Text
            style={{
              marginTop: 8,
              fontSize: 12,
              lineHeight: 18,
              color: palette.gray500,
              textAlign: "center",
            }}
          >
            Xや通信の混雑状況により、10秒ほどかかる場合があります。
          </Text>
          <View style={{ marginTop: 20, minHeight: 24, width: "100%" }}>{children}</View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}
