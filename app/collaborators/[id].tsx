import { Text, View, Pressable, ScrollView, Alert } from "react-native";
import { commonCopy } from "@/constants/copy/common";
import { color } from "@/theme/tokens";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { navigateBack } from "@/lib/navigation/app-routes";
import { useState } from "react";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { AppHeader } from "@/components/organisms/app-header";
import { Input } from "@/components/ui/input";

// 権限の日本語名（初心者向けに簡素化）
const ROLE_NAMES: Record<string, string> = {
  owner: "主催者",
  "co-host": "共同主催者",
  moderator: "スタッフ",
};

// 権限の色
const ROLE_COLORS: Record<string, string> = {
  owner: color.rankGold,
  "co-host": color.accentPrimary,
  moderator: color.accentAlt,
};

// ステータスの日本語名
const STATUS_NAMES: Record<string, string> = {
  pending: "招待中",
  accepted: "参加中",
  declined: "辞退",
};

// コラボレーターカード
function CollaboratorCard({
  collaborator,
  isOwner,
  onRemove,
  onChangeRole,
}: {
  collaborator: any;
  isOwner: boolean;
  onRemove?: () => void;
  onChangeRole?: (role: string) => void;
}) {
  const colors = useColors();
  return (
    <View
      style={{
        backgroundColor: color.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: collaborator.role === "owner" ? color.rankGold : color.border,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        {collaborator.userImage ? (
          <Image
            source={{ uri: collaborator.userImage }}
            style={{ width: 48, height: 48, borderRadius: 24 }}
          />
        ) : (
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: ROLE_COLORS[collaborator.role] || color.accentPrimary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: "bold" }}>
              {collaborator.userName?.charAt(0) || "?"}
            </Text>
          </View>
        )}
        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "bold" }}>
              {collaborator.userName}
            </Text>
            <View
              style={{
                backgroundColor: ROLE_COLORS[collaborator.role] || color.textSubtle,
                borderRadius: 4,
                paddingHorizontal: 6,
                paddingVertical: 2,
                marginLeft: 8,
              }}
            >
              <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: "bold" }}>
                {ROLE_NAMES[collaborator.role] || collaborator.role}
              </Text>
            </View>
          </View>
          <Text style={{ color: color.textMuted, fontSize: 12, marginTop: 2 }}>
            {STATUS_NAMES[collaborator.status] || collaborator.status}
          </Text>
        </View>
        {/* 権限 */}
        <View style={{ alignItems: "flex-end" }}>
          {collaborator.canEdit && (
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 2 }}>
              <MaterialIcons name="edit" size={12} color={color.successDark} />
              <Text style={{ color: color.successDark, fontSize: 12, marginLeft: 2 }}>編集可</Text>
            </View>
          )}
          {collaborator.canManageParticipants && (
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 2 }}>
              <MaterialIcons name="people" size={12} color={color.info} />
              <Text style={{ color: color.info, fontSize: 12, marginLeft: 2 }}>参加者管理</Text>
            </View>
          )}
          {collaborator.canInvite && (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <MaterialIcons name="person-add" size={12} color={color.warning} />
              <Text style={{ color: color.warning, fontSize: 12, marginLeft: 2 }}>招待可</Text>
            </View>
          )}
        </View>
      </View>
      
      {/* オーナー以外は削除可能 */}
      {isOwner && collaborator.role !== "owner" && (
        <View style={{ flexDirection: "row", marginTop: 12, gap: 8 }}>
          <Pressable
            onPress={() => onChangeRole?.(collaborator.role === "co-host" ? "moderator" : "co-host")}
            style={{
              flex: 1,
              backgroundColor: color.border,
              borderRadius: 8,
              padding: 8,
              alignItems: "center",
            }}
          >
            <Text style={{ color: colors.foreground, fontSize: 12 }}>
              {collaborator.role === "co-host" ? "モデレーターに変更" : "共同主催者に変更"}
            </Text>
          </Pressable>
          <Pressable
            onPress={onRemove}
            style={{
              backgroundColor: color.danger,
              borderRadius: 8,
              padding: 8,
              paddingHorizontal: 16,
            }}
          >
            <MaterialIcons name="close" size={16} color={colors.foreground} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

// 招待フォーム
function InviteForm({
  onInvite,
  isLoading,
}: {
  onInvite: (twitterId: string, role: string) => void;
  isLoading: boolean;
}) {
  const colors = useColors();
  const [twitterId, setTwitterId] = useState("");
  const [role, setRole] = useState<"co-host" | "moderator">("co-host");

  const handleSubmit = () => {
    if (!twitterId.trim()) {
      Alert.alert(commonCopy.alerts.error, "Twitter IDを入力してください");
      return;
    }
    onInvite(twitterId.replace("@", ""), role);
    setTwitterId("");
  };

  return (
    <View
      style={{
        backgroundColor: color.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: color.border,
      }}
    >
      <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "bold", marginBottom: 12 }}>
        共同主催者を招待
      </Text>
      
      <View style={{ marginBottom: 12 }}>
        <Input
          label="Twitter ID（@なし）"
          value={twitterId}
          onChangeText={setTwitterId}
          placeholder="例: idolfunch"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={{ marginBottom: 16 }}>
        <Text style={{ color: color.textMuted, fontSize: 12, marginBottom: 8 }}>
          権限
        </Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Pressable
            onPress={() => setRole("co-host")}
            style={{
              flex: 1,
              backgroundColor: role === "co-host" ? color.accentPrimary : color.border,
              borderRadius: 8,
              padding: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: role === "co-host" ? "bold" : "normal" }}>
              共同主催者
            </Text>
            <Text style={{ color: role === "co-host" ? color.textWhite + "CC" : color.textSubtle, fontSize: 12, marginTop: 2 }}>
              編集・参加者管理・招待
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setRole("moderator")}
            style={{
              flex: 1,
              backgroundColor: role === "moderator" ? color.accentAlt : color.border,
              borderRadius: 8,
              padding: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: role === "moderator" ? "bold" : "normal" }}>
              モデレーター
            </Text>
            <Text style={{ color: role === "moderator" ? color.textWhite + "CC" : color.textSubtle, fontSize: 12, marginTop: 2 }}>
              参加者管理のみ
            </Text>
          </Pressable>
        </View>
      </View>

      <Pressable
        onPress={handleSubmit}
        disabled={isLoading || !twitterId.trim()}
        style={{
          backgroundColor: isLoading || !twitterId.trim() ? color.textSubtle : color.successDark,
          borderRadius: 8,
          padding: 14,
          alignItems: "center",
          flexDirection: "row",
          justifyContent: "center",
        }}
      >
        <MaterialIcons name="person-add" size={20} color={colors.foreground} />
        <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "bold", marginLeft: 8 }}>
          {isLoading ? "招待中..." : "招待を送信"}
        </Text>
      </Pressable>
    </View>
  );
}

export default function CollaboratorsScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { user } = useAuth();

  // チャレンジ詳細を取得
  const { data: challenge, isLoading: challengeLoading } = trpc.events.getById.useQuery(
    { id: Number(id) },
    { enabled: !!id }
  );

  // コラボレーター一覧を取得（仮のデータ）
  // 実際はAPIから取得する
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [isInviting, setIsInviting] = useState(false);

  // オーナーを追加
  const allCollaborators = challenge ? [
    {
      id: 0,
      userId: challenge.hostUserId,
      userName: challenge.hostName,
      userImage: challenge.hostProfileImage,
      role: "owner",
      status: "accepted",
      canEdit: true,
      canManageParticipants: true,
      canInvite: true,
    },
    ...collaborators,
  ] : collaborators;

  // 主催者かどうかチェック
  const isOwner = user && challenge && (user.id === challenge.hostUserId);

  const handleInvite = async (twitterId: string, role: string) => {
    setIsInviting(true);
    try {
      // 仮の招待処理
      const newCollaborator = {
        id: Date.now(),
        userId: null,
        userName: `@${twitterId}`,
        userImage: null,
        role,
        status: "pending",
        canEdit: role === "co-host",
        canManageParticipants: true,
        canInvite: role === "co-host",
      };
      setCollaborators([...collaborators, newCollaborator]);
      Alert.alert(commonCopy.alerts.inviteSent, `@${twitterId} に招待を送信しました`);
    } catch {
      Alert.alert(commonCopy.alerts.error, "招待の送信に失敗しました");
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemove = (collaboratorId: number) => {
    Alert.alert(
      "確認",
      "このコラボレーターを削除しますか？",
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "削除",
          style: "destructive",
          onPress: () => {
            setCollaborators(collaborators.filter(c => c.id !== collaboratorId));
          },
        },
      ]
    );
  };

  const handleChangeRole = (collaboratorId: number, newRole: string) => {
    setCollaborators(collaborators.map(c => 
      c.id === collaboratorId 
        ? { 
            ...c, 
            role: newRole,
            canEdit: newRole === "co-host",
            canInvite: newRole === "co-host",
          } 
        : c
    ));
  };

  if (challengeLoading) {
    return (
      <ScreenContainer className="p-4">
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: color.textMuted }}>読み込み中...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!challenge) {
    return (
      <ScreenContainer className="p-4">
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: color.textMuted }}>チャレンジが見つかりません</Text>
          <Pressable
            onPress={() => navigateBack()}
            style={{ marginTop: 16, padding: 12 }}
          >
            <Text style={{ color: color.accentPrimary }}>戻る</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  if (!isOwner) {
    return (
      <ScreenContainer className="p-4">
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <MaterialIcons name="lock" size={48} color={color.textSubtle} />
          <Text style={{ color: color.textMuted, fontSize: 16, marginTop: 12 }}>
            この機能は主催者のみ利用できます
          </Text>
          <Pressable
            onPress={() => navigateBack()}
            style={{ marginTop: 16, padding: 12 }}
          >
            <Text style={{ color: color.accentPrimary }}>戻る</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
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
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: "bold" }}>
            共同主催者管理
          </Text>
          <Text style={{ color: color.textMuted, fontSize: 14 }} numberOfLines={1}>
            {challenge.title}
          </Text>
        </View>

        {/* 説明 */}
        <View
          style={{
            backgroundColor: color.surface,
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: color.border,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
            <MaterialIcons name="info" size={20} color={color.info} />
            <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "bold", marginLeft: 8 }}>
              一緒に運営するメンバー
            </Text>
          </View>
          <Text style={{ color: color.textMuted, fontSize: 13, lineHeight: 20 }}>
            信頼できる人を招待して、チャレンジを一緒に管理できます。{"\n"}
            • 共同主催者：全ての操作が可能{"\n"}
            • スタッフ：参加者の管理のみ
          </Text>
        </View>

        {/* 招待フォーム */}
        <InviteForm onInvite={handleInvite} isLoading={isInviting} />

        {/* コラボレーター一覧 */}
        <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: "bold", marginBottom: 12 }}>
          メンバー ({allCollaborators.length}人)
        </Text>
        
        {allCollaborators.map(collaborator => (
          <CollaboratorCard
            key={collaborator.id}
            collaborator={collaborator}
            isOwner={isOwner}
            onRemove={() => handleRemove(collaborator.id)}
            onChangeRole={(role) => handleChangeRole(collaborator.id, role)}
          />
        ))}

        {/* 余白 */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
}
