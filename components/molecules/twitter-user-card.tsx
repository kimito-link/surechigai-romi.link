/**
 * Twitterユーザーカード関連コンポーネント（一元管理）
 *
 * 使用箇所:
 * - EventHeaderSection: 主催者表示（TwitterUserCard）
 * - create UserInfoSection: 作成フォームのユーザー表示（TwitterUserCard）
 * - user-profile-header: プロフィールヘッダ（TwitterUserCard）
 * - mypage ProfileCard: マイページプロフィール（TwitterUserCard）
 * - event-detail UserInfoSection: 参加表明フォームの参加者（TwitterUserCard）
 * - ConfirmationModal: 参加者・同伴者（TwitterUserCard / TwitterUserCompact）
 * - SettingsSections: 現在のアカウント（TwitterUserCard）
 * - TwitterSearchForm: 検索結果プロフィール（TwitterUserCompact）
 * - admin/components: コンポーネントカタログ
 *
 * 他レイアウト（匿名対応・性別・都道府県等）: MessageCard, ParticipantsList, ContributionRanking は
 * 専用UIのためそのまま。toTwitterUserData で API 型を渡す場合は共通利用可能。
 */
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { cn } from "@/lib/utils";
import { color } from "@/theme/tokens";
import { palette } from "@/theme/tokens/palette";

/** 性別に応じたアバター枠の色（男=青・女=赤・未設定=透明） */
function getGenderBorderColor(gender?: "male" | "female" | "unspecified"): string {
  return gender === "male"
    ? palette.genderMale
    : gender === "female"
      ? palette.genderFemale
      : "transparent";
}

export interface TwitterUserData {
  /** Twitter ID (例: "1867512383713030149") */
  twitterId?: string;
  /** 表示名 (例: "君斗りんく＠アイドル応援") */
  name: string;
  /** ユーザー名 (例: "idolfunch") */
  username?: string;
  /** プロフィール画像URL */
  profileImage?: string;
  /** フォロワー数 */
  followersCount?: number;
  /** プロフィール文（description） */
  description?: string;
  /** 性別（アバター枠の色: 男=青・女=赤） */
  gender?: "male" | "female" | "unspecified";
}

export interface TwitterUserCardProps {
  /** ユーザーデータ */
  user: TwitterUserData;
  /** カードのサイズ */
  size?: "small" | "medium" | "large";
  /** descriptionを表示するか */
  showDescription?: boolean;
  /** フォロワー数を表示するか */
  showFollowers?: boolean;
  /** タップ時のコールバック */
  onPress?: () => void;
  /** 追加のスタイル */
  className?: string;
  /** グラデーション背景上で使用するか（テキスト色を白色に変更） */
  onGradient?: boolean;
}

/**
 * Twitterユーザー情報を表示する再利用可能なカードコンポーネント
 * 
 * v6.57: 視認性改善
 * - @usernameとフォロワー数にバッジスタイル（背景色+ボーダー）を追加
 * - Twitterアイコンを追加
 * - テーマトークンから色を取得するように統一
 */
export function TwitterUserCard({
  user,
  size = "medium",
  showDescription = false,
  showFollowers = true,
  onPress,
  className,
  onGradient = false,
}: TwitterUserCardProps) {
  // サイズに応じた設定
  const sizeConfig = {
    small: {
      avatarSize: 36,
      nameSize: 14,
      usernameSize: 11,
      followersSize: 10,
      descriptionSize: 12,
      gap: 8,
      badgePaddingH: 6,
      badgePaddingV: 2,
      iconSize: 12,
    },
    medium: {
      avatarSize: 48,
      nameSize: 16,
      usernameSize: 12,
      followersSize: 11,
      descriptionSize: 13,
      gap: 12,
      badgePaddingH: 8,
      badgePaddingV: 3,
      iconSize: 13,
    },
    large: {
      avatarSize: 64,
      nameSize: 18,
      usernameSize: 13,
      followersSize: 12,
      descriptionSize: 14,
      gap: 16,
      badgePaddingH: 10,
      badgePaddingV: 4,
      iconSize: 14,
    },
  };

  const config = sizeConfig[size];

  const content = (
    <View className={cn("flex-row items-center", className)} style={{ gap: config.gap }}>
      {/* プロフィール画像（性別ボーダー: 男=青・女=赤） */}
      <Image
        source={{ uri: user.profileImage || "https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png" }}
        style={[
          styles.avatar,
          {
            width: config.avatarSize,
            height: config.avatarSize,
            borderRadius: config.avatarSize / 2,
            borderWidth: 2,
            borderColor: getGenderBorderColor(user.gender),
          },
        ]}
        contentFit="cover"
        transition={200}
        placeholder={{ uri: "https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png" }}
        placeholderContentFit="cover"
        cachePolicy="memory-disk"
      />

      {/* ユーザー情報 */}
      <View className="flex-1" style={{ gap: 4 }}>
        {/* 名前 */}
        <Text
          className="font-bold"
          style={{ 
            fontSize: config.nameSize, 
            lineHeight: config.nameSize * 1.3,
            color: onGradient ? color.textWhite : color.textPrimary,
          }}
          numberOfLines={1}
        >
          {user.name || "名前未設定"}
        </Text>

        {/* @username + フォロワー数（バッジスタイル） */}
        <View className="flex-row items-center flex-wrap" style={{ gap: 6 }}>
          {user.username && (
            <View style={[
              styles.badge,
              {
                backgroundColor: `${color.twitter}20`,
                borderColor: `${color.twitter}60`,
                paddingHorizontal: config.badgePaddingH,
                paddingVertical: config.badgePaddingV,
              }
            ]}>
              <Ionicons 
                name="logo-twitter" 
                size={config.iconSize} 
                color={color.twitter} 
                style={{ marginRight: 4 }}
              />
              <Text
                style={{ 
                  fontSize: config.usernameSize, 
                  color: color.twitter, 
                  fontWeight: '600',
                }}
              >
                @{user.username}
              </Text>
            </View>
          )}
          {showFollowers && user.followersCount !== undefined && (
            <View style={[
              styles.badge,
              {
                backgroundColor: `${color.accentAlt}20`,
                borderColor: `${color.accentAlt}60`,
                paddingHorizontal: config.badgePaddingH,
                paddingVertical: config.badgePaddingV,
              }
            ]}>
              <Ionicons 
                name="people" 
                size={config.iconSize} 
                color={color.accentAlt} 
                style={{ marginRight: 4 }}
              />
              <Text
                style={{ 
                  fontSize: config.followersSize, 
                  color: color.accentAlt,
                  fontWeight: '600',
                }}
              >
                {user.followersCount.toLocaleString()} フォロワー
              </Text>
            </View>
          )}
        </View>

        {/* description */}
        {showDescription && user.description && (
          <Text
            style={{ 
              fontSize: config.descriptionSize, 
              lineHeight: config.descriptionSize * 1.5, 
              color: onGradient ? color.textWhite : color.textMuted, 
              marginTop: 4,
            }}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {user.description}
          </Text>
        )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] },
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

/**
 * コンパクトなTwitterユーザー表示（アバター + 名前のみ）
 */
export function TwitterUserCompact({
  user,
  size = "small",
  onPress,
}: {
  user: TwitterUserData;
  size?: "small" | "medium";
  onPress?: () => void;
}) {
  const avatarSize = size === "small" ? 24 : 32;
  const fontSize = size === "small" ? 12 : 14;

  const content = (
    <View className="flex-row items-center" style={{ gap: 6 }}>
      <Image
        source={{ uri: user.profileImage || "https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png" }}
        style={{
          width: avatarSize,
          height: avatarSize,
          borderRadius: avatarSize / 2,
          backgroundColor: color.surfaceDark,
          borderWidth: 2,
          borderColor: getGenderBorderColor(user.gender),
        }}
        contentFit="cover"
        transition={200}
        placeholder={{ uri: "https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png" }}
        placeholderContentFit="cover"
        cachePolicy="memory-disk"
      />
      <Text
        style={{ fontSize, color: color.textPrimary, fontWeight: '500' }}
        numberOfLines={1}
      >
        {user.name || user.username || "名前未設定"}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] }]}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

/**
 * Twitterアバターのみ表示
 */
export function TwitterAvatar({
  user,
  size = 40,
  onPress,
}: {
  user: TwitterUserData;
  size?: number;
  onPress?: () => void;
}) {
  const image = (
    <Image
      source={{ uri: user.profileImage || "https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png" }}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color.surfaceDark,
        borderWidth: 2,
        borderColor: getGenderBorderColor(user.gender),
      }}
      contentFit="cover"
      transition={200}
      placeholder={{ uri: "https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png" }}
      placeholderContentFit="cover"
      cachePolicy="memory-disk"
    />
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] }]}
      >
        {image}
      </Pressable>
    );
  }

  return image;
}

/**
 * API・フォームのユーザー型を TwitterUserData に変換するヘルパー
 * 参加者・同伴者・設定アカウントなどで共通利用
 */
export function toTwitterUserData(o: {
  name?: string | null;
  username?: string | null;
  displayName?: string | null;
  profileImage?: string | null;
  followersCount?: number | null;
  description?: string | null;
  twitterUsername?: string | null;
  gender?: "male" | "female" | "unspecified" | null;
}): TwitterUserData {
  return {
    name: (o.name ?? o.displayName ?? "名前未設定") as string,
    username: (o.username ?? o.twitterUsername ?? undefined) as string | undefined,
    profileImage: o.profileImage ?? undefined,
    followersCount: o.followersCount ?? undefined,
    description: o.description ?? undefined,
    gender: o.gender ?? undefined,
  };
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: color.surfaceDark,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
  },
});
