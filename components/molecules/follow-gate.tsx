import { View, Text, Pressable, Platform } from "react-native";
import { openExternalUrl } from "@/lib/navigation";
import { color, palette } from "@/theme/tokens";
import { useState } from "react";
import { Image } from "expo-image";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

// キャラクター画像
const characterImages = {
  linkYukkuri: require("@/assets/images/characters/link/link-yukkuri-smile-mouth-open.png"),
};

const triggerHaptic = () => {
  if (Platform.OS !== "web") {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
};

interface FollowGateProps {
  isFollowing: boolean;
  targetUsername: string;
  targetDisplayName: string;
  onRefreshStatus?: () => void;
  onRelogin?: () => void;
  refreshing?: boolean;
  children: React.ReactNode;
}

/**
 * フォロー確認ゲートコンポーネント
 * 特定のTwitterアカウントをフォローしていない場合、
 * プレミアム機能へのアクセスをブロックし、フォローを促す
 */
export function FollowGate({
  isFollowing,
  targetUsername,
  targetDisplayName,
  onRefreshStatus,
  onRelogin,
  refreshing,
  children,
}: FollowGateProps) {
  const [showModal, setShowModal] = useState(false);

  // フォローしている場合は子コンポーネントをそのまま表示
  if (isFollowing) {
    return <>{children}</>;
  }

  // フォローしていない場合はモーダルを表示
  const handleFollowPress = async () => {
    triggerHaptic();
    const twitterUrl = `https://twitter.com/intent/follow?screen_name=${targetUsername}`;
    await openExternalUrl(twitterUrl);
  };

  const handleRefresh = () => {
    triggerHaptic();
    onRefreshStatus?.();
    setShowModal(false);
  };

  return (
    <>
      <Pressable
        onPress={() => {
          triggerHaptic();
          setShowModal(true);
        }}
        style={({ pressed }) => [
          { flex: 1 },
          pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
        ]}
      >
        <View style={{ flex: 1, opacity: 0.5 }}>
          {children}
        </View>
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: palette.black + "B3",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <MaterialIcons name="lock" size={48} color={color.accentPrimary} />
          <Text
            style={{
              color: color.textWhite,
              fontSize: 18,
              fontWeight: "bold",
              marginTop: 16,
              textAlign: "center",
            }}
          >
            プレミアム機能
          </Text>
          <Text
            style={{
              color: color.textMuted,
              fontSize: 14,
              marginTop: 8,
              textAlign: "center",
            }}
          >
            タップして詳細を確認
          </Text>
        </View>
      </Pressable>

      <Modal
        visible={showModal}
        onClose={() => setShowModal(false)}
        title="プレミアム機能"
        showCloseButton
        maxWidth={400}
      >
        <Image
          source={characterImages.linkYukkuri}
          style={{ width: 80, height: 80, marginBottom: 16, alignSelf: "center" }}
          contentFit="contain"
        />
        <Text
              style={{
                color: color.textWhite,
                fontSize: 16,
                textAlign: "center",
                lineHeight: 24,
              }}
            >
              この機能を使うには{"\n"}
              <Text style={{ color: color.accentPrimary, fontWeight: "bold" }}>
                @{targetUsername}
              </Text>
              {"\n"}をフォローしてください
            </Text>

            <View style={{ width: "100%", marginTop: 24, gap: 12 }}>
              <Button
                onPress={handleFollowPress}
                variant="primary"
                icon="person-add"
                fullWidth
                style={{ backgroundColor: color.twitter }}
              >
                {targetDisplayName}をフォロー
              </Button>

              {/* 再ログインボタン */}
              {onRelogin && (
                <Button
                  onPress={() => {
                    triggerHaptic();
                    onRelogin();
                  }}
                  disabled={refreshing}
                  loading={refreshing}
                  variant="secondary"
                  icon="refresh"
                  fullWidth
                >
                  フォロー状態を再確認
                </Button>
              )}

              <Button
                onPress={handleRefresh}
                variant="ghost"
                fullWidth
              >
                フォロー済みの方はタップして更新
              </Button>
            </View>
      </Modal>
    </>
  );
}

/**
 * フォロー促進バナーコンポーネント
 * フォローしていない場合に表示するバナー
 */
export function FollowPromptBanner({
  isFollowing,
  targetUsername,
  targetDisplayName,
  onFollowPress,
  onRelogin,
  onRefreshFollowStatus,
  refreshing,
}: {
  isFollowing: boolean;
  targetUsername: string;
  targetDisplayName: string;
  onFollowPress?: () => void;
  onRelogin?: () => void;
  onRefreshFollowStatus?: () => Promise<void>;
  refreshing?: boolean;
}) {
  if (isFollowing) {
    return null;
  }

  const handlePress = async () => {
    triggerHaptic();
    if (onFollowPress) {
      onFollowPress();
    } else {
      const twitterUrl = `https://twitter.com/intent/follow?screen_name=${targetUsername}`;
      await openExternalUrl(twitterUrl);
    }
  };

  return (
    <View
      style={{
        backgroundColor: color.surface,
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 16,
        marginVertical: 8,
        borderWidth: 1,
        borderColor: color.accentPrimary,
      }}
    >
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] },
        ]}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: color.accentPrimary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MaterialIcons name="star" size={24} color={color.textWhite} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ color: color.textWhite, fontSize: 14, fontWeight: "bold" }}>
              フォローで特典をゲット！
            </Text>
            <Text style={{ color: color.textMuted, fontSize: 12, marginTop: 2 }}>
              @{targetUsername}をフォローすると特別な特典がもらえるかも？
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={color.accentPrimary} />
        </View>
      </Pressable>
      
      {/* フォロー済みの場合の再確認ボタン（再認証なし） */}
      {onRefreshFollowStatus && (
        <View style={{ marginTop: 12 }}>
          <Button
            onPress={() => {
              triggerHaptic();
              onRefreshFollowStatus();
            }}
            disabled={refreshing}
            loading={refreshing}
            variant="secondary"
            icon="refresh"
            size="sm"
            fullWidth
          >
            フォロー済みの方はタップして再確認
          </Button>
        </View>
      )}
    </View>
  );
}

/**
 * フォロー状態バッジコンポーネント
 */
export function FollowStatusBadge({
  isFollowing,
}: {
  isFollowing: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: isFollowing ? color.success + "20" : color.warning + "20",
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
      }}
    >
      <MaterialIcons
        name={isFollowing ? "check-circle" : "warning"}
        size={14}
        color={isFollowing ? color.success : color.warning}
      />
      <Text
        style={{
          color: isFollowing ? color.success : color.warning,
          fontSize: 12,
          fontWeight: "bold",
          marginLeft: 4,
        }}
      >
        {isFollowing ? "フォロー中" : "未フォロー"}
      </Text>
    </View>
  );
}
