import { Text, View, Pressable, ScrollView, Alert } from "react-native";
import { commonCopy } from "@/constants/copy/common";
import { color, palette } from "@/theme/tokens";
import { useLocalSearchParams } from "expo-router";
import { navigateBack } from "@/lib/navigation/app-routes";
import { useState } from "react";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { AppHeader } from "@/components/organisms/app-header";
import { Input } from "@/components/ui/input";

export default function ManageCommentsScreen() {
  const colors = useColors();

  const { id } = useLocalSearchParams<{ id: string }>();
  const challengeId = parseInt(id || "0", 10);
  const { user, isAuthenticated } = useAuth();
  
  const [selectedTab, setSelectedTab] = useState<"all" | "picked">("all");
  const [pickReason, setPickReason] = useState("");
  const [pickingId, setPickingId] = useState<number | null>(null);

  // チャレンジ情報を取得
  const { data: challenge } = trpc.events.getById.useQuery(
    { id: challengeId },
    { enabled: challengeId > 0 }
  );

  // 参加者一覧を取得
  const { data: participations, refetch: refetchParticipations } = trpc.participations.listByEvent.useQuery(
    { eventId: challengeId },
    { enabled: challengeId > 0 }
  );

  // ピックアップコメント一覧を取得
  const { data: pickedComments, refetch: refetchPicked } = trpc.pickedComments.list.useQuery(
    { challengeId },
    { enabled: challengeId > 0 }
  );

  const pickMutation = trpc.pickedComments.pick.useMutation({
    onSuccess: () => {
      refetchParticipations();
      refetchPicked();
      setPickingId(null);
      setPickReason("");
    },
  });

  const unpickMutation = trpc.pickedComments.unpick.useMutation({
    onSuccess: () => {
      refetchParticipations();
      refetchPicked();
    },
  });

  const markAsUsedMutation = trpc.pickedComments.markAsUsed.useMutation({
    onSuccess: () => {
      refetchPicked();
    },
  });

  // 権限チェック
  const isHost = challenge?.hostUserId === user?.id;
  const isAdmin = (user as any)?.role === "admin";
  const canManage = isHost || isAdmin;

  if (!isAuthenticated || !canManage) {
    return (
      <ScreenContainer edges={["top", "left", "right"]} containerClassName="bg-background">
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <MaterialIcons name="lock" size={64} color={color.textSubtle} />
          <Text style={{ color: color.textMuted, fontSize: 16, marginTop: 16, textAlign: "center" }}>
            この機能はチャレンジの主催者または管理者のみ利用できます
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  const pickedIds = new Set(pickedComments?.map((p: any) => p.participationId) || []);
  
  // コメントがあるものだけフィルタ
  const commentsWithMessage = participations?.filter(p => p.message && p.message.trim().length > 0) || [];

  const handlePick = (participationId: number) => {
    if (pickingId === participationId) {
      // ピックアップ実行
      pickMutation.mutate({
        participationId,
        challengeId,
        reason: pickReason || undefined,
      });
    } else {
      // ピックアップ理由入力モードに
      setPickingId(participationId);
      setPickReason("");
    }
  };

  const handleUnpick = (participationId: number) => {
    Alert.alert(
      "ピックアップ解除",
      "このコメントのピックアップを解除しますか？",
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "解除",
          style: "destructive",
          onPress: () => unpickMutation.mutate({ participationId, challengeId }),
        },
      ]
    );
  };

  const handleMarkAsUsed = (pickedId: number) => {
    markAsUsedMutation.mutate({ id: pickedId, challengeId });
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]} containerClassName="bg-background">
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
        {/* ヘッダー */}
        <AppHeader 
          title="君斗りんくの動員ちゃれんじ" 
          showCharacters={false}
          rightElement={
            <Pressable
              onPress={() => navigateBack()}
              style={{ flexDirection: "row", alignItems: "center" }}
            >
              <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
              <Text style={{ color: colors.foreground, marginLeft: 8 }}>戻る</Text>
            </Pressable>
          }
        />
        <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: "bold" }}>
              コメント管理
            </Text>
            <Text style={{ color: color.textMuted, fontSize: 12 }} numberOfLines={1}>
              {challenge?.title}
            </Text>
          </View>

          {/* タブ */}
          <View style={{ flexDirection: "row", marginBottom: 16, gap: 8 }}>
            <Pressable
              onPress={() => setSelectedTab("all")}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 8,
                backgroundColor: selectedTab === "all" ? color.accentPrimary : color.surface,
                alignItems: "center",
              }}
            >
              <Text style={{ color: colors.foreground, fontWeight: "bold" }}>
                すべて ({commentsWithMessage.length})
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setSelectedTab("picked")}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 8,
                backgroundColor: selectedTab === "picked" ? color.accentPrimary : color.surface,
                alignItems: "center",
              }}
            >
              <Text style={{ color: colors.foreground, fontWeight: "bold" }}>
                ピックアップ ({pickedComments?.length || 0})
              </Text>
            </Pressable>
          </View>
        </View>

        {/* コメント一覧 */}
        <View style={{ paddingHorizontal: 16 }}>
          {selectedTab === "all" ? (
            commentsWithMessage.length > 0 ? (
              commentsWithMessage.map((participation: any) => {
                const isPicked = pickedIds.has(participation.id);
                const isPickingThis = pickingId === participation.id;
                
                return (
                  <View
                    key={participation.id}
                    style={{
                      backgroundColor: isPicked ? palette.gray800 : color.surface,
                      borderRadius: 12,
                      padding: 16,
                      marginBottom: 12,
                      borderWidth: isPicked ? 2 : 1,
                      borderColor: isPicked ? color.accentPrimary : color.border,
                    }}
                  >
                    {/* ユーザー情報 */}
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                      {participation.profileImage ? (
                        <Image
                          source={{ uri: participation.profileImage }}
                          style={{ width: 40, height: 40, borderRadius: 20 }}
                        />
                      ) : (
                        <View
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: color.accentPrimary,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Text style={{ color: colors.foreground, fontWeight: "bold" }}>
                            {participation.displayName?.charAt(0) || "?"}
                          </Text>
                        </View>
                      )}
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={{ color: colors.foreground, fontWeight: "bold" }}>
                          {participation.isAnonymous ? "匿名" : participation.displayName}
                        </Text>
                        {participation.prefecture && (
                          <Text style={{ color: color.textMuted, fontSize: 12 }}>
                            {participation.prefecture}
                          </Text>
                        )}
                      </View>
                      {isPicked && (
                        <View
                          style={{
                            backgroundColor: color.accentPrimary,
                            borderRadius: 4,
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                          }}
                        >
                          <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: "bold" }}>
                            ピックアップ済
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* コメント */}
                    <Text style={{ color: color.textPrimary, fontSize: 14, lineHeight: 20, marginBottom: 12 }}>
                      {participation.message}
                    </Text>

                    {/* ピックアップ理由入力 */}
                    {isPickingThis && (
                      <View style={{ marginBottom: 12 }}>
                        <Input
                          label="ピックアップ理由（任意）"
                          value={pickReason}
                          onChangeText={setPickReason}
                          placeholder="ピックアップ理由（任意）"
                          multiline
                        />
                      </View>
                    )}

                    {/* アクションボタン */}
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      {isPicked ? (
                        <Pressable
                          onPress={() => handleUnpick(participation.id)}
                          style={{
                            flex: 1,
                            backgroundColor: color.borderAlt,
                            borderRadius: 8,
                            paddingVertical: 10,
                            alignItems: "center",
                          }}
                        >
                          <Text style={{ color: colors.foreground, fontWeight: "bold" }}>
                            ピックアップ解除
                          </Text>
                        </Pressable>
                      ) : (
                        <>
                          {isPickingThis && (
                            <Pressable
                              onPress={() => setPickingId(null)}
                              style={{
                                flex: 1,
                                backgroundColor: color.borderAlt,
                                borderRadius: 8,
                                paddingVertical: 10,
                                alignItems: "center",
                              }}
                            >
                              <Text style={{ color: colors.foreground }}>キャンセル</Text>
                            </Pressable>
                          )}
                          <Pressable
                            onPress={() => handlePick(participation.id)}
                            disabled={pickMutation.isPending}
                            style={{
                              flex: 1,
                              backgroundColor: color.accentPrimary,
                              borderRadius: 8,
                              paddingVertical: 10,
                              alignItems: "center",
                            }}
                          >
                            <Text style={{ color: colors.foreground, fontWeight: "bold" }}>
                              {isPickingThis ? "確定" : "ピックアップ"}
                            </Text>
                          </Pressable>
                        </>
                      )}
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={{ alignItems: "center", paddingVertical: 40 }}>
                <MaterialIcons name="chat-bubble-outline" size={64} color={color.textSubtle} />
                <Text style={{ color: color.textMuted, fontSize: 16, marginTop: 16 }}>
                  {commonCopy.empty.noComments}
                </Text>
              </View>
            )
          ) : (
            // ピックアップ済みタブ
            pickedComments && pickedComments.length > 0 ? (
              pickedComments.map((picked) => (
                <View
                  key={picked.id}
                  style={{
                    backgroundColor: palette.gray800,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                    borderWidth: 2,
                    borderColor: picked.isUsedInVideo ? color.successLight : color.accentPrimary,
                  }}
                >
                  {/* ユーザー情報 */}
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                    {picked.participation?.profileImage ? (
                      <Image
                        source={{ uri: picked.participation.profileImage }}
                        style={{ width: 40, height: 40, borderRadius: 20 }}
                      />
                    ) : (
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          backgroundColor: color.accentPrimary,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text style={{ color: colors.foreground, fontWeight: "bold" }}>
                          {picked.participation?.displayName?.charAt(0) || "?"}
                        </Text>
                      </View>
                    )}
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={{ color: colors.foreground, fontWeight: "bold" }}>
                        {picked.participation?.isAnonymous ? "匿名" : picked.participation?.displayName}
                      </Text>
                      {picked.reason && (
                        <Text style={{ color: color.accentPrimary, fontSize: 12 }}>
                          理由: {picked.reason}
                        </Text>
                      )}
                    </View>
                    {picked.isUsedInVideo && (
                      <View
                        style={{
                          backgroundColor: color.successLight,
                          borderRadius: 4,
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                        }}
                      >
                        <Text style={{ color: palette.gray900, fontSize: 12, fontWeight: "bold" }}>
                          動画使用済
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* コメント */}
                  <Text style={{ color: color.textPrimary, fontSize: 14, lineHeight: 20, marginBottom: 12 }}>
                    {picked.participation?.message}
                  </Text>

                  {/* アクションボタン */}
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <Pressable
                      onPress={() => handleUnpick(picked.participationId)}
                      style={{
                        flex: 1,
                        backgroundColor: color.borderAlt,
                        borderRadius: 8,
                        paddingVertical: 10,
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ color: colors.foreground }}>解除</Text>
                    </Pressable>
                    {!picked.isUsedInVideo && (
                      <Pressable
                        onPress={() => handleMarkAsUsed(picked.id)}
                        style={{
                          flex: 1,
                          backgroundColor: color.successLight,
                          borderRadius: 8,
                          paddingVertical: 10,
                          alignItems: "center",
                        }}
                      >
                        <Text style={{ color: palette.gray900, fontWeight: "bold" }}>
                          動画使用済みにする
                        </Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              ))
            ) : (
              <View style={{ alignItems: "center", paddingVertical: 40 }}>
                <MaterialIcons name="star-outline" size={64} color={color.textSubtle} />
                <Text style={{ color: color.textMuted, fontSize: 16, marginTop: 16 }}>
                  {commonCopy.empty.noPickedComments}
                </Text>
              </View>
            )
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </ScreenContainer>
  );
}
