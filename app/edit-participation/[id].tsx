import { View, Text, ScrollView, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { color, palette } from "@/theme/tokens";
import { useLocalSearchParams } from "expo-router";
import { navigateBack } from "@/lib/navigation";
import { useState, useEffect } from "react";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { ResponsiveContainer } from "@/components/molecules/responsive-container";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import { AppHeader } from "@/components/organisms/app-header";
import { NumberStepper } from "@/components/molecules/number-stepper";
import { showAlert } from "@/lib/web-alert";

// 都道府県リスト
const prefectures = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
  "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
  "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
  "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"
];

export default function EditParticipationScreen() {

  const { id, challengeId } = useLocalSearchParams<{ id: string; challengeId: string }>();
  const { user } = useAuth();
  const colors = useColors();
  const utils = trpc.useUtils();
  
  const [message, setMessage] = useState("");
  const [companionCount, setCompanionCount] = useState(0);
  const [prefecture, setPrefecture] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "unspecified">("unspecified");
  const [showPrefectureList, setShowPrefectureList] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 参加表明データを取得
  const { data: participationsData, isLoading: isParticipationsLoading } = trpc.participations.listByEvent.useQuery(
    { eventId: parseInt(challengeId || "0") },
    { enabled: !!challengeId }
  );

  // 自分の参加表明を取得
  useEffect(() => {
    if (participationsData && user) {
      const userTwitterId = user.openId?.startsWith("twitter:") 
        ? user.openId.replace("twitter:", "") 
        : user.openId;
      const myParticipation = participationsData.find(
        (p: any) => p.id === parseInt(id || "0") || p.userId?.toString() === userTwitterId
      );
      if (myParticipation) {
        setMessage(myParticipation.message || "");
        setCompanionCount(myParticipation.companionCount || 0);
        setPrefecture(myParticipation.prefecture || "");
        setGender(myParticipation.gender || "unspecified");
        setIsLoading(false);
      }
    }
  }, [participationsData, user, id]);

  const updateParticipationMutation = trpc.participations.update.useMutation({
    onSuccess: () => {
      // invalidateで即反映
      utils.participations.listByEvent.invalidate({ eventId: parseInt(challengeId || "0") });
      utils.participations.myParticipations.invalidate();
      showAlert("成功", "参加表明を更新しました！", [
        {
          text: "OK",
          onPress: () => {
            navigateBack();
          },
        },
      ]);
    },
    onError: (error) => {
      // requestIdを含めてエラー表示
      const errorObj = error as { message?: string; data?: { requestId?: string } };
      const message = errorObj?.message || "更新に失敗しました";
      const requestId = errorObj?.data?.requestId;
      if (requestId && __DEV__) {
        showAlert("エラー", `${message}\n\n[requestId: ${requestId}]`);
      } else {
        showAlert("エラー", message);
      }
    },
  });

  const handleUpdate = () => {
    if (!prefecture) {
      showAlert("エラー", "都道府県を選択してください");
      return;
    }
    if (gender === "unspecified") {
      showAlert("エラー", "性別を選択してください");
      return;
    }

    updateParticipationMutation.mutate({
      id: parseInt(id || "0"),
      message: message.trim() || undefined,
      companionCount,
      prefecture,
      gender,
    });
  };

  if (isParticipationsLoading || isLoading) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.muted, marginTop: 16 }}>読み込み中...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer containerClassName="bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView 
          style={{ flex: 1, backgroundColor: colors.background }}
          showsHorizontalScrollIndicator={false}
          horizontal={false}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          {/* ヘッダー */}
          <AppHeader 
            title="参加表明を編集" 
            showCharacters={false}
            showLogo={false}
          />
          
          <ResponsiveContainer>
            <View style={{ padding: 20, gap: 24 }}>
              {/* 応援メッセージ */}
              <View style={{ gap: 8 }}>
                <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "600" }}>
                  応援メッセージ
                </Text>
                <TextInput
                  value={message}
                  onChangeText={setMessage}
                  placeholder="応援メッセージを入力（任意）"
                  placeholderTextColor={colors.muted}
                  multiline
                  numberOfLines={4}
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 12,
                    padding: 16,
                    color: colors.foreground,
                    fontSize: 16,
                    borderWidth: 1,
                    borderColor: colors.border,
                    minHeight: 100,
                    textAlignVertical: "top",
                  }}
                />
              </View>

              {/* 同伴者数 */}
              <View style={{ gap: 8 }}>
                <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "600" }}>
                  一緒に参加する人数
                </Text>
                <NumberStepper
                  value={companionCount}
                  onChange={setCompanionCount}
                  min={0}
                  max={10}
                  step={1}
                  unit="人"
                />
                <Text style={{ color: colors.muted, fontSize: 12 }}>
                  自分を除いた人数を入力してください
                </Text>
              </View>

              {/* 都道府県 */}
              <View style={{ gap: 8 }}>
                <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "600" }}>
                  参加する都道府県 <Text style={{ color: colors.error }}>*</Text>
                </Text>
                <Pressable
                  onPress={() => setShowPrefectureList(!showPrefectureList)}
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 12,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: colors.border,
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: prefecture ? colors.foreground : colors.muted, fontSize: 16 }}>
                    {prefecture || "都道府県を選択"}
                  </Text>
                  <MaterialIcons
                    name={showPrefectureList ? "keyboard-arrow-up" : "keyboard-arrow-down"}
                    size={24}
                    color={colors.muted}
                  />
                </Pressable>
                
                {showPrefectureList && (
                  <View style={{
                    backgroundColor: colors.surface,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: colors.border,
                    maxHeight: 200,
                  }}>
                    <ScrollView nestedScrollEnabled>
                      {prefectures.map((pref) => (
                        <Pressable
                          key={pref}
                          onPress={() => {
                            setPrefecture(pref);
                            setShowPrefectureList(false);
                          }}
                          style={{
                            padding: 12,
                            borderBottomWidth: 1,
                            borderBottomColor: colors.border,
                            backgroundColor: prefecture === pref ? `${colors.primary}20` : "transparent",
                          }}
                        >
                          <Text style={{ 
                            color: prefecture === pref ? colors.primary : colors.foreground,
                            fontSize: 14,
                          }}>
                            {pref}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* 性別 */}
              <View style={{ gap: 8 }}>
                <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "600" }}>
                  性別 <Text style={{ color: colors.error }}>*</Text>
                </Text>
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <Pressable
                    onPress={() => setGender("male")}
                    style={{
                      flex: 1,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      paddingVertical: 14,
                      borderRadius: 12,
                      backgroundColor: gender === "male" ? palette.blue500 + "33" : colors.surface, // #3B82F620 = 20% opacity = 33 in hex
                      borderWidth: 2,
                      borderColor: gender === "male" ? color.info : colors.border,
                    }}
                  >
                    <Text style={{ fontSize: 20 }}>👨</Text>
                    <Text style={{
                      color: gender === "male" ? color.info : colors.foreground,
                      fontSize: 16,
                      fontWeight: gender === "male" ? "600" : "400",
                    }}>
                      男性
                    </Text>
                  </Pressable>
                  
                  <Pressable
                    onPress={() => setGender("female")}
                    style={{
                      flex: 1,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      paddingVertical: 14,
                      borderRadius: 12,
                      backgroundColor: gender === "female" ? palette.pink500 + "33" : colors.surface, // #EC489920 = 20% opacity = 33 in hex
                      borderWidth: 2,
                      borderColor: gender === "female" ? color.accentPrimary : colors.border,
                    }}
                  >
                    <Text style={{ fontSize: 20 }}>👩</Text>
                    <Text style={{
                      color: gender === "female" ? color.accentPrimary : colors.foreground,
                      fontSize: 16,
                      fontWeight: gender === "female" ? "600" : "400",
                    }}>
                      女性
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* 更新ボタン */}
              <Pressable
                onPress={handleUpdate}
                disabled={updateParticipationMutation.isPending}
                style={{
                  marginTop: 16,
                  marginBottom: 40,
                }}
              >
                <LinearGradient
                  colors={[color.accentPrimary, color.accentAlt]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    borderRadius: 16,
                    padding: 18,
                    alignItems: "center",
                    opacity: updateParticipationMutation.isPending ? 0.7 : 1,
                  }}
                >
                  {updateParticipationMutation.isPending ? (
                    <ActivityIndicator color={color.textWhite} />
                  ) : (
                    <Text style={{ color: color.textWhite, fontSize: 18, fontWeight: "bold" }}>
                      更新する
                    </Text>
                  )}
                </LinearGradient>
              </Pressable>
            </View>
          </ResponsiveContainer>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
