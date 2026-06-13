import { Text, View, Platform } from "react-native";
import { Image } from "expo-image";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { Button } from "@/components/ui/button";
import { navigateBack, navigateReplace } from "@/lib/navigation/app-routes";

// 画像アセット
const APP_LOGO = require("@/assets/images/logos/kimitolink-logo.jpg");
const CHARACTER_CONFUSED = require("@/assets/images/characters/link/link-yukkuri-half-eyes-mouth-open.png");

export default function NotFoundScreen() {
  // 前のページに戻る（履歴がない場合はホームに戻る）
  const handleGoBack = () => {
    if (Platform.OS === "web") {
      // Webの場合、履歴があるかチェック
      if (typeof window !== "undefined" && window.history.length > 1) {
        navigateBack();
      } else {
        // 履歴がない場合はホームに戻る
        navigateReplace.toHomeRoot();
      }
    } else {
      // ネイティブの場合は直接back()を呼ぶ
      // canGoBack()がないので、try-catchで対応
      try {
        navigateBack();
      } catch {
        navigateReplace.toHomeRoot();
      }
    }
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      <View className="flex-1 items-center justify-center p-6">
        {/* ロゴ */}
        <Image
          source={APP_LOGO}
          style={{ width: 120, height: 40, marginBottom: 24 }}
          contentFit="contain"
        />

        {/* キャラクター */}
        <Image
          source={CHARACTER_CONFUSED}
          style={{ width: 120, height: 120, marginBottom: 16 }}
          contentFit="contain"
        />

        {/* 吹き出し */}
        <View className="bg-surface rounded-2xl px-4 py-2 border border-border mb-6">
          <Text className="text-primary text-lg font-bold text-center">
            あれ？迷子かな？🤔
          </Text>
        </View>

        {/* エラーコード */}
        <Text className="text-6xl font-bold text-muted mb-2">404</Text>

        {/* メッセージ */}
        <Text className="text-xl font-bold text-foreground mb-2 text-center">
          ページが見つかりません
        </Text>
        <Text className="text-base text-muted text-center mb-8 px-4">
          お探しのページは存在しないか、{"\n"}移動した可能性があります。
        </Text>

        {/* ボタン */}
        <View className="w-full max-w-sm gap-3">
          <Button
            onPress={() => navigateReplace.toHomeRoot()}
            variant="primary"
            icon="home"
            fullWidth
          >
            ホームに戻る
          </Button>

          <Button
            onPress={handleGoBack}
            variant="secondary"
            icon="arrow-back"
            fullWidth
          >
            前のページに戻る
          </Button>
        </View>
      </View>
    </ScreenContainer>
  );
}
