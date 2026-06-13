/**
 * ユーザープロフィールヘッダーコンポーネント
 * 
 * 用途:
 * - ファンページ（app/profile/[userId].tsx）
 * - マイページ（app/(tabs)/mypage.tsx）
 * - チャレンジ詳細（app/dashboard/[id].tsx）
 * 
 * 特徴:
 * - 男女別の色分け（男性：青系、女性：ピンク系）
 * - TwitterUserCardを内部で使用
 * - 統一されたデザイン
 */

import { Text, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { TwitterUserCard, TwitterUserData } from "@/components/molecules/twitter-user-card";
import { color, palette } from "@/theme/tokens";

export interface UserProfileHeaderProps {
  /** ユーザーデータ */
  user: TwitterUserData & {
    /** 性別（male: 男性、female: 女性、unspecified: 未指定） */
    gender?: "male" | "female" | "unspecified";
  };
  /** フォローボタンを表示するか */
  showFollowButton?: boolean;
  /** フォロー状態 */
  isFollowing?: boolean;
  /** フォローボタンのコールバック */
  onFollowToggle?: () => void;
  /** フォロー処理中かどうか */
  isFollowPending?: boolean;
}

/**
 * ユーザープロフィールヘッダーコンポーネント
 * 
 * v6.172: 男女別色分け対応
 * - 男性: 青系グラデーション（palette.blue600 → palette.blue500 → palette.blue400）
 * - 女性: ピンク系グラデーション（palette.pink600 → palette.pink500 → palette.red400）
 * 
 * v6.175: 性別未指定対応
 * - 未指定: グレー系グラデーション（palette.gray600 → palette.gray500 → palette.gray400）
 */
export function UserProfileHeader({
  user,
  showFollowButton = false,
  isFollowing = false,
  onFollowToggle,
  isFollowPending = false,
}: UserProfileHeaderProps) {
  // 性別に応じたグラデーション色
  const gradientColors: readonly [string, string, ...string[]] = 
    user.gender === "male"
      ? [palette.blue600, palette.blue500, palette.blue400] // 男性: 青系
      : user.gender === "female"
      ? [palette.pink600, palette.pink500, palette.red400] // 女性: ピンク系
      : [palette.gray600, palette.gray500, palette.gray400]; // 未指定: グレー系

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ padding: 20, paddingTop: 16 }}
    >
      {/* TwitterUserCard（グラデーション背景用） */}
      <TwitterUserCard
        user={user}
        size="large"
        showDescription={true}
        showFollowers={true}
        onGradient={true}
      />

      {/* フォローボタン */}
      {showFollowButton && onFollowToggle && (
        <Pressable
          onPress={onFollowToggle}
          disabled={isFollowPending}
          style={{
            marginTop: 16,
            minHeight: 48,
            minWidth: 140,
            paddingHorizontal: 28,
            paddingVertical: 14,
            borderRadius: 24,
            backgroundColor: isFollowing ? palette.white + "33" : color.textWhite,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            opacity: isFollowPending ? 0.6 : 1,
            shadowColor: palette.black,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 3,
            alignSelf: "center",
          }}
        >
          <MaterialIcons 
            name={isFollowing ? "check" : "person-add"} 
            size={20} 
            color={isFollowing ? color.textWhite : gradientColors[1]} 
          />
          <Text style={{ 
            color: isFollowing ? color.textWhite : gradientColors[1], 
            fontSize: 15, 
            fontWeight: "bold",
            marginLeft: 8,
          }}>
            {isFollowing ? "フォロー中" : "フォローする"}
          </Text>
        </Pressable>
      )}
    </LinearGradient>
  );
}
