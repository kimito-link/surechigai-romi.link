/**
 * EventHeaderSection Component
 * イベント詳細のヘッダー部分（グラデーション背景、ホスト情報、タイトル）
 */

import { View, Text, Pressable } from "react-native";
import { navigate } from "@/lib/navigation";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import { color } from "@/theme/tokens";
import { useColors } from "@/hooks/use-colors";
import { TwitterUserCard } from "@/components/molecules/twitter-user-card";
import type { EventDetailData } from "../types";

interface EventHeaderSectionProps {
  challenge: EventDetailData;
  challengeId: number;
  isOwner: boolean;
  isChallengeFavorite: boolean;
  toggleFavorite: (id: number) => void;
  isFollowing: boolean | undefined;
  hostUserId: number | undefined;
  userId: number | undefined;
  onFollowToggle: () => void;
  onShowHostProfile: () => void;
}

export function EventHeaderSection({
  challenge,
  challengeId,
  isOwner,
  isChallengeFavorite,
  toggleFavorite,
  isFollowing,
  hostUserId,
  userId,
  onFollowToggle,
  onShowHostProfile,
}: EventHeaderSectionProps) {
  const colors = useColors();
  
  
  return (
    <LinearGradient
      colors={[color.accentPrimary, color.accentAlt]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ marginHorizontal: 16, borderRadius: 16, padding: 20, position: "relative" }}
    >
      {/* 主催者用の編集アイコン */}
      {isOwner && (
        <Pressable
          onPress={() => navigate.toEditChallenge(challengeId)}
          style={{
            position: "absolute",
            top: 12,
            right: 60,
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: "rgba(255,255,255,0.2)",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
          }}
        >
          <MaterialIcons name="edit" size={20} color={color.textWhite} />
        </Pressable>
      )}
      
      {/* お気に入りボタン */}
      <Pressable
        onPress={() => toggleFavorite(challengeId)}
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: "rgba(255,255,255,0.2)",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10,
        }}
      >
        <MaterialIcons
          name={isChallengeFavorite ? "star" : "star-outline"}
          size={24}
          color={isChallengeFavorite ? color.rankGold : color.textWhite}
        />
      </Pressable>
      
      {/* ホスト情報 */}
      <TwitterUserCard
        user={{
          twitterId: challenge.hostTwitterId || undefined,
          name: challenge.hostName,
          username: challenge.hostUsername || undefined,
          profileImage: challenge.hostProfileImage || undefined,
          followersCount: challenge.hostFollowersCount || undefined,
          description: challenge.hostDescription || undefined,
        }}
        size="large"
        showFollowers
        showDescription
        onPress={onShowHostProfile}
        className="mb-4"
        onGradient
      />
      
      {/* フォローボタン */}
      <View style={{ flexDirection: "row", justifyContent: "flex-end", marginBottom: 16, marginTop: -8 }}>
        {userId && hostUserId && hostUserId !== userId && (
          <Pressable
            onPress={onFollowToggle}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: isFollowing ? "rgba(255,255,255,0.2)" : color.textWhite,
            }}
          >
            <Text style={{ 
              color: isFollowing ? color.textWhite : color.accentPrimary, 
              fontSize: 13, 
              fontWeight: "bold" 
            }}>
              {isFollowing ? "フォロー中" : "フォロー"}
            </Text>
          </Pressable>
        )}
      </View>

      <Text style={{ color: color.textWhite, fontSize: 22, fontWeight: "bold" }}>
        {challenge.title}
      </Text>
    </LinearGradient>
  );
}
