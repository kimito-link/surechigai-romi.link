import { View, Text, StyleSheet, Animated } from "react-native";
import { color, palette } from "@/theme/tokens";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useEffect, useRef, useState } from "react";
import { addNetworkListener, initNetworkMonitoring } from "@/lib/offline-cache";

/**
 * オフライン状態を表示するバナー
 */
export function OfflineBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const slideAnim = useRef(new Animated.Value(-50)).current;

  useEffect(() => {
    // ネットワーク監視を初期化
    initNetworkMonitoring();

    // ネットワーク状態変更リスナーを追加
    const unsubscribe = addNetworkListener((isConnected) => {
      if (!isConnected) {
        // オフラインになったらバナーを表示
        setShowBanner(true);
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 10,
        }).start();
      } else {
        // オンラインに戻ったらバナーを非表示
        Animated.timing(slideAnim, {
          toValue: -50,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setShowBanner(false);
        });
      }
    });

    return unsubscribe;
  }, [slideAnim]);

  if (!showBanner) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY: slideAnim }] },
      ]}
    >
      <MaterialIcons name="wifi-off" size={16} color={color.textWhite} />
      <Text style={styles.text}>
        オフラインです。一部の機能が制限されます。
      </Text>
    </Animated.View>
  );
}

/**
 * オフライン時のプレースホルダー
 */
export function OfflinePlaceholder({ message }: { message?: string }) {
  return (
    <View style={styles.placeholder}>
      <MaterialIcons name="cloud-off" size={48} color={color.textSubtle} />
      <Text style={styles.placeholderTitle}>オフラインです</Text>
      <Text style={styles.placeholderText}>
        {message || "インターネット接続を確認してください"}
      </Text>
    </View>
  );
}

/**
 * キャッシュからのデータ表示インジケーター
 */
export function CachedDataIndicator({ isStale }: { isStale: boolean }) {
  if (!isStale) return null;

  return (
    <View style={styles.cachedIndicator}>
      <MaterialIcons name="history" size={12} color={color.warning} />
      <Text style={styles.cachedText}>キャッシュデータを表示中</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: color.danger,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    zIndex: 1000,
  },
  text: {
    color: color.textWhite,
    fontSize: 12,
    fontWeight: "500",
  },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  placeholderTitle: {
    color: color.textWhite,
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
  },
  placeholderText: {
    color: color.textMuted,
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  cachedIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: palette.gold + "1A", // 10% opacity
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  cachedText: {
    color: color.warning,
    fontSize: 12,
  },
});
