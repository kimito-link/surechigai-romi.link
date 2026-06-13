/**
 * 招待リンク受け取りページ
 * v6.09: カスタムメッセージ表示対応
 * v6.10: OGP画像自動生成対応
 */
import { Text, View, ScrollView, Pressable, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { color } from "@/theme/tokens";
import { useLocalSearchParams } from "expo-router";
import { navigate } from "@/lib/navigation/app-routes";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { AppHeader } from "@/components/organisms/app-header";
import { useColors } from "@/hooks/use-colors";
import { OptimizedAvatar } from "@/components/molecules/optimized-image";
import Head from "expo-router/head";

export default function JoinScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();

  const { isAuthenticated } = useAuth();
  const colors = useColors();

  // 招待情報を取得
  const { data: invitation, isLoading: isLoadingInvitation } = trpc.invitations.getByCode.useQuery(
    { code: code || "" },
    { enabled: !!code }
  );

  // チャレンジ情報を取得
  const { data: challenge, isLoading: isLoadingChallenge } = (trpc as any).challenges.get.useQuery(
    { id: invitation?.challengeId || 0 },
    { enabled: !!invitation?.challengeId }
  );

  // v6.10: OGPメタ情報を取得
  const { data: ogpMeta } = (trpc.ogp as any).getInviteOgpMeta.useQuery(
    { code: code || "" },
    { enabled: !!code }
  );

  const isLoading = isLoadingInvitation || isLoadingChallenge;

  // 参加ボタンを押したときの処理
  const handleJoin = () => {
    if (challenge) {
      // チャレンジ詳細画面に遷移（招待コード付き）
      navigate.toEventDetailWithInvite(challenge.id, code || "");
    }
  };

  // ログインが必要な場合
  const handleLogin = () => {
    // ログイン画面に遷移（戻り先を保存）
    navigate.toMypageWithReturn(`/join/${code}`);
  };

  if (isLoading) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: color.textMuted }}>読み込み中...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!invitation) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 20 }}>
          <MaterialIcons name="error-outline" size={64} color={color.danger} />
          <Text style={{ color: color.textWhite, fontSize: 20, fontWeight: "bold", marginTop: 16 }}>
            招待リンクが無効です
          </Text>
          <Text style={{ color: color.textMuted, fontSize: 14, marginTop: 8, textAlign: "center" }}>
            このリンクは期限切れか、すでに使用されている可能性があります。
          </Text>
          <Pressable
            onPress={() => navigate.toHome()}
            style={{
              marginTop: 24,
              backgroundColor: color.hostAccentLegacy,
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: color.textWhite, fontWeight: "600" }}>ホームに戻る</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  if (!invitation.isActive) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 20 }}>
          <MaterialIcons name="link-off" size={64} color={color.warning} />
          <Text style={{ color: color.textWhite, fontSize: 20, fontWeight: "bold", marginTop: 16 }}>
            この招待は終了しました
          </Text>
          <Text style={{ color: color.textMuted, fontSize: 14, marginTop: 8, textAlign: "center" }}>
            招待者に新しいリンクを発行してもらってください。
          </Text>
          <Pressable
            onPress={() => navigate.toHome()}
            style={{
              marginTop: 24,
              backgroundColor: color.hostAccentLegacy,
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: color.textWhite, fontWeight: "600" }}>ホームに戻る</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  // OGPタイトルと説明を計算
  const ogpTitle = ogpMeta?.title || `招待 - 動員ちゃれんじ`;
  const ogpDescription = ogpMeta?.description || `一緒にチャレンジに参加しよう！`;

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* v6.10: OGPメタタグ */}
      {Platform.OS === "web" && (
        <Head>
          <title>{ogpTitle}</title>
          <meta name="description" content={ogpDescription} />
          <meta property="og:title" content={ogpTitle} />
          <meta property="og:description" content={ogpDescription} />
          <meta property="og:type" content="website" />
          <meta property="og:site_name" content="動員ちゃれんじ" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={ogpTitle} />
          <meta name="twitter:description" content={ogpDescription} />
        </Head>
      )}
      <ScrollView>
        {/* ヘッダー */}
        <AppHeader 
          title="君斗りんくの動員ちゃれんじ" 
          showCharacters={false}
        />
        
        {/* 招待ヘッダー */}
        <LinearGradient
          colors={[color.hostAccentLegacy, color.accentPrimary, color.accentAlt]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ padding: 20, paddingTop: 16 }}
        >
          <View style={{ alignItems: "center" }}>
            <MaterialIcons name="celebration" size={48} color={color.textWhite} />
            <Text style={{ color: color.textWhite, fontSize: 24, fontWeight: "bold", marginTop: 12 }}>
              招待が届きました！
            </Text>
          </View>
        </LinearGradient>

        {/* 招待者情報 */}
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
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
              <OptimizedAvatar
                source={undefined}
                size={48}
                fallbackColor={color.hostAccentLegacy}
                fallbackText={invitation.inviterName?.charAt(0) || "?"}
              />
              <View style={{ marginLeft: 12 }}>
                <Text style={{ color: color.textWhite, fontSize: 16, fontWeight: "600" }}>
                  {invitation.inviterName || "友達"}さんからの招待
                </Text>
                <Text style={{ color: color.textMuted, fontSize: 12, marginTop: 2 }}>
                  一緒にチャレンジに参加しよう！
                </Text>
              </View>
            </View>

            {/* v6.09: カスタムメッセージ表示 */}
            {invitation.customMessage && (
              <View
                style={{
                  backgroundColor: colors.background,
                  borderRadius: 8,
                  padding: 12,
                  marginTop: 8,
                  borderLeftWidth: 3,
                  borderLeftColor: color.hostAccentLegacy,
                }}
              >
                <Text style={{ color: color.textMuted, fontSize: 12, marginBottom: 4 }}>
                  💬 {invitation.inviterName || "友達"}さんからのメッセージ
                </Text>
                <Text style={{ color: color.textWhite, fontSize: 14, lineHeight: 20 }}>
                  {invitation.customMessage}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* チャレンジ情報 */}
        {challenge && (
          <View style={{ padding: 16 }}>
            <Text style={{ color: color.textWhite, fontSize: 16, fontWeight: "bold", marginBottom: 12 }}>
              チャレンジ詳細
            </Text>
            <View
              style={{
                backgroundColor: color.surfaceDark,
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: color.border,
              }}
            >
              {/* v6.09: カスタムタイトルがあれば表示 */}
              <Text style={{ color: color.textWhite, fontSize: 20, fontWeight: "bold", marginBottom: 12 }}>
                {invitation.customTitle || challenge.title}
              </Text>
              
              {/* 元のタイトルと異なる場合は元タイトルも表示 */}
              {invitation.customTitle && invitation.customTitle !== challenge.title && (
                <Text style={{ color: color.textMuted, fontSize: 12, marginBottom: 12 }}>
                  正式名称: {challenge.title}
                </Text>
              )}

              {challenge.description && (
                <Text style={{ color: color.textMuted, fontSize: 14, marginBottom: 12, lineHeight: 20 }}>
                  {challenge.description}
                </Text>
              )}

              <View style={{ gap: 8 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <MaterialIcons name="people" size={18} color={color.hostAccentLegacy} />
                  <Text style={{ color: color.textWhite, fontSize: 14, marginLeft: 8 }}>
                    目標: {challenge.targetCount}人
                  </Text>
                </View>
                
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <MaterialIcons name="trending-up" size={18} color={color.success} />
                  <Text style={{ color: color.textWhite, fontSize: 14, marginLeft: 8 }}>
                    現在: {challenge.currentCount || 0}人 ({Math.round(((challenge.currentCount || 0) / challenge.targetCount) * 100)}%)
                  </Text>
                </View>

                {challenge.venue && (
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <MaterialIcons name="location-on" size={18} color={color.textMuted} />
                    <Text style={{ color: color.textMuted, fontSize: 14, marginLeft: 8 }}>
                      {challenge.venue}
                    </Text>
                  </View>
                )}

                {challenge.eventDate && (
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <MaterialIcons name="event" size={18} color={color.textMuted} />
                    <Text style={{ color: color.textMuted, fontSize: 14, marginLeft: 8 }}>
                      {new Date(challenge.eventDate).toLocaleDateString("ja-JP", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </Text>
                  </View>
                )}
              </View>

              {/* 進捗バー */}
              <View style={{ marginTop: 16 }}>
                <View
                  style={{
                    backgroundColor: color.border,
                    borderRadius: 4,
                    height: 8,
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      backgroundColor: color.hostAccentLegacy,
                      height: "100%",
                      width: `${Math.min(100, Math.round(((challenge.currentCount || 0) / challenge.targetCount) * 100))}%`,
                      borderRadius: 4,
                    }}
                  />
                </View>
              </View>
            </View>
          </View>
        )}

        {/* 参加ボタン */}
        <View style={{ padding: 16 }}>
          {isAuthenticated ? (
            <Pressable
              onPress={handleJoin}
              style={{
                backgroundColor: color.hostAccentLegacy,
                borderRadius: 12,
                padding: 16,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
              }}
            >
              <MaterialIcons name="celebration" size={24} color={color.textWhite} />
              <Text style={{ color: color.textWhite, fontSize: 18, fontWeight: "bold", marginLeft: 8 }}>
                チャレンジに参加する
              </Text>
            </Pressable>
          ) : (
            <View>
              <Pressable
                onPress={handleLogin}
                style={{
                  backgroundColor: color.twitter,
                  borderRadius: 12,
                  padding: 16,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 20 }}>𝕏</Text>
                <Text style={{ color: color.textWhite, fontSize: 18, fontWeight: "bold", marginLeft: 8 }}>
                  Xでログインして参加
                </Text>
              </Pressable>
              <Text style={{ color: color.textMuted, fontSize: 12, textAlign: "center", marginTop: 8 }}>
                参加するにはXアカウントでのログインが必要です
              </Text>
            </View>
          )}
        </View>

        {/* 招待特典 */}
        <View style={{ padding: 16 }}>
          <View
            style={{
              backgroundColor: color.surfaceDark,
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: color.success,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <MaterialIcons name="card-giftcard" size={24} color={color.success} />
              <Text style={{ color: color.success, fontSize: 16, fontWeight: "bold", marginLeft: 8 }}>
                招待経由の参加特典
              </Text>
            </View>
            <Text style={{ color: color.textMuted, fontSize: 14, lineHeight: 20 }}>
              招待リンクから参加すると、招待してくれた{invitation.inviterName || "友達"}さんの貢献度も+1されます！{"\n"}
              一緒にチャレンジを盛り上げましょう！
            </Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </ScreenContainer>
  );
}
