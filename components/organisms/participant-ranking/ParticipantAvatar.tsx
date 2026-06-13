/**
 * ParticipantAvatar - 参加者アバター
 * 
 * 単一責任: アバター画像の表示のみ
 */

import { View, StyleSheet } from "react-native";
import { Image } from "expo-image";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { color } from "@/theme/tokens";
import { RANK_COLORS } from "./constants";

interface ParticipantAvatarProps {
  profileImage: string | null;
  isAnonymous: boolean;
  rank: number;
  size?: "small" | "medium" | "large";
}

const SIZE_CONFIG = {
  small: { size: 32, iconSize: 16 },
  medium: { size: 40, iconSize: 20 },
  large: { size: 48, iconSize: 24 },
} as const;

export function ParticipantAvatar({ 
  profileImage, 
  isAnonymous, 
  rank,
  size = "medium" 
}: ParticipantAvatarProps) {
  const isTopThree = rank <= 3;
  const sizeConfig = SIZE_CONFIG[size];

  return (
    <View style={[styles.avatarContainer, isTopThree && styles.avatarContainerTop]}>
      {profileImage && !isAnonymous ? (
        <Image
          source={{ uri: profileImage }}
          style={[styles.avatar, { width: sizeConfig.size, height: sizeConfig.size, borderRadius: sizeConfig.size / 2 }]}
          contentFit="cover"
        />
      ) : (
        <View style={[
          styles.avatar, 
          styles.avatarPlaceholder,
          { width: sizeConfig.size, height: sizeConfig.size, borderRadius: sizeConfig.size / 2 }
        ]}>
          <MaterialIcons
            name={isAnonymous ? "person-off" : "person"}
            size={sizeConfig.iconSize}
            color={color.textSubtle}
          />
        </View>
      )}

      {isTopThree && (
        <View 
          style={[
            styles.avatarRing, 
            { borderColor: RANK_COLORS[rank as 1 | 2 | 3].bg }
          ]} 
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatarContainer: {
    position: "relative",
  },
  avatarContainerTop: {
    marginRight: 4,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    backgroundColor: color.border,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarRing: {
    position: "absolute",
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 22,
    borderWidth: 2,
  },
});
