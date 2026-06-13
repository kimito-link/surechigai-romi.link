import { View, Text, TextInput, ScrollView, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { commonCopy } from "@/constants/copy/common";
import { color } from "@/theme/tokens";
import { useLocalSearchParams } from "expo-router";
import { navigateBack } from "@/lib/navigation/app-routes";
import { useState, useEffect, useRef } from "react";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { AppHeader } from "@/components/organisms/app-header";
import { DatePicker } from "@/components/molecules/date-picker";
import { NumberStepper } from "@/components/molecules/number-stepper";
import { showAlert } from "@/lib/web-alert";
import { prefectures } from "@/constants/prefectures";
import {
  EventTypeSelector,
  GoalTypeSelector,
  CategorySelector,
} from "@/features/create";

/**
 * チャレンジ編集画面
 * v6.07: 運営者がホーム画面からチャレンジを編集できる機能
 */
export default function EditChallengeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { user } = useAuth();
  const colors = useColors();
  const scrollViewRef = useRef<ScrollView>(null);

  // フォーム状態
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [venue, setVenue] = useState("");
  const [prefecture, setPrefecture] = useState("");
  const [eventDateStr, setEventDateStr] = useState("");
  const [goalType, setGoalType] = useState("attendance");
  const [goalValue, setGoalValue] = useState(100);
  const [goalUnit, setGoalUnit] = useState("人");
  const [eventType, setEventType] = useState("solo");
  const [ticketPresale, setTicketPresale] = useState("");
  const [ticketDoor, setTicketDoor] = useState("");
  const [ticketUrl, setTicketUrl] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [showPrefectureList, setShowPrefectureList] = useState(false);
  const [showCategoryList, setShowCategoryList] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // チャレンジデータを取得
  const { data: challenge, isLoading } = trpc.events.getById.useQuery(
    { id: parseInt(id || "0") },
    { enabled: !!id }
  );

  // カテゴリ一覧を取得
  const { data: categoriesData } = trpc.categories.list.useQuery();

  // 更新ミューテーション
  const updateMutation = trpc.events.update.useMutation({
    onSuccess: () => {
      showAlert("更新完了", "チャレンジを更新しました", [
        {
          text: "OK",
          onPress: () => navigateBack(),
        },
      ]);
    },
    onError: (error) => {
      showAlert("エラー", error.message || "更新に失敗しました");
    },
  });

  // チャレンジデータをフォームに反映
  useEffect(() => {
    if (challenge && !isInitialized) {
      setTitle(challenge.title || "");
      setDescription(challenge.description || "");
      setVenue(challenge.venue || "");
      setPrefecture(challenge.prefecture || "");
      setEventDateStr(
        challenge.eventDate
          ? new Date(challenge.eventDate).toISOString().split("T")[0]
          : ""
      );
      setGoalType(challenge.goalType || "attendance");
      setGoalValue(challenge.goalValue || 100);
      setGoalUnit(challenge.goalUnit || "人");
      setEventType(challenge.eventType || "solo");
      setTicketPresale(challenge.ticketPresale?.toString() || "");
      setTicketDoor(challenge.ticketDoor?.toString() || "");
      setTicketUrl(challenge.ticketUrl || "");
      setExternalUrl(challenge.externalUrl || "");
      setCategoryId(challenge.categoryId || null);
      setIsInitialized(true);
    }
  }, [challenge, isInitialized]);

  // 権限チェック
  const isOwner = user?.twitterId && challenge?.hostTwitterId === user.twitterId;

  const handleUpdate = () => {
    if (!title.trim()) {
      showAlert("エラー", "タイトルを入力してください");
      return;
    }

    updateMutation.mutate({
      id: parseInt(id || "0"),
      title: title.trim(),
      description: description.trim() || undefined,
      venue: venue.trim() || undefined,
      eventDate: eventDateStr ? new Date(eventDateStr).toISOString() : undefined,
      goalType: goalType as "attendance" | "followers" | "viewers" | "points" | "custom",
      goalValue: goalValue || 100,
      goalUnit: goalUnit || "人",
      eventType: eventType as "solo" | "group",
      categoryId: categoryId || undefined,
      externalUrl: externalUrl.trim() || undefined,
      ticketPresale: ticketPresale && ticketPresale !== "-1" ? parseInt(ticketPresale) : undefined,
      ticketDoor: ticketDoor && ticketDoor !== "-1" ? parseInt(ticketDoor) : undefined,
      ticketUrl: ticketUrl.trim() || undefined,
    });
  };

  if (isLoading) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.muted, marginTop: 16 }}>読み込み中...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!challenge) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
          <MaterialIcons name="error-outline" size={48} color={colors.muted} />
          <Text style={{ color: colors.foreground, fontSize: 18, marginTop: 16 }}>
            チャレンジが見つかりません
          </Text>
          <Pressable
            style={{
              marginTop: 20,
              backgroundColor: colors.primary,
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 8,
            }}
            onPress={() => navigateBack()}
          >
            <Text style={{ color: color.textWhite, fontWeight: "600" }}>戻る</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  if (!isOwner) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
          <MaterialIcons name="lock" size={48} color={colors.muted} />
          <Text style={{ color: colors.foreground, fontSize: 18, marginTop: 16 }}>
            {commonCopy.empty.noEditPermission}
          </Text>
          <Text style={{ color: colors.muted, fontSize: 14, marginTop: 8, textAlign: "center" }}>
            このチャレンジを編集できるのは作成者のみです
          </Text>
          <Pressable
            style={{
              marginTop: 20,
              backgroundColor: colors.primary,
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 8,
            }}
            onPress={() => navigateBack()}
          >
            <Text style={{ color: color.textWhite, fontWeight: "600" }}>戻る</Text>
          </Pressable>
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
          ref={scrollViewRef}
          style={{ flex: 1, backgroundColor: colors.background }}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
        >
          {/* ヘッダー */}
          <AppHeader
            title="チャレンジ編集"
            showCharacters={false}
            showMenu={false}
          />

          <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
            <Text style={{ color: colors.foreground, fontSize: 24, fontWeight: "bold" }}>
              チャレンジを編集
            </Text>
            <Text style={{ color: colors.muted, fontSize: 14, marginTop: 4 }}>
              内容を変更して更新してください
            </Text>
          </View>

          {/* フォーム */}
          <View style={{ padding: 16, gap: 20 }}>
            {/* タイトル */}
            <View>
              <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "600", marginBottom: 8 }}>
                タイトル <Text style={{ color: color.danger }}>*</Text>
              </Text>
              <TextInput
                style={{
                  backgroundColor: color.surface,
                  borderRadius: 12,
                  padding: 16,
                  color: colors.foreground,
                  fontSize: 16,
                  borderWidth: 1,
                  borderColor: color.border,
                }}
                value={title}
                onChangeText={setTitle}
                placeholder="例: 君斗りんく生誕祭2026"
                placeholderTextColor={colors.muted}
              />
            </View>

            {/* 説明 */}
            <View>
              <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "600", marginBottom: 8 }}>
                説明
              </Text>
              <TextInput
                style={{
                  backgroundColor: color.surface,
                  borderRadius: 12,
                  padding: 16,
                  color: colors.foreground,
                  fontSize: 16,
                  borderWidth: 1,
                  borderColor: color.border,
                  minHeight: 100,
                  textAlignVertical: "top",
                }}
                value={description}
                onChangeText={setDescription}
                placeholder="チャレンジの詳細を入力..."
                placeholderTextColor={colors.muted}
                multiline
                numberOfLines={4}
              />
            </View>

            {/* イベント日時 */}
            <View>
              <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "600", marginBottom: 8 }}>
                イベント日時
              </Text>
              <DatePicker
                value={eventDateStr}
                onChange={setEventDateStr}
                placeholder="日付を選択"
              />
            </View>

            {/* 会場 */}
            <View>
              <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "600", marginBottom: 8 }}>
                会場
              </Text>
              <TextInput
                style={{
                  backgroundColor: color.surface,
                  borderRadius: 12,
                  padding: 16,
                  color: colors.foreground,
                  fontSize: 16,
                  borderWidth: 1,
                  borderColor: color.border,
                }}
                value={venue}
                onChangeText={setVenue}
                placeholder="例: 渋谷WWW"
                placeholderTextColor={colors.muted}
              />
            </View>

            {/* 都道府県 */}
            <View>
              <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "600", marginBottom: 8 }}>
                都道府県
              </Text>
              <Pressable
                style={{
                  backgroundColor: color.surface,
                  borderRadius: 12,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: color.border,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
                onPress={() => setShowPrefectureList(!showPrefectureList)}
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
                <View
                  style={{
                    backgroundColor: color.surface,
                    borderRadius: 12,
                    marginTop: 8,
                    maxHeight: 200,
                    borderWidth: 1,
                    borderColor: color.border,
                  }}
                >
                  <ScrollView nestedScrollEnabled>
                    {prefectures.map((pref) => (
                      <Pressable
                        key={pref}
                        style={{
                          padding: 12,
                          borderBottomWidth: 1,
                          borderBottomColor: color.border,
                        }}
                        onPress={() => {
                          setPrefecture(pref);
                          setShowPrefectureList(false);
                        }}
                      >
                        <Text
                          style={{
                            color: prefecture === pref ? colors.primary : colors.foreground,
                            fontSize: 14,
                          }}
                        >
                          {pref}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* 目標タイプ */}
            <GoalTypeSelector
              goalType={goalType}
              goalUnit={goalUnit}
              onGoalTypeChange={(id, unit) => {
                setGoalType(id);
                setGoalUnit(unit);
              }}
              onGoalUnitChange={setGoalUnit}
            />

            {/* 目標値 */}
            <View>
              <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "600", marginBottom: 8 }}>
                目標値
              </Text>
              <NumberStepper
                value={goalValue}
                onChange={setGoalValue}
                min={1}
                max={100000}
                step={10}
              />
            </View>

            {/* 目標単位 */}
            <View>
              <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "600", marginBottom: 8 }}>
                単位
              </Text>
              <TextInput
                style={{
                  backgroundColor: color.surface,
                  borderRadius: 12,
                  padding: 16,
                  color: colors.foreground,
                  fontSize: 16,
                  borderWidth: 1,
                  borderColor: color.border,
                }}
                value={goalUnit}
                onChangeText={setGoalUnit}
                placeholder="例: 人"
                placeholderTextColor={colors.muted}
              />
            </View>

            {/* イベントタイプ */}
            <EventTypeSelector
              value={eventType}
              onChange={setEventType}
            />

            {/* カテゴリ */}
            <CategorySelector
              categoryId={categoryId}
              categories={categoriesData || []}
              showList={showCategoryList}
              onToggleList={() => setShowCategoryList(!showCategoryList)}
              onSelect={(id) => {
                setCategoryId(id);
                setShowCategoryList(false);
              }}
            />

            {/* チケット情報 */}
            <View>
              <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "600", marginBottom: 8 }}>
                チケット情報（任意）
              </Text>
              <View style={{ gap: 12 }}>
                <TextInput
                  style={{
                    backgroundColor: color.surface,
                    borderRadius: 12,
                    padding: 16,
                    color: colors.foreground,
                    fontSize: 16,
                    borderWidth: 1,
                    borderColor: color.border,
                  }}
                  value={ticketPresale}
                  onChangeText={setTicketPresale}
                  placeholder="前売り価格（円）"
                  placeholderTextColor={colors.muted}
                  keyboardType="numeric"
                />
                <TextInput
                  style={{
                    backgroundColor: color.surface,
                    borderRadius: 12,
                    padding: 16,
                    color: colors.foreground,
                    fontSize: 16,
                    borderWidth: 1,
                    borderColor: color.border,
                  }}
                  value={ticketDoor}
                  onChangeText={setTicketDoor}
                  placeholder="当日価格（円）"
                  placeholderTextColor={colors.muted}
                  keyboardType="numeric"
                />
                <TextInput
                  style={{
                    backgroundColor: color.surface,
                    borderRadius: 12,
                    padding: 16,
                    color: colors.foreground,
                    fontSize: 16,
                    borderWidth: 1,
                    borderColor: color.border,
                  }}
                  value={ticketUrl}
                  onChangeText={setTicketUrl}
                  placeholder="チケット購入URL"
                  placeholderTextColor={colors.muted}
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* 外部リンク */}
            <View>
              <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "600", marginBottom: 8 }}>
                外部リンク（任意）
              </Text>
              <TextInput
                style={{
                  backgroundColor: color.surface,
                  borderRadius: 12,
                  padding: 16,
                  color: colors.foreground,
                  fontSize: 16,
                  borderWidth: 1,
                  borderColor: color.border,
                }}
                value={externalUrl}
                onChangeText={setExternalUrl}
                placeholder="https://..."
                placeholderTextColor={colors.muted}
                autoCapitalize="none"
              />
            </View>

            {/* 更新ボタン */}
            <Pressable
              style={{
                backgroundColor: colors.primary,
                borderRadius: 12,
                padding: 16,
                alignItems: "center",
                marginTop: 20,
                opacity: updateMutation.isPending ? 0.7 : 1,
              }}
              onPress={handleUpdate}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <ActivityIndicator color={color.textWhite} />
              ) : (
                <Text style={{ color: color.textWhite, fontSize: 16, fontWeight: "bold" }}>
                  更新する
                </Text>
              )}
            </Pressable>

            {/* キャンセルボタン */}
            <Pressable
              style={{
                backgroundColor: "transparent",
                borderRadius: 12,
                padding: 16,
                alignItems: "center",
                borderWidth: 1,
                borderColor: color.border,
              }}
              onPress={() => navigateBack()}
            >
              <Text style={{ color: colors.muted, fontSize: 16, fontWeight: "600" }}>
                キャンセル
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
