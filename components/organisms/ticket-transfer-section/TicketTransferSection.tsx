// components/organisms/ticket-transfer-section/TicketTransferSection.tsx
// v6.18: リファクタリング済みチケット譲渡セクション
import { useState } from "react";
import { View, Text, Pressable, Alert } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { commonCopy } from "@/constants/copy/common";
import { color } from "@/theme/tokens";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";

import { TicketTransferSectionProps, TicketTransfer, TicketWaitlist } from "./types";
import { CreateTransferModal, WaitlistModal } from "./modals";
import { TransferList, WaitlistList } from "./lists";

export function TicketTransferSection({ challengeId, challengeTitle }: TicketTransferSectionProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"transfers" | "waitlist">("transfers");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  
  // 譲渡投稿一覧
  const { data: transfers, refetch: refetchTransfers } = (trpc as any).ticketTransfer.listByChallenge.useQuery(
    { challengeId },
    { enabled: challengeId > 0 }
  );
  
  // 待機リスト
  const { data: waitlist, refetch: refetchWaitlist } = (trpc as any).ticketWaitlist.listByChallenge.useQuery(
    { challengeId },
    { enabled: challengeId > 0 }
  );
  
  // 自分が待機リストに登録しているか
  const { data: isInWaitlist, refetch: refetchIsInWaitlist } = (trpc as any).ticketWaitlist.isInWaitlist.useQuery(
    { challengeId },
    { enabled: !!user && challengeId > 0 }
  );
  
  // 譲渡投稿作成
  const createTransferMutation = (trpc as any).ticketTransfer.create.useMutation({
    onSuccess: () => {
      Alert.alert(commonCopy.alerts.postDone, "チケット譲渡の投稿が完了しました");
      setShowCreateModal(false);
      refetchTransfers();
    },
    onError: (error: any) => {
      Alert.alert(commonCopy.alerts.error, error.message || "投稿に失敗しました");
    },
  });
  
  // 待機リスト登録
  const addToWaitlistMutation = (trpc as any).ticketWaitlist.add.useMutation({
    onSuccess: () => {
      Alert.alert(commonCopy.alerts.registerDone, "待機リストに登録しました。新しい譲渡投稿があれば通知します。");
      setShowWaitlistModal(false);
      refetchWaitlist();
      refetchIsInWaitlist();
    },
    onError: (error: any) => {
      Alert.alert(commonCopy.alerts.error, error.message || "登録に失敗しました");
    },
  });
  
  // 待機リスト解除
  const removeFromWaitlistMutation = (trpc as any).ticketWaitlist.remove.useMutation({
    onSuccess: () => {
      Alert.alert(commonCopy.alerts.unregisterDone, "待機リストから解除しました");
      refetchWaitlist();
      refetchIsInWaitlist();
    },
  });
  
  // 譲渡投稿キャンセル
  const cancelTransferMutation = (trpc as any).ticketTransfer.cancel.useMutation({
    onSuccess: () => {
      Alert.alert(commonCopy.alerts.cancelDone, "譲渡投稿をキャンセルしました");
      refetchTransfers();
    },
  });

  return (
    <View style={{ marginTop: 24 }}>
      {/* セクションヘッダー */}
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
        <MaterialIcons name="swap-horiz" size={24} color={color.accentPrimary} />
        <Text style={{ color: color.textWhite, fontSize: 18, fontWeight: "bold", marginLeft: 8 }}>
          チケット譲渡
        </Text>
      </View>
      
      {/* 説明文 */}
      <View style={{
        backgroundColor: color.surface,
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: color.border,
      }}>
        <Text style={{ color: color.textMuted, fontSize: 12, lineHeight: 18 }}>
          急な予定変更でライブに行けなくなった方と、チケットを探している方をつなぐコーナーです。
          連絡はX（Twitter）のDMで行ってください。
        </Text>
      </View>
      
      {/* タブ */}
      <View style={{ flexDirection: "row", marginBottom: 16, gap: 12 }}>
        <Pressable
          onPress={() => setActiveTab("transfers")}
          style={{
            flex: 1,
            backgroundColor: activeTab === "transfers" ? color.accentPrimary : color.surface,
            borderRadius: 12,
            minHeight: 48,
            paddingVertical: 14,
            paddingHorizontal: 16,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: activeTab === "transfers" ? 0 : 1,
            borderColor: color.border,
          }}
        >
          <Text style={{ color: color.textWhite, fontSize: 15, fontWeight: activeTab === "transfers" ? "bold" : "500" }}>
            🎫 譲りたい ({transfers?.length || 0})
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab("waitlist")}
          style={{
            flex: 1,
            backgroundColor: activeTab === "waitlist" ? color.accentAlt : color.surface,
            borderRadius: 12,
            minHeight: 48,
            paddingVertical: 14,
            paddingHorizontal: 16,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: activeTab === "waitlist" ? 0 : 1,
            borderColor: color.border,
          }}
        >
          <Text style={{ color: color.textWhite, fontSize: 15, fontWeight: activeTab === "waitlist" ? "bold" : "500" }}>
            🔔 欲しい ({waitlist?.length || 0})
          </Text>
        </Pressable>
      </View>
      
      {/* アクションボタン */}
      <View style={{ marginBottom: 20 }}>
        {activeTab === "transfers" ? (
          <Pressable
            onPress={() => {
              if (!user) {
                Alert.alert(commonCopy.alerts.loginRequired, "チケット譲渡の投稿にはログインが必要です");
                return;
              }
              setShowCreateModal(true);
            }}
            style={{
              backgroundColor: color.accentPrimary,
              borderRadius: 16,
              minHeight: 52,
              paddingVertical: 16,
              paddingHorizontal: 24,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: color.accentPrimary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <MaterialIcons name="add-circle" size={24} color={color.textWhite} />
            <Text style={{ color: color.textWhite, fontSize: 16, fontWeight: "bold", marginLeft: 10 }}>
              チケットを譲る
            </Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => {
              if (!user) {
                Alert.alert(commonCopy.alerts.loginRequired, "待機リスト登録にはログインが必要です");
                return;
              }
              if (isInWaitlist) {
                Alert.alert(
                  "待機リストから解除",
                  "待機リストから解除しますか？",
                  [
                    { text: "キャンセル", style: "cancel" },
                    { text: "解除する", onPress: () => removeFromWaitlistMutation.mutate({ challengeId }) },
                  ]
                );
              } else {
                setShowWaitlistModal(true);
              }
            }}
            style={{
              backgroundColor: isInWaitlist ? color.textSubtle : color.accentAlt,
              borderRadius: 16,
              minHeight: 52,
              paddingVertical: 16,
              paddingHorizontal: 24,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: isInWaitlist ? color.textSubtle : color.accentAlt,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <MaterialIcons name={isInWaitlist ? "notifications-off" : "notifications-active"} size={24} color={color.textWhite} />
            <Text style={{ color: color.textWhite, fontSize: 16, fontWeight: "bold", marginLeft: 10 }}>
              {isInWaitlist ? "待機リスト解除" : "チケットが欲しい"}
            </Text>
          </Pressable>
        )}
      </View>
      
      {/* 一覧 */}
      {activeTab === "transfers" ? (
        <TransferList
          transfers={(transfers || []) as TicketTransfer[]}
          currentUserId={user?.id}
          onCancel={(id) => cancelTransferMutation.mutate({ id })}
        />
      ) : (
        <WaitlistList waitlist={(waitlist || []) as TicketWaitlist[]} />
      )}
      
      {/* モーダル */}
      <CreateTransferModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={(data) => createTransferMutation.mutate({ challengeId, ...data })}
        isLoading={createTransferMutation.isPending}
        userUsername={user?.username}
      />
      
      <WaitlistModal
        visible={showWaitlistModal}
        onClose={() => setShowWaitlistModal(false)}
        onSubmit={(data) => addToWaitlistMutation.mutate({ challengeId, ...data })}
        isLoading={addToWaitlistMutation.isPending}
        userUsername={user?.username}
      />
    </View>
  );
}
