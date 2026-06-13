import { useState, useEffect } from "react";
import { commonCopy } from "@/constants/copy/common";
import { color, palette } from "@/theme/tokens";
import { View, Text, ScrollView, Pressable, Switch, Alert, Platform } from "react-native";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams } from "expo-router";
import { navigate, navigateBack } from "@/lib/navigation";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { AppHeader } from "@/components/organisms/app-header";

type ReminderType = "day_before" | "day_of" | "hour_before" | "custom";

export default function ReminderSettingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const { user } = useAuth();
  const challengeId = parseInt(id || "0", 10);

  const [dayBefore, setDayBefore] = useState(true);
  const [dayOf, setDayOf] = useState(true);
  const [hourBefore, setHourBefore] = useState(false);

  const { data: challenge } = trpc.events.getById.useQuery({ id: challengeId });
  const { data: existingReminder } = trpc.reminders.getForChallenge.useQuery(
    { challengeId },
    { enabled: !!user }
  );

  const createReminder = trpc.reminders.create.useMutation();
  const deleteReminder = trpc.reminders.delete.useMutation();

  useEffect(() => {
    if (existingReminder) {
      setDayBefore(existingReminder.reminderType === "day_before");
      setDayOf(existingReminder.reminderType === "day_of");
      setHourBefore(existingReminder.reminderType === "hour_before");
    }
  }, [existingReminder]);

  const handleToggle = async (type: ReminderType, value: boolean) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (value) {
      try {
        await createReminder.mutateAsync({
          challengeId,
          reminderType: type,
        });
        Alert.alert(commonCopy.alerts.settingDone, "リマインダーを設定しました");
      } catch {
        Alert.alert(commonCopy.alerts.error, "リマインダーの設定に失敗しました");
      }
    } else if (existingReminder) {
      try {
        await deleteReminder.mutateAsync({ id: existingReminder.id });
        Alert.alert(commonCopy.alerts.settingDone, "リマインダーを解除しました");
      } catch {
        Alert.alert(commonCopy.alerts.error, "リマインダーの解除に失敗しました");
      }
    }

    switch (type) {
      case "day_before":
        setDayBefore(value);
        break;
      case "day_of":
        setDayOf(value);
        break;
      case "hour_before":
        setHourBefore(value);
        break;
    }
  };

  if (!user) {
    return (
      <ScreenContainer className="p-6">
        <View className="flex-1 items-center justify-center">
          <Text className="text-lg text-muted text-center">
            リマインダーを設定するにはログインが必要です
          </Text>
          <Pressable
            onPress={() => navigate.toOAuth()}
            className="mt-4 bg-primary px-6 py-3 rounded-full"
          >
            <Text className="text-background font-bold">ログイン</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-6">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ヘッダー */}
        <AppHeader 
          title="君斗りんくの動員ちゃれんじ" 
          showCharacters={false}
          rightElement={
            <Pressable
              onPress={() => navigateBack()}
              className="flex-row items-center"
            >
              <Text className="text-foreground">← 戻る</Text>
            </Pressable>
          }
        />
        <View className="mb-6">
          <Text className="text-2xl font-bold text-foreground">
            リマインダー設定
          </Text>
          {challenge && (
            <Text className="text-sm text-muted mt-1" numberOfLines={1}>
              {challenge.title}
            </Text>
          )}
        </View>

        {/* イベント日時 */}
        {challenge && (
          <View className="bg-surface rounded-2xl p-4 mb-6 border border-border">
            <Text className="text-sm text-muted mb-1">イベント日時</Text>
            <Text className="text-lg font-bold text-foreground">
              {new Date(challenge.eventDate).toLocaleDateString("ja-JP", {
                year: "numeric",
                month: "long",
                day: "numeric",
                weekday: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>
        )}

        {/* リマインダー設定 */}
        <View className="bg-surface rounded-2xl border border-border overflow-hidden">
          <View className="p-4 border-b border-border">
            <Text className="text-lg font-bold text-foreground mb-1">
              通知タイミング
            </Text>
            <Text className="text-sm text-muted">
              イベント前に通知を受け取るタイミングを選択してください
            </Text>
          </View>

          {/* 前日通知 */}
          <View className="flex-row items-center justify-between p-4 border-b border-border">
            <View className="flex-1 mr-4">
              <Text className="text-base font-medium text-foreground">
                前日通知
              </Text>
              <Text className="text-sm text-muted">
                イベント前日の朝9時に通知
              </Text>
            </View>
            <Switch
              value={dayBefore}
              onValueChange={(value) => handleToggle("day_before", value)}
              trackColor={{ false: color.borderAlt, true: color.pink400 }}
              thumbColor={dayBefore ? color.accentPrimary : palette.gray400}
            />
          </View>

          {/* 当日通知 */}
          <View className="flex-row items-center justify-between p-4 border-b border-border">
            <View className="flex-1 mr-4">
              <Text className="text-base font-medium text-foreground">
                当日通知
              </Text>
              <Text className="text-sm text-muted">
                イベント当日の朝9時に通知
              </Text>
            </View>
            <Switch
              value={dayOf}
              onValueChange={(value) => handleToggle("day_of", value)}
              trackColor={{ false: color.borderAlt, true: color.pink400 }}
              thumbColor={dayOf ? color.accentPrimary : palette.gray400}
            />
          </View>

          {/* 1時間前通知 */}
          <View className="flex-row items-center justify-between p-4">
            <View className="flex-1 mr-4">
              <Text className="text-base font-medium text-foreground">
                1時間前通知
              </Text>
              <Text className="text-sm text-muted">
                イベント開始1時間前に通知
              </Text>
            </View>
            <Switch
              value={hourBefore}
              onValueChange={(value) => handleToggle("hour_before", value)}
              trackColor={{ false: color.borderAlt, true: color.pink400 }}
              thumbColor={hourBefore ? color.accentPrimary : palette.gray400}
            />
          </View>
        </View>

        {/* 説明 */}
        <View className="mt-6 p-4 bg-surface/50 rounded-xl">
          <Text className="text-sm text-muted text-center">
            💡 リマインダーを設定すると、イベントを忘れずに参加できます。
            通知はプッシュ通知で届きます。
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
