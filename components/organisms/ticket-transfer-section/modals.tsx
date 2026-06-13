// components/organisms/ticket-transfer-section/modals.tsx
// v6.18: チケット譲渡のモーダルコンポーネント（UI Modal でラップ）
import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Modal } from "@/components/ui/modal";
import { color } from "@/theme/tokens";
import { PriceType, priceTypeLabels, priceTypeColors } from "./types";
import { Input } from "@/components/ui/input";

// 譲渡投稿作成モーダル
export function CreateTransferModal({
  visible,
  onClose,
  onSubmit,
  isLoading,
  userUsername,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: { ticketCount: number; priceType: PriceType; comment?: string; userUsername?: string }) => void;
  isLoading: boolean;
  userUsername?: string;
}) {
  const [ticketCount, setTicketCount] = useState(1);
  const [priceType, setPriceType] = useState<PriceType>("face_value");
  const [comment, setComment] = useState("");

  const handleSubmit = () => {
    onSubmit({
      ticketCount,
      priceType,
      comment: comment.trim() || undefined,
      userUsername,
    });
  };

  return (
    <Modal visible={visible} onClose={onClose} title="チケットを譲る" showCloseButton maxWidth={400}>
      {/* 枚数 */}
          <Text style={{ color: color.textMuted, fontSize: 14, marginBottom: 8 }}>枚数</Text>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable
                key={n}
                onPress={() => setTicketCount(n)}
                style={{
                  flex: 1,
                  backgroundColor: ticketCount === n ? color.accentPrimary : color.bg,
                  borderRadius: 8,
                  padding: 12,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: ticketCount === n ? color.accentPrimary : color.border,
                }}
              >
                <Text style={{ color: color.textWhite, fontWeight: ticketCount === n ? "bold" : "normal" }}>
                  {n}枚
                </Text>
              </Pressable>
            ))}
          </View>
          
          {/* 価格タイプ */}
          <Text style={{ color: color.textMuted, fontSize: 14, marginBottom: 8 }}>価格</Text>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
            {(["face_value", "negotiable", "free"] as PriceType[]).map((type) => (
              <Pressable
                key={type}
                onPress={() => setPriceType(type)}
                style={{
                  flex: 1,
                  backgroundColor: priceType === type ? priceTypeColors[type] : color.bg,
                  borderRadius: 8,
                  padding: 12,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: priceType === type ? priceTypeColors[type] : color.border,
                }}
              >
                <Text style={{ color: color.textWhite, fontWeight: priceType === type ? "bold" : "normal" }}>
                  {priceTypeLabels[type]}
                </Text>
              </Pressable>
            ))}
          </View>
          
          {/* コメント */}
          <Input
            label="コメント（任意）"
            value={comment}
            onChangeText={setComment}
            placeholder="例: 急な仕事で行けなくなりました..."
            multiline
            numberOfLines={3}
            containerStyle={{ marginBottom: 16 }}
            style={{ minHeight: 80, textAlignVertical: "top" }}
          />
          
          {/* 注意事項 */}
          <View style={{
            backgroundColor: color.warning + "1A", // 10% opacity
            borderRadius: 8,
            padding: 12,
            marginBottom: 20,
          }}>
            <Text style={{ color: color.warning, fontSize: 12, lineHeight: 18 }}>
              ⚠️ 連絡はX（Twitter）のDMで行われます。{"\n"}
              金銭のやり取りは当事者間で行ってください。
            </Text>
          </View>
          
          {/* ボタン */}
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Pressable
              onPress={onClose}
              style={{
                flex: 1,
                backgroundColor: color.border,
                borderRadius: 12,
                padding: 16,
                alignItems: "center",
              }}
            >
              <Text style={{ color: color.textWhite, fontSize: 16 }}>キャンセル</Text>
            </Pressable>
            <Pressable
              onPress={handleSubmit}
              disabled={isLoading}
              style={{
                flex: 1,
                backgroundColor: color.accentPrimary,
                borderRadius: 12,
                padding: 16,
                alignItems: "center",
                opacity: isLoading ? 0.5 : 1,
              }}
            >
              <Text style={{ color: color.textWhite, fontSize: 16, fontWeight: "bold" }}>
                {isLoading ? "投稿中..." : "投稿する"}
              </Text>
            </Pressable>
          </View>
    </Modal>
  );
}

// 待機リスト登録モーダル
export function WaitlistModal({
  visible,
  onClose,
  onSubmit,
  isLoading,
  userUsername,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: { desiredCount: number; userUsername?: string }) => void;
  isLoading: boolean;
  userUsername?: string;
}) {
  const [desiredCount, setDesiredCount] = useState(1);

  const handleSubmit = () => {
    onSubmit({
      desiredCount,
      userUsername,
    });
  };

  return (
    <Modal visible={visible} onClose={onClose} title="チケットを探す" showCloseButton maxWidth={400}>
      <Text style={{ color: color.textMuted, fontSize: 14, marginBottom: 16 }}>
            待機リストに登録すると、新しい譲渡投稿があった時に通知を受け取れます。
          </Text>
          
          {/* 希望枚数 */}
          <Text style={{ color: color.textMuted, fontSize: 14, marginBottom: 8 }}>希望枚数</Text>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 20 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable
                key={n}
                onPress={() => setDesiredCount(n)}
                style={{
                  flex: 1,
                  backgroundColor: desiredCount === n ? color.accentAlt : color.bg,
                  borderRadius: 8,
                  padding: 12,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: desiredCount === n ? color.accentAlt : color.border,
                }}
              >
                <Text style={{ color: color.textWhite, fontWeight: desiredCount === n ? "bold" : "normal" }}>
                  {n}枚
                </Text>
              </Pressable>
            ))}
          </View>
          
          {/* ボタン */}
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Pressable
              onPress={onClose}
              style={{
                flex: 1,
                backgroundColor: color.border,
                borderRadius: 12,
                padding: 16,
                alignItems: "center",
              }}
            >
              <Text style={{ color: color.textWhite, fontSize: 16 }}>キャンセル</Text>
            </Pressable>
            <Pressable
              onPress={handleSubmit}
              disabled={isLoading}
              style={{
                flex: 1,
                backgroundColor: color.accentAlt,
                borderRadius: 12,
                padding: 16,
                alignItems: "center",
                opacity: isLoading ? 0.5 : 1,
              }}
            >
              <Text style={{ color: color.textWhite, fontSize: 16, fontWeight: "bold" }}>
                {isLoading ? "登録中..." : "登録する"}
              </Text>
            </Pressable>
          </View>
    </Modal>
  );
}
