/**
 * プロフィール編集画面
 * 都道府県・性別を後から変更可能にする
 */
import { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { AppHeader } from "@/components/organisms/app-header";
import { PrefectureSelector } from "@/components/ui/prefecture-selector";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";
import { useResponsive } from "@/hooks/use-responsive";
import { useToast } from "@/components/atoms/toast";
import { navigateBack } from "@/lib/navigation";
import { color } from "@/theme/tokens";
import * as Auth from "@/lib/_core/auth";
import type { Gender } from "@/types/participation";

export default function ProfileEditScreen() {
  const { user } = useAuth();
  const colors = useColors();
  const { isDesktop } = useResponsive();
  const { showSuccess, showError } = useToast();
  
  const [prefecture, setPrefecture] = useState("");
  const [gender, setGender] = useState<Gender>("unspecified");
  const [showPrefectureList, setShowPrefectureList] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 現在のプロフィール情報を取得
  useEffect(() => {
    if (user) {
      setPrefecture(user.prefecture || "");
      setGender((user.gender as Gender) || "unspecified");
      setIsLoading(false);
    }
  }, [user]);

  const updateProfileMutation = trpc.profiles.updateMyProfile.useMutation({
    onSuccess: async (data) => {
      try {
        if (data?.user) {
          const existing = await Auth.getUserInfo();
          if (existing) {
            await Auth.setUserInfo({
              ...existing,
              prefecture: data.user.prefecture ?? existing.prefecture,
              gender: data.user.gender ?? existing.gender,
            });
          }
        }
        showSuccess("プロフィールを更新しました");
        setTimeout(() => {
          navigateBack();
        }, 500);
      } catch (error) {
        console.error("[Profile Edit] Failed to update user info:", error);
        showError("プロフィールの更新に失敗しました");
      }
    },
    onError: (error) => {
      console.error("[Profile Edit] updateMyProfile mutation failed:", error);
      showError(error.message || "プロフィールの更新に失敗しました");
    },
  });

  const handleSave = () => {
    updateProfileMutation.mutate({
      prefecture: prefecture || null,
      gender: gender,
    });
  };

  if (isLoading) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <AppHeader title="プロフィール編集" showMenu={true} isDesktop={isDesktop} />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={color.accentPrimary} />
          <Text style={{ color: color.textMuted, marginTop: 16 }}>読み込み中...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer containerClassName="bg-background">
      <AppHeader title="プロフィール編集" showMenu={true} isDesktop={isDesktop} />
      
      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ padding: 16, maxWidth: isDesktop ? 600 : undefined, alignSelf: isDesktop ? "center" : "stretch" }}
      >
        <Text style={{ fontSize: 24, fontWeight: "bold", color: color.textWhite, marginBottom: 24 }}>
          プロフィール編集
        </Text>
        
        <Text style={{ fontSize: 14, color: color.textMuted, marginBottom: 24 }}>
          都道府県と性別を設定すると、参加表明がスムーズになります。
        </Text>

        {/* 都道府県セレクター */}
        <PrefectureSelector
          value={prefecture}
          onChange={setPrefecture}
          isOpen={showPrefectureList}
          onOpenChange={setShowPrefectureList}
          label="都道府県"
          placeholder="選択してください"
        />

        {/* 性別選択 */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ color: color.textSecondary, fontSize: 14, marginBottom: 8 }}>性別（任意）</Text>
          <View style={{ flexDirection: "row", gap: 12 }}>
            {(["male", "female", "unspecified"] as const).map((g) => (
              <Pressable
                key={g}
                onPress={() => setGender(g)}
                style={{
                  flex: 1,
                  backgroundColor: gender === g ? color.info : colors.background,
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: "center",
                  borderWidth: 2,
                  borderColor: gender === g ? color.info : color.border,
                }}
              >
                <Text
                  style={{
                    color: gender === g ? color.textWhite : color.textSecondary,
                    fontSize: 13,
                    fontWeight: "600",
                  }}
                >
                  {g === "male" ? "男性" : g === "female" ? "女性" : "無回答"}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* 保存ボタン */}
        <Button
          onPress={handleSave}
          disabled={updateProfileMutation.isPending}
          loading={updateProfileMutation.isPending}
          fullWidth
          variant="primary"
          size="lg"
        >
          保存
        </Button>

        {/* エラーメッセージ表示 */}
        {updateProfileMutation.isError && updateProfileMutation.error && (
          <View style={{ marginTop: 16, padding: 12, backgroundColor: color.danger + "20", borderRadius: 8, borderWidth: 1, borderColor: color.danger }}>
            <Text style={{ color: color.danger, fontSize: 14, textAlign: "center" }}>
              {updateProfileMutation.error.message || "プロフィールの更新に失敗しました"}
            </Text>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
