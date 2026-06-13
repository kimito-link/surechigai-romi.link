/**
 * HostManagementSection Component
 * ホスト（主催者）用の管理ボタン群
 * v6.38: navigateに移行
 */

import { View, Text, Pressable, Alert } from "react-native";
import { navigate } from "@/lib/navigation";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { color } from "@/theme/tokens";
import { useColors } from "@/hooks/use-colors";

interface HostManagementSectionProps {
  challengeId: number;
  isHost: boolean;
  progress: number;
}

export function HostManagementSection({ challengeId, isHost, progress }: HostManagementSectionProps) {
  const colors = useColors();
  
  if (!isHost) {
    return null;
  }
  
  const handleCreateAchievementPage = () => {
    Alert.alert(
      "達成記念ページを作成",
      "目標達成を記念して、参加者全員の名前を掲載した記念ページを作成しますか？",
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "作成する",
          onPress: () => {
            navigate.toAchievement(challengeId);
          },
        },
      ]
    );
  };
  
  return (
    <View style={{ gap: 12, marginTop: 16 }}>
      {/* 統計ダッシュボード */}
      <Pressable
        onPress={() => navigate.toDashboard(challengeId)}
        style={{
          backgroundColor: color.successDark,
          borderRadius: 12,
          padding: 14,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <MaterialIcons name="bar-chart" size={20} color={colors.foreground} />
        <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "bold", marginLeft: 8 }}>
          統計ダッシュボード
        </Text>
      </Pressable>
      
      {/* コメント管理 */}
      <Pressable
        onPress={() => navigate.toManageComments(challengeId)}
        style={{
          backgroundColor: color.accentAlt,
          borderRadius: 12,
          padding: 14,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <MaterialIcons name="star" size={20} color={colors.foreground} />
        <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "bold", marginLeft: 8 }}>
          コメント管理（ピックアップ）
        </Text>
      </Pressable>
      
      {/* 達成記念ページ作成（100%達成時のみ） */}
      {progress >= 100 && (
        <Pressable
          onPress={handleCreateAchievementPage}
          style={{
            backgroundColor: color.accentPrimary,
            borderRadius: 12,
            padding: 14,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MaterialIcons name="celebration" size={20} color={colors.foreground} />
          <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "bold", marginLeft: 8 }}>
            達成記念ページを作成
          </Text>
        </Pressable>
      )}
      
      {/* 共同主催者管理 */}
      <Pressable
        onPress={() => navigate.toCollaborators(challengeId)}
        style={{
          backgroundColor: color.info,
          borderRadius: 12,
          padding: 14,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <MaterialIcons name="group-add" size={20} color={colors.foreground} />
        <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "bold", marginLeft: 8 }}>
          共同主催者管理
        </Text>
      </Pressable>
    </View>
  );
}
