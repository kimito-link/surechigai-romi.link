/**
 * ホーム画面（プレースホルダー）
 * すれちがいロミ MVP: チェックイン・封筒開封UIは後工程で実装
 */

import { View, Text } from "react-native";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { AppHeader } from "@/components/organisms/app-header";
import { useResponsive } from "@/hooks/use-responsive";

export default function HomeScreen() {
  const { isDesktop } = useResponsive();

  return (
    <ScreenContainer containerClassName="bg-background">
      <AppHeader
        title="すれちがいロミ"
        showCharacters={false}
        isDesktop={isDesktop}
        showMenu={true}
        showLoginButton={true}
      />
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-foreground text-xl font-bold mb-4">
          すれちがいロミ
        </Text>
        <Text className="text-muted-foreground text-center">
          チェックインしてすれ違いを楽しもう。{"\n"}
          準備中...
        </Text>
      </View>
    </ScreenContainer>
  );
}
