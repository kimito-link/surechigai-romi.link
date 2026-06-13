import { Text, View, ScrollView, Pressable, Share, Platform } from "react-native";
import { color, palette } from "@/theme/tokens";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { navigateBack } from "@/lib/navigation/app-routes";
import { useState, useEffect, useCallback } from "react";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
// Clipboardはネイティブ機能を使用
import * as Haptics from "expo-haptics";
import { AppHeader } from "@/components/organisms/app-header";
import { Input } from "@/components/ui/input";
import { RefreshingIndicator } from "@/components/molecules/refreshing-indicator";
import { useColors } from "@/hooks/use-colors";

export default function InviteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { user } = useAuth();
  const colors = useColors();
  const [copied, setCopied] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  
  // v6.09: カスタムメッセージ機能
  const [customMessage, setCustomMessage] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);
  
  // v6.10: OGP画像生成
  const [ogpImageUrl, setOgpImageUrl] = useState<string | null>(null);
  const [isGeneratingOgp, setIsGeneratingOgp] = useState(false);

  const challengeId = parseInt(id || "0", 10);
  const isValidId = !isNaN(challengeId) && challengeId > 0;

  const { data: challenge, isLoading, isFetching } = trpc.events.getById.useQuery(
    { id: challengeId },
    { enabled: isValidId }
  );

  // ローディング状態を分離
  const hasData = !!challenge;
  const isInitialLoading = isLoading && !hasData;
  const isRefreshing = isFetching && hasData;

  // デバッグログ
  console.log("[InviteScreen] id:", id, "challengeId:", challengeId, "isValidId:", isValidId, "challenge:", challenge?.id);

  const createInviteMutation = trpc.invitations.create.useMutation({
    onSuccess: (data: any) => {
      setInviteCode(data.code);
      setIsCreatingInvite(false);
      // OGP画像をリセット
      setOgpImageUrl(null);
    },
    onError: () => {
      setIsCreatingInvite(false);
    },
  });

  // v6.10: OGP画像生成ミューテーション
  const generateOgpMutation = trpc.ogp.generateInviteOgp.useMutation({
    onSuccess: (data) => {
      setOgpImageUrl(data.url || null);
      setIsGeneratingOgp(false);
    },
    onError: () => {
      setIsGeneratingOgp(false);
    },
  });

  // OGP画像を生成
  const handleGenerateOgp = () => {
    if (!inviteCode) return;
    setIsGeneratingOgp(true);
    generateOgpMutation.mutate({ code: inviteCode });
  };

  // 招待リンクを作成
  const handleCreateInvite = useCallback(() => {
    if (!id || !user) return;
    setIsCreatingInvite(true);
    const payload: { challengeId: number; maxUses?: number; expiresAt?: string } = {
      challengeId: parseInt(id),
    };
    createInviteMutation.mutate(payload);
  }, [id, user, createInviteMutation]);

  // 初回は自動で招待リンクを作成（カスタムメッセージなし）
  useEffect(() => {
    if (id && user && !inviteCode && !showCustomForm) {
      handleCreateInvite();
    }
  }, [id, user, handleCreateInvite, inviteCode, showCustomForm]);

  const inviteUrl = inviteCode 
    ? `https://douin-challenge.app/join/${inviteCode}`
    : null;

  // シェアメッセージを生成（カスタムメッセージ対応）
  const getShareMessage = () => {
    if (!challenge) return "";
    
    const title = customTitle || challenge.title;
    const inviterName = user?.name || "友達";
    
    let message = `🎉 ${inviterName}さんから「${title}」への招待が届きました！\n\n`;
    
    if (customMessage) {
      message += `💬 ${customMessage}\n\n`;
    }
    
    message += `目標: ${challenge.goalValue}人\n`;
    message += `招待リンク: ${inviteUrl}\n\n`;
    message += `#動員ちゃれんじ #君斗りんく`;
    
    return message;
  };

  const handleCopyLink = async () => {
    if (inviteUrl) {
      // クリップボードにコピー（Webの場合）
      if (Platform.OS === "web" && navigator.clipboard) {
        await navigator.clipboard.writeText(inviteUrl);
      }
      setCopied(true);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (inviteUrl && challenge) {
      try {
        await Share.share({
          message: getShareMessage(),
          url: inviteUrl,
        });
      } catch (error) {
        console.error("Share error:", error);
      }
    }
  };

  const handleShareTwitter = () => {
    if (inviteUrl && challenge) {
      const text = encodeURIComponent(getShareMessage());
      const url = `https://twitter.com/intent/tweet?text=${text}`;
      if (Platform.OS === "web") {
        window.open(url, "_blank");
      }
    }
  };

  // 新しい招待リンクを作成（カスタムメッセージ付き）
  const handleCreateCustomInvite = () => {
    setInviteCode(null);
    handleCreateInvite();
    setShowCustomForm(false);
  };

  if (isInitialLoading) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: color.textMuted }}>読み込み中...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!isValidId) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: color.textMuted }}>無効なチャレンジIDです</Text>
          <Pressable
            onPress={() => navigateBack()}
            style={{ marginTop: 16, padding: 12 }}
          >
            <Text style={{ color: color.hostAccentLegacy }}>戻る</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  if (!challenge) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: color.textMuted }}>チャレンジが見つかりません (ID: {id})</Text>
          <Pressable
            onPress={() => navigateBack()}
            style={{ marginTop: 16, padding: 12 }}
          >
            <Text style={{ color: color.hostAccentLegacy }}>戻る</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer containerClassName="bg-background">
      {isRefreshing && <RefreshingIndicator isRefreshing={isRefreshing} />}
      <ScrollView>
        {/* ヘッダー */}
        <AppHeader 
          title="君斗りんくの動員ちゃれんじ" 
          showCharacters={false}
          rightElement={
            <Pressable
              onPress={() => navigateBack()}
              style={{ flexDirection: "row", alignItems: "center" }}
            >
              <MaterialIcons name="arrow-back" size={24} color={color.textWhite} />
              <Text style={{ color: color.textWhite, marginLeft: 8 }}>戻る</Text>
            </Pressable>
          }
        />
        <LinearGradient
          colors={[color.hostAccentLegacy, color.accentPrimary, color.accentAlt]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ padding: 20, paddingTop: 16 }}
        >
          <View style={{ alignItems: "center" }}>
            <MaterialIcons name="share" size={48} color={color.textWhite} />
            <Text style={{ color: color.textWhite, fontSize: 24, fontWeight: "bold", marginTop: 12 }}>
              友達を招待
            </Text>
            <Text style={{ color: color.textWhite + "CC", fontSize: 14, marginTop: 4, textAlign: "center" }}>
              一緒にチャレンジを盛り上げよう！
            </Text>
          </View>
        </LinearGradient>

        {/* チャレンジ情報 */}
        <View style={{ padding: 16 }}>
          <View
            style={{
              backgroundColor: color.surfaceDark,
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: color.border,
            }}
          >
            <Text style={{ color: color.textWhite, fontSize: 18, fontWeight: "bold", marginBottom: 8 }}>
              {challenge.title}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <MaterialIcons name="people" size={16} color={color.textMuted} />
              <Text style={{ color: color.textMuted, fontSize: 14, marginLeft: 4 }}>
                目標: {challenge.goalValue}人
              </Text>
            </View>
            {challenge.venue && (
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                <MaterialIcons name="location-on" size={16} color={color.textMuted} />
                <Text style={{ color: color.textMuted, fontSize: 14, marginLeft: 4 }}>
                  {challenge.venue}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* v6.09: カスタムメッセージ設定 */}
        <View style={{ padding: 16 }}>
          <Pressable
            onPress={() => setShowCustomForm(!showCustomForm)}
            style={{
              backgroundColor: color.surfaceDark,
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: showCustomForm ? color.hostAccentLegacy : color.border,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <MaterialIcons name="edit" size={20} color={color.hostAccentLegacy} />
              <Text style={{ color: color.textWhite, fontSize: 16, fontWeight: "600", marginLeft: 8 }}>
                招待メッセージをカスタマイズ
              </Text>
            </View>
            <MaterialIcons 
              name={showCustomForm ? "expand-less" : "expand-more"} 
              size={24} 
              color={color.textMuted} 
            />
          </Pressable>

          {showCustomForm && (
            <View
              style={{
                backgroundColor: color.surfaceDark,
                borderRadius: 12,
                padding: 16,
                marginTop: 12,
                borderWidth: 1,
                borderColor: color.border,
              }}
            >
              {/* カスタムタイトル */}
              <View style={{ marginBottom: 16 }}>
                <Input
                  label="招待タイトル（任意）"
                  value={customTitle}
                  onChangeText={setCustomTitle}
                  placeholder={challenge.title}
                  maxLength={100}
                />
                <Text style={{ color: color.textHint, fontSize: 12, marginTop: 4, textAlign: "right" }}>
                  {customTitle.length}/100
                </Text>
              </View>

              {/* カスタムメッセージ */}
              <View style={{ marginBottom: 16 }}>
                <Input
                  label="あなたからのメッセージ（任意）"
                  value={customMessage}
                  onChangeText={setCustomMessage}
                  placeholder="例: 一緒に推しを応援しよう！絶対楽しいから来てね♪"
                  multiline
                  numberOfLines={4}
                  maxLength={500}
                  style={{ minHeight: 100, textAlignVertical: "top" }}
                />
                <Text style={{ color: color.textHint, fontSize: 12, marginTop: 4, textAlign: "right" }}>
                  {customMessage.length}/500
                </Text>
              </View>

              {/* プレビュー */}
              {(customTitle || customMessage) && (
                <View
                  style={{
                    backgroundColor: colors.background,
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 16,
                    borderWidth: 1,
                    borderColor: color.hostAccentLegacy,
                  }}
                >
                  <Text style={{ color: color.hostAccentLegacy, fontSize: 12, fontWeight: "600", marginBottom: 8 }}>
                    📝 プレビュー
                  </Text>
                  <Text style={{ color: color.textWhite, fontSize: 14, lineHeight: 20 }}>
                    🎉 {user?.name || "あなた"}さんから「{customTitle || challenge.title}」への招待が届きました！
                  </Text>
                  {customMessage && (
                    <Text style={{ color: color.textMuted, fontSize: 14, marginTop: 8, lineHeight: 20 }}>
                      💬 {customMessage}
                    </Text>
                  )}
                </View>
              )}

              {/* 新しい招待リンクを作成 */}
              <Pressable
                onPress={handleCreateCustomInvite}
                disabled={isCreatingInvite}
                style={{
                  backgroundColor: isCreatingInvite ? color.border : color.hostAccentLegacy,
                  borderRadius: 8,
                  padding: 14,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                }}
              >
                <MaterialIcons 
                  name={isCreatingInvite ? "hourglass-empty" : "refresh"} 
                  size={20} 
                  color={color.textWhite} 
                />
                <Text style={{ color: color.textWhite, fontWeight: "600", marginLeft: 8 }}>
                  {isCreatingInvite ? "作成中..." : "この設定で招待リンクを作成"}
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* 招待リンク */}
        <View style={{ padding: 16 }}>
          <Text style={{ color: color.textWhite, fontSize: 16, fontWeight: "bold", marginBottom: 12 }}>
            招待リンク
          </Text>
          
          {inviteUrl ? (
            <>
              <View
                style={{
                  backgroundColor: color.surfaceDark,
                  borderRadius: 8,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: color.border,
                  marginBottom: 12,
                }}
              >
                <Text style={{ color: color.textMuted, fontSize: 12 }} numberOfLines={1}>
                  {inviteUrl}
                </Text>
              </View>

              <Pressable
                onPress={handleCopyLink}
                style={{
                  backgroundColor: copied ? color.success : color.hostAccentLegacy,
                  borderRadius: 8,
                  padding: 14,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  marginBottom: 12,
                }}
              >
                <MaterialIcons 
                  name={copied ? "check" : "content-copy"} 
                  size={20} 
                  color={color.textWhite} 
                />
                <Text style={{ color: color.textWhite, fontWeight: "600", marginLeft: 8 }}>
                  {copied ? "コピーしました！" : "リンクをコピー"}
                </Text>
              </Pressable>

              <Pressable
                onPress={handleShare}
                style={{
                  backgroundColor: color.border,
                  borderRadius: 8,
                  padding: 14,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  marginBottom: 12,
                }}
              >
                <MaterialIcons name="share" size={20} color={color.textWhite} />
                <Text style={{ color: color.textWhite, fontWeight: "600", marginLeft: 8 }}>
                  シェアする
                </Text>
              </Pressable>

              <Pressable
                onPress={handleShareTwitter}
                style={{
                  backgroundColor: color.twitter,
                  borderRadius: 8,
                  padding: 14,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  marginBottom: 12,
                }}
              >
                <Text style={{ fontSize: 20 }}>𝕏</Text>
                <Text style={{ color: color.textWhite, fontWeight: "600", marginLeft: 8 }}>
                  Xでシェア
                </Text>
              </Pressable>

              {/* v6.10: OGP画像生成ボタン */}
              <Pressable
                onPress={handleGenerateOgp}
                disabled={isGeneratingOgp}
                style={{
                  backgroundColor: isGeneratingOgp ? color.border : color.accentPrimary,
                  borderRadius: 8,
                  padding: 14,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                }}
              >
                <MaterialIcons 
                  name={isGeneratingOgp ? "hourglass-empty" : "auto-awesome"} 
                  size={20} 
                  color={color.textWhite} 
                />
                <Text style={{ color: color.textWhite, fontWeight: "600", marginLeft: 8 }}>
                  {isGeneratingOgp ? "OGP画像を生成中..." : "✨ SNS用OGP画像を生成"}
                </Text>
              </Pressable>

              {/* 生成されたOGP画像を表示 */}
              {ogpImageUrl && (
                <View style={{ marginTop: 12 }}>
                  <Text style={{ color: color.textMuted, fontSize: 12, marginBottom: 8 }}>
                    ✨ 生成されたOGP画像（SNSでシェア時に表示されます）
                  </Text>
                  <Image
                    source={{ uri: ogpImageUrl }}
                    style={{
                      width: "100%",
                      height: 200,
                      borderRadius: 8,
                      backgroundColor: color.surfaceDark,
                    }}
                    contentFit="cover"
                  />
                </View>
              )}
            </>
          ) : (
            <View style={{ alignItems: "center", padding: 20 }}>
              <Text style={{ color: color.textMuted }}>招待リンクを生成中...</Text>
            </View>
          )}
        </View>

        {/* QRコード風のプレースホルダー */}
        <View style={{ padding: 16 }}>
          <Text style={{ color: color.textWhite, fontSize: 16, fontWeight: "bold", marginBottom: 12 }}>
            QRコード
          </Text>
          <View
            style={{
              backgroundColor: color.textWhite,
              borderRadius: 12,
              padding: 20,
              alignItems: "center",
              alignSelf: "center",
            }}
          >
            <View
              style={{
                width: 150,
                height: 150,
                backgroundColor: palette.gray200,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 8,
              }}
            >
              <MaterialIcons name="qr-code-2" size={100} color={palette.gray700} />
            </View>
            <Text style={{ color: palette.gray500, fontSize: 12, marginTop: 8 }}>
              スキャンして参加
            </Text>
          </View>
        </View>

        {/* 招待特典 */}
        <View style={{ padding: 16 }}>
          <View
            style={{
              backgroundColor: color.surfaceDark,
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: color.hostAccentLegacy,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <MaterialIcons name="card-giftcard" size={24} color={color.hostAccentLegacy} />
              <Text style={{ color: color.hostAccentLegacy, fontSize: 16, fontWeight: "bold", marginLeft: 8 }}>
                招待特典
              </Text>
            </View>
            <Text style={{ color: color.textMuted, fontSize: 14, lineHeight: 20 }}>
              友達を招待すると、あなたの貢献度が+1されます！{"\n"}
              たくさん招待して、チャレンジを盛り上げよう！
            </Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </ScreenContainer>
  );
}
