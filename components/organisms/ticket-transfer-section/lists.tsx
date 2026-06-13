// components/organisms/ticket-transfer-section/lists.tsx
// v6.18: チケット譲渡のリスト表示コンポーネント
import { View, Text, Pressable, Alert } from "react-native";
import { commonCopy } from "@/constants/copy/common";
import { openTwitterDM } from "@/lib/navigation";
import { Image } from "expo-image";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { color, palette } from "@/theme/tokens";
import { TicketTransfer, TicketWaitlist, PriceType, priceTypeLabels, priceTypeColors } from "./types";

const handleOpenDM = (username: string | null) => {
  if (!username) {
    Alert.alert(commonCopy.alerts.error, "このユーザーにはDMを送れません");
    return;
  }
  openTwitterDM(username);
};

// 譲渡一覧
export function TransferList({
  transfers,
  currentUserId,
  onCancel,
}: {
  transfers: TicketTransfer[];
  currentUserId?: number;
  onCancel: (id: number) => void;
}) {
  if (transfers.length === 0) {
    return (
      <View style={{ alignItems: "center", paddingVertical: 32 }}>
        <MaterialIcons name="confirmation-number" size={48} color={color.textSubtle} />
        <Text style={{ color: color.textMuted, fontSize: 14, marginTop: 12, textAlign: "center" }}>
          現在、チケット譲渡の投稿はありません
        </Text>
      </View>
    );
  }

  return (
    <View style={{ gap: 12 }}>
      {transfers.map((transfer) => (
        <View
          key={transfer.id}
          style={{
            backgroundColor: color.surface,
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: color.border,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            {transfer.userImage ? (
              <Image
                source={{ uri: transfer.userImage }}
                style={{ width: 40, height: 40, borderRadius: 20 }}
              />
            ) : (
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: color.accentPrimary,
                alignItems: "center",
                justifyContent: "center",
              }}>
                <Text style={{ color: color.textWhite, fontSize: 16, fontWeight: "bold" }}>
                  {(transfer.userName || "?")[0]}
                </Text>
              </View>
            )}
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ color: color.textWhite, fontSize: 14, fontWeight: "600" }}>
                {transfer.userName || "匿名"}
              </Text>
              {transfer.userUsername && (
                <Text style={{ color: color.textMuted, fontSize: 12 }}>
                  @{transfer.userUsername}
                </Text>
              )}
            </View>
            <View style={{
              backgroundColor: priceTypeColors[transfer.priceType as PriceType] || color.textSubtle,
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 12,
            }}>
              <Text style={{ color: color.textWhite, fontSize: 12, fontWeight: "bold" }}>
                {priceTypeLabels[transfer.priceType as PriceType] || transfer.priceType}
              </Text>
            </View>
          </View>
          
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
            <MaterialIcons name="confirmation-number" size={16} color={color.accentPrimary} />
            <Text style={{ color: color.textWhite, fontSize: 16, fontWeight: "bold", marginLeft: 8 }}>
              {transfer.ticketCount}枚
            </Text>
          </View>
          
          {transfer.comment && (
            <Text style={{ color: color.textMuted, fontSize: 13, marginBottom: 12 }}>
              {transfer.comment}
            </Text>
          )}
          
          <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
            {transfer.userUsername && (
              <Pressable
                onPress={() => handleOpenDM(transfer.userUsername)}
                style={{
                  flex: 1,
                  backgroundColor: palette.black,
                  borderRadius: 12,
                  minHeight: 44,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: palette.gray700,
                }}
              >
                <Text style={{ color: color.textWhite, fontSize: 16, fontWeight: "bold" }}>𝕏</Text>
                <Text style={{ color: color.textWhite, fontSize: 14, fontWeight: "600", marginLeft: 8 }}>DMで連絡</Text>
              </Pressable>
            )}
            {currentUserId && transfer.userId === currentUserId && (
              <Pressable
                onPress={() => {
                  Alert.alert(
                    "投稿をキャンセル",
                    "この譲渡投稿をキャンセルしますか？",
                    [
                      { text: "いいえ", style: "cancel" },
                      { text: "キャンセルする", onPress: () => onCancel(transfer.id) },
                    ]
                  );
                }}
                style={{
                  backgroundColor: color.danger,
                  borderRadius: 12,
                  minHeight: 44,
                  paddingVertical: 12,
                  paddingHorizontal: 20,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: color.textWhite, fontSize: 14, fontWeight: "600" }}>取消</Text>
              </Pressable>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}

// 待機リスト一覧
export function WaitlistList({
  waitlist,
}: {
  waitlist: TicketWaitlist[];
}) {
  if (waitlist.length === 0) {
    return (
      <View style={{ alignItems: "center", paddingVertical: 32 }}>
        <MaterialIcons name="people" size={48} color={color.textSubtle} />
        <Text style={{ color: color.textMuted, fontSize: 14, marginTop: 12, textAlign: "center" }}>
          現在、チケットを探している人はいません
        </Text>
      </View>
    );
  }

  return (
    <View style={{ gap: 12 }}>
      {waitlist.map((item) => (
        <View
          key={item.id}
          style={{
            backgroundColor: color.surface,
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: color.border,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          {item.userImage ? (
            <Image
              source={{ uri: item.userImage }}
              style={{ width: 40, height: 40, borderRadius: 20 }}
            />
          ) : (
            <View style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: color.accentAlt,
              alignItems: "center",
              justifyContent: "center",
            }}>
              <Text style={{ color: color.textWhite, fontSize: 16, fontWeight: "bold" }}>
                {(item.userName || "?")[0]}
              </Text>
            </View>
          )}
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ color: color.textWhite, fontSize: 14, fontWeight: "600" }}>
              {item.userName || "匿名"}
            </Text>
            <Text style={{ color: color.textMuted, fontSize: 12 }}>
              {item.desiredCount}枚希望
            </Text>
          </View>
          {item.userUsername && (
            <Pressable
              onPress={() => handleOpenDM(item.userUsername)}
              style={{
                backgroundColor: palette.black,
                borderRadius: 10,
                minHeight: 44,
                minWidth: 80,
                paddingVertical: 10,
                paddingHorizontal: 16,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: palette.gray700,
              }}
            >
              <Text style={{ color: color.textWhite, fontSize: 14, fontWeight: "bold" }}>𝕏</Text>
              <Text style={{ color: color.textWhite, fontSize: 13, fontWeight: "600", marginLeft: 6 }}>DM</Text>
            </Pressable>
          )}
        </View>
      ))}
    </View>
  );
}
