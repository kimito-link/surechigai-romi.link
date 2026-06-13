import { useState, useEffect, useRef } from "react";
import { color } from "@/theme/tokens";
import { View, Text, FlatList, TextInput, Pressable, KeyboardAvoidingView, Platform } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { navigateBack } from "@/lib/navigation/app-routes";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import * as Haptics from "expo-haptics";
import { AppHeader } from "@/components/organisms/app-header";

export default function ConversationScreen() {
  const { partnerId, challengeId } = useLocalSearchParams<{ partnerId: string; challengeId: string }>();

  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const flatListRef = useRef<FlatList>(null);

  const partnerIdNum = parseInt(partnerId || "0", 10);
  const challengeIdNum = parseInt(challengeId || "0", 10);

  const { data: messages, refetch } = trpc.dm.getConversation.useQuery(
    { partnerId: partnerIdNum, challengeId: challengeIdNum },
    { enabled: !!user && !!partnerIdNum && !!challengeIdNum }
  );

  const sendMessage = trpc.dm.send.useMutation({
    onSuccess: () => {
      setMessage("");
      refetch();
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },
  });

  const markAllAsRead = trpc.dm.markAllAsRead.useMutation();

  useEffect(() => {
    if (user && partnerIdNum) {
      markAllAsRead.mutate({ fromUserId: partnerIdNum });
    }
  }, [user, partnerIdNum, markAllAsRead]);

  useEffect(() => {
    if (messages && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim() || !user) return;

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      await sendMessage.mutateAsync({
        toUserId: partnerIdNum,
        challengeId: challengeIdNum,
        message: message.trim(),
      });
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  if (!user) {
    return (
      <ScreenContainer className="p-6">
        <View className="flex-1 items-center justify-center">
          <Text className="text-lg text-muted text-center">
            メッセージを送るにはログインが必要です
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  const renderMessage = ({ item }: { item: NonNullable<typeof messages>[0] }) => {
    const isMe = item.fromUserId === user.id;

    return (
      <View className={`flex-row mb-3 ${isMe ? "justify-end" : "justify-start"}`}>
        <View
          className={`max-w-[75%] rounded-2xl px-4 py-3 ${
            isMe ? "bg-primary" : "bg-surface"
          }`}
        >
          <Text className={`text-base ${isMe ? "text-background" : "text-foreground"}`}>
            {item.message}
          </Text>
          <Text
            className={`text-xs mt-1 ${isMe ? "text-background/70" : "text-muted"}`}
          >
            {new Date(item.createdAt).toLocaleTimeString("ja-JP", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* ヘッダー */}
        <AppHeader 
          title="君斗りんくの動員ちゃれんじ" 
          showCharacters={false}
          rightElement={
            <Pressable onPress={() => navigateBack()} className="flex-row items-center">
              <Text className="text-foreground">← 戻る</Text>
            </Pressable>
          }
        />
        <View className="p-4 border-b border-border">
          <Text className="text-lg font-bold text-foreground">
            メッセージ
          </Text>
        </View>

        {/* メッセージ一覧 */}
        <FlatList
          ref={flatListRef}
          data={messages || []}
          renderItem={renderMessage}
          keyExtractor={(item) => `${item.id}`}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center">
              <Text className="text-muted">メッセージを送ってみましょう</Text>
            </View>
          }
          // パフォーマンス最適化
          windowSize={10}
          maxToRenderPerBatch={15}
          initialNumToRender={20}
          removeClippedSubviews={Platform.OS !== "web"}
          updateCellsBatchingPeriod={50}
          inverted={false}
        />

        {/* 入力エリア */}
        <View className="flex-row items-end p-4 border-t border-border bg-background">
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="メッセージを入力..."
            placeholderTextColor={color.textSecondary}
            multiline
            maxLength={1000}
            className="flex-1 bg-surface rounded-2xl px-4 py-3 text-foreground mr-3 max-h-24"
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
          <Pressable
            onPress={handleSend}
            disabled={!message.trim() || sendMessage.isPending}
            className={`w-12 h-12 rounded-full items-center justify-center ${
              message.trim() ? "bg-primary" : "bg-surface"
            }`}
          >
            <Text className={`text-xl ${message.trim() ? "text-background" : "text-muted"}`}>
              ↑
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
