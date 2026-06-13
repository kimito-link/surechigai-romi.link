/**
 * プロフィールカードコンポーネント
 * v6.23: 新UIコンポーネント（Button）を使用
 */
import { View, Text } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import { useColors } from "@/hooks/use-colors";
import { useResponsive } from "@/hooks/use-responsive";
import { FollowStatusBadge } from "@/components/molecules/follow-gate";
import { TwitterUserCard } from "@/components/molecules/twitter-user-card";
import { mypageUI, mypageText, mypageGradient, mypageAccent, mypageFont } from "../ui/theme/tokens";
import { Button } from "@/components/ui/button";

interface ProfileCardProps {
  user: {
    twitterId?: string;
    name?: string | null;
    username?: string | null;
    profileImage?: string | null;
    followersCount?: number | null;
    description?: string | null;
  } | null;
  isFollowing: boolean;
  totalContribution: number;
  participationsCount: number;
  challengesCount: number;
  // v6.08: 招待実績
  invitationStats?: {
    totalInvited: number;
    confirmedCount: number;
  };
  onAccountSwitch: () => void;
  onLogout: () => void;
}

export function ProfileCard({
  user,
  isFollowing,
  totalContribution,
  participationsCount,
  challengesCount,
  invitationStats,
  onAccountSwitch,
  onLogout,
}: ProfileCardProps) {
  const colors = useColors();
  const { isDesktop } = useResponsive();

  return (
    <View
      style={{
        backgroundColor: mypageUI.cardBg,
        marginHorizontal: isDesktop ? "auto" : 16,
        marginVertical: 16,
        borderRadius: 16,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: mypageUI.cardBorder,
        maxWidth: isDesktop ? 800 : undefined,
        width: isDesktop ? "100%" : undefined,
      }}
    >
      <LinearGradient
        colors={[...mypageGradient.profileHeader]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ height: 4 }}
      />
      <View style={{ padding: 16 }}>
        {/* Twitterユーザーカード */}
        <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
          <View style={{ flex: 1 }}>
            <TwitterUserCard
              user={{
                twitterId: user?.twitterId,
                name: user?.name || "ゲスト",
                username: user?.username ?? undefined,
                profileImage: user?.profileImage ?? undefined,
                followersCount: user?.followersCount ?? undefined,
                description: user?.description ?? undefined,
              }}
              size="large"
              showDescription={true}
            />
          </View>
          <FollowStatusBadge isFollowing={isFollowing} />
        </View>

        {/* 統計情報 */}
        <View
          style={{
            flexDirection: "row",
            marginTop: 16,
            paddingTop: 16,
            borderTopWidth: 1,
            borderTopColor: mypageUI.cardBorder,
          }}
        >
          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={{ color: colors.foreground, fontSize: mypageFont.xl, fontWeight: "bold" }}>
              {totalContribution}
            </Text>
            <Text style={{ color: mypageText.muted, fontSize: mypageFont.meta }}>総貢献数</Text>
          </View>
          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={{ color: colors.foreground, fontSize: mypageFont.xl, fontWeight: "bold" }}>
              {participationsCount}
            </Text>
            <Text style={{ color: mypageText.muted, fontSize: mypageFont.meta }}>参加中</Text>
          </View>
          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={{ color: colors.foreground, fontSize: mypageFont.xl, fontWeight: "bold" }}>
              {challengesCount}
            </Text>
            <Text style={{ color: mypageText.muted, fontSize: mypageFont.meta }}>主催</Text>
          </View>
        </View>

        {/* 招待実績 */}
        {invitationStats && invitationStats.totalInvited > 0 && (
          <View
            style={{
              marginTop: 16,
              paddingTop: 16,
              borderTopWidth: 1,
              borderTopColor: mypageUI.cardBorder,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <MaterialIcons name="people" size={16} color={mypageAccent.linkPink} />
              <Text style={{ color: mypageAccent.linkPink, fontSize: mypageFont.body, fontWeight: "bold", marginLeft: 4 }}>
                招待実績
              </Text>
            </View>
            <View style={{ flexDirection: "row" }}>
              <View style={{ flex: 1, alignItems: "center" }}>
<Text style={{ color: colors.foreground, fontSize: mypageFont.lg, fontWeight: "bold" }}>
                {invitationStats.totalInvited}
                </Text>
                <Text style={{ color: mypageText.muted, fontSize: mypageFont.meta }}>招待送信</Text>
              </View>
              <View style={{ flex: 1, alignItems: "center" }}>
<Text style={{ color: colors.foreground, fontSize: mypageFont.lg, fontWeight: "bold" }}>
                {invitationStats.confirmedCount}
                </Text>
                <Text style={{ color: mypageText.muted, fontSize: mypageFont.meta }}>参加表明済み</Text>
              </View>
            </View>
          </View>
        )}

        {/* アカウント切り替えボタン */}
        <Button
          variant="secondary"
          onPress={onAccountSwitch}
          fullWidth
          icon="swap-horiz"
          style={{
            backgroundColor: mypageUI.switchAccountBg,
            marginTop: 16,
          }}
        >
          <Text style={{ color: mypageText.switchAccount, fontSize: mypageFont.body, marginLeft: 8 }}>
            別のアカウントでログイン
          </Text>
        </Button>

        <Button
          variant="ghost"
          onPress={onLogout}
          fullWidth
          icon="logout"
          style={{
            backgroundColor: colors.background,
            marginTop: 8,
          }}
        >
          <Text style={{ color: mypageText.logout, fontSize: mypageFont.body, marginLeft: 8 }}>
            ログアウト
          </Text>
        </Button>
      </View>
    </View>
  );
}
