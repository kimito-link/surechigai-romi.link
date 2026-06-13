import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { color } from "@/theme/tokens";
import { useColors } from "@/hooks/use-colors";
import { OptimizedAvatar } from "@/components/molecules/optimized-image";
import { Button } from "@/components/ui/button";
import { getChallengeColor } from "@/lib/challenge-colors";

export type EventHeaderProps = {
  challenge: {
    id: number;
    title: string;
    headerImage?: string | null;
    hostName?: string | null;
    hostUsername?: string | null;
    hostProfileImage?: string | null;
    hostUserId?: number | null;
    categoryId?: number | null;
  };
  isHost: boolean;
  isFavorite: boolean;
  isFollowing?: boolean;
  onEditPress?: () => void;
  onFavoritePress?: () => void;
  onHostPress?: () => void;
  onFollowPress?: () => void;
};

export function EventHeader({
  challenge,
  isHost,
  isFavorite,
  isFollowing,
  onEditPress,
  onFavoritePress,
  onHostPress,
  onFollowPress,
}: EventHeaderProps) {
  const colors = useColors();
  const challengeColor = getChallengeColor(challenge.id);

  return (
    <View>
      {/* ヘッダー画像 */}
      <View style={styles.headerImageContainer}>
        {challenge.headerImage ? (
          <Image
            source={{ uri: challenge.headerImage }}
            style={styles.headerImage}
            contentFit="cover"
          />
        ) : (
          <LinearGradient
            colors={challengeColor.gradient}
            style={styles.headerImage}
          />
        )}

        {/* 主催者用の編集アイコン */}
        {isHost && onEditPress && (
          <Button
            variant="ghost"
            size="sm"
            onPress={onEditPress}
            style={styles.editButton}
          >
            <MaterialIcons name="edit" size={20} color={colors.foreground} />
          </Button>
        )}

        {/* お気に入りボタン */}
        {onFavoritePress && (
          <Button
            variant="ghost"
            size="sm"
            onPress={onFavoritePress}
            style={styles.favoriteButton}
          >
            <MaterialIcons
              name={isFavorite ? "favorite" : "favorite-border"}
              size={24}
              color={isFavorite ? color.danger : colors.foreground}
            />
          </Button>
        )}

        {/* ホスト情報 */}
        <Button
          variant="ghost"
          onPress={onHostPress || (() => {})}
          style={styles.hostContainer}
        >
          <OptimizedAvatar
            source={{ uri: challenge.hostProfileImage || undefined }}
            size={40}
            style={styles.hostAvatar}
          />
          <View style={styles.hostInfo}>
            <Text style={[styles.hostName, { color: colors.foreground }]}>
              {challenge.hostName || "主催者"}
            </Text>
            {challenge.hostUsername && (
              <Text style={styles.hostUsername}>
                @{challenge.hostUsername}
              </Text>
            )}
          </View>
        </Button>

        {/* フォローボタン */}
        {!isHost && onFollowPress && (
          <View style={styles.followButtonContainer}>
            <Button
              variant={isFollowing ? "outline" : "primary"}
              size="sm"
              onPress={onFollowPress}
              style={[
                styles.followButton,
                isFollowing && styles.followingButton,
              ]}
            >
              <MaterialIcons
                name={isFollowing ? "check" : "person-add"}
                size={16}
                color={colors.foreground}
              />
              <Text style={[styles.followButtonText, { color: colors.foreground }]}>
                {isFollowing ? "フォロー中" : "フォロー"}
              </Text>
            </Button>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerImageContainer: {
    height: 200,
    position: "relative",
  },
  headerImage: {
    width: "100%",
    height: "100%",
  },
  editButton: {
    position: "absolute",
    top: 12,
    right: 56,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 20,
    padding: 8,
  },
  favoriteButton: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 20,
    padding: 8,
  },
  hostContainer: {
    position: "absolute",
    bottom: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 24,
    paddingRight: 12,
  },
  hostAvatar: {
    borderWidth: 2,
    borderColor: color.accentPrimary,
  },
  hostInfo: {
    marginLeft: 8,
  },
  hostName: {
    fontSize: 14,
    fontWeight: "bold",
  },
  hostUsername: {
    fontSize: 12,
    color: color.textSecondary,
  },
  followButtonContainer: {
    position: "absolute",
    bottom: 12,
    right: 12,
  },
  followButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: color.accentPrimary,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  followingButton: {
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
  },
  followButtonText: {
    fontSize: 12,
    fontWeight: "bold",
  },
});
