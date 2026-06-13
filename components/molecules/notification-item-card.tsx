/**
 * 通知1件カード
 * 表示ルール（タイプ→アイコン・色）を1箇所に集約
 */

import { View, Text, Pressable } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { color } from "@/theme/tokens";

export type NotificationListItem = {
  id: number;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  sentAt: string;
  challengeId: number;
};

function getNotificationIcon(type: string): keyof typeof MaterialIcons.glyphMap {
  switch (type) {
    case "goal_reached":
      return "emoji-events";
    case "milestone_25":
    case "milestone_50":
    case "milestone_75":
      return "flag";
    case "new_participant":
      return "person-add";
    default:
      return "notifications";
  }
}

function getNotificationColor(type: string): string {
  switch (type) {
    case "goal_reached":
      return color.rankGold;
    case "milestone_25":
      return color.successLight;
    case "milestone_50":
      return color.blue400;
    case "milestone_75":
      return color.purple400;
    case "new_participant":
      return color.accentPrimary;
    default:
      return color.textMuted;
  }
}

interface NotificationItemCardProps {
  notification: NotificationListItem;
  onPress: () => void;
  /** 前景色（useColors().foreground 等） */
  foregroundColor?: string;
  /** 枠線・未読ハイライト用（color.border / color.accentPrimary） */
  borderColorRead?: string;
  borderColorUnread?: string;
}

export function NotificationItemCard({
  notification,
  onPress,
  foregroundColor = color.textWhite,
  borderColorRead = color.border,
  borderColorUnread = color.accentPrimary,
}: NotificationItemCardProps) {
  const iconName = getNotificationIcon(notification.type);
  const iconColor = getNotificationColor(notification.type);
  const isRead = notification.isRead;

  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: isRead ? color.surface : color.bg,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: isRead ? borderColorRead : borderColorUnread,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: iconColor + "20",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MaterialIcons name={iconName} size={24} color={iconColor} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ color: foregroundColor, fontSize: 14, fontWeight: "bold" }}>
            {notification.title}
          </Text>
          <Text style={{ color: color.textMuted, fontSize: 13, marginTop: 4, lineHeight: 18 }}>
            {notification.body}
          </Text>
          <Text style={{ color: color.textSubtle, fontSize: 12, marginTop: 8 }}>
            {new Date(notification.sentAt).toLocaleString("ja-JP")}
          </Text>
        </View>
        {!isRead && (
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: color.accentPrimary,
            }}
          />
        )}
      </View>
    </Pressable>
  );
}
