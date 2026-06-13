/**
 * コンポーネントギャラリー
 * 
 * アプリで使用されているコンポーネントの一覧と
 * 各バリエーションを確認できる管理者向け画面
 */

import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/use-colors";
import { color, palette } from "@/theme/tokens";
import { TwitterUserCard, TwitterUserCompact, TwitterAvatar } from "@/components/molecules/twitter-user-card";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { APP_VERSION } from "@/shared/version";

// サンプルユーザーデータ
const sampleUser = {
  twitterId: "1234567890",
  name: "君斗りんく＠アイドル応援",
  username: "kimitolink",
  profileImage: "https://pbs.twimg.com/profile_images/1867512383713030149/example.jpg",
  followersCount: 5000,
  description: "まだ見ぬ才能を世界へ！君斗りんくです 🎵 ボクが時に推しを変えるのは、ファンのリアルな心の動きの投影。応援は「キャッチボール」だから。",
};

const sampleUser2 = {
  name: "たぬ姉",
  username: "yukkuritanunee",
  profileImage: "https://pbs.twimg.com/profile_images/example2.jpg",
  followersCount: 4,
  description: "ゆっくりしていってね",
};

export default function ComponentsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
    >
      <View className="p-6">
        {/* ヘッダー */}
        <View className="mb-8">
          <Text className="text-2xl font-bold text-foreground">コンポーネントギャラリー</Text>
          <Text className="text-muted mt-1">v{APP_VERSION} - デザインシステム確認用</Text>
        </View>

        {/* カラーパレット */}
        <Section title="カラーパレット">
          <View className="flex-row flex-wrap" style={{ gap: 12 }}>
            <ColorSwatch name="primary" color={colors.primary} />
            <ColorSwatch name="background" color={colors.background} border />
            <ColorSwatch name="surface" color={colors.surface} border />
            <ColorSwatch name="foreground" color={colors.foreground} />
            <ColorSwatch name="muted" color={colors.muted} />
            <ColorSwatch name="border" color={colors.border} border />
            <ColorSwatch name="success" color={colors.success} />
            <ColorSwatch name="warning" color={colors.warning} />
            <ColorSwatch name="error" color={colors.error} />
          </View>
          
          {/* グラデーション */}
          <Text className="text-sm font-semibold text-foreground mt-6 mb-3">グラデーション</Text>
          <View className="flex-row" style={{ gap: 12 }}>
            <View style={{ flex: 1 }}>
              <LinearGradient
                colors={[palette.pink500, palette.purple500]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ height: 60, borderRadius: 12 }}
              />
              <Text className="text-xs text-muted mt-2 text-center">ホストカード</Text>
            </View>
            <View style={{ flex: 1 }}>
              <LinearGradient
                colors={[color.info, palette.purple500]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ height: 60, borderRadius: 12 }}
              />
              <Text className="text-xs text-muted mt-2 text-center">アクセント</Text>
            </View>
          </View>
        </Section>

        {/* TwitterUserCard */}
        <Section title="TwitterUserCard">
          <Text className="text-sm text-muted mb-4">
            ユーザー情報を表示する再利用可能なカードコンポーネント
          </Text>

          {/* サイズバリエーション */}
          <SubSection title="サイズ: small">
            <View className="bg-surface p-4 rounded-xl border border-border">
              <TwitterUserCard user={sampleUser} size="small" showFollowers />
            </View>
          </SubSection>

          <SubSection title="サイズ: medium（デフォルト）">
            <View className="bg-surface p-4 rounded-xl border border-border">
              <TwitterUserCard user={sampleUser} size="medium" showFollowers />
            </View>
          </SubSection>

          <SubSection title="サイズ: large">
            <View className="bg-surface p-4 rounded-xl border border-border">
              <TwitterUserCard user={sampleUser} size="large" showFollowers />
            </View>
          </SubSection>

          {/* description付き */}
          <SubSection title="description表示">
            <View className="bg-surface p-4 rounded-xl border border-border">
              <TwitterUserCard user={sampleUser} size="medium" showFollowers showDescription />
            </View>
          </SubSection>

          {/* グラデーション背景 */}
          <SubSection title="グラデーション背景（ホストカード）">
            <LinearGradient
              colors={[palette.pink500, palette.purple500]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ padding: 16, borderRadius: 12 }}
            >
              <TwitterUserCard 
                user={sampleUser} 
                size="large" 
                showFollowers 
                showDescription 
              />
            </LinearGradient>
            <Text className="text-xs text-warning mt-2">
              ⚠️ グラデーション背景では@usernameとフォロワー数の視認性に注意
            </Text>
          </SubSection>

          {/* フォロワー少ないユーザー */}
          <SubSection title="フォロワー少数ユーザー">
            <View className="bg-surface p-4 rounded-xl border border-border">
              <TwitterUserCard user={sampleUser2} size="medium" showFollowers showDescription />
            </View>
          </SubSection>
        </Section>

        {/* TwitterUserCompact */}
        <Section title="TwitterUserCompact">
          <Text className="text-sm text-muted mb-4">
            コンパクトなユーザー表示（アバター + 名前のみ）
          </Text>
          
          <View className="flex-row items-center" style={{ gap: 24 }}>
            <View>
              <TwitterUserCompact user={sampleUser} size="small" />
              <Text className="text-xs text-muted mt-2">small</Text>
            </View>
            <View>
              <TwitterUserCompact user={sampleUser} size="medium" />
              <Text className="text-xs text-muted mt-2">medium</Text>
            </View>
          </View>
        </Section>

        {/* TwitterAvatar */}
        <Section title="TwitterAvatar">
          <Text className="text-sm text-muted mb-4">
            アバターのみ表示
          </Text>
          
          <View className="flex-row items-end" style={{ gap: 16 }}>
            <View className="items-center">
              <TwitterAvatar user={sampleUser} size={24} />
              <Text className="text-xs text-muted mt-2">24px</Text>
            </View>
            <View className="items-center">
              <TwitterAvatar user={sampleUser} size={32} />
              <Text className="text-xs text-muted mt-2">32px</Text>
            </View>
            <View className="items-center">
              <TwitterAvatar user={sampleUser} size={40} />
              <Text className="text-xs text-muted mt-2">40px</Text>
            </View>
            <View className="items-center">
              <TwitterAvatar user={sampleUser} size={48} />
              <Text className="text-xs text-muted mt-2">48px</Text>
            </View>
            <View className="items-center">
              <TwitterAvatar user={sampleUser} size={64} />
              <Text className="text-xs text-muted mt-2">64px</Text>
            </View>
          </View>
        </Section>

        {/* ボタン */}
        <Section title="ボタン">
          <View style={{ gap: 12 }}>
            {/* プライマリボタン */}
            <SubSection title="プライマリ">
              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }
                ]}
              >
                <Text className="text-white font-semibold text-center">参加表明する</Text>
              </Pressable>
            </SubSection>

            {/* セカンダリボタン */}
            <SubSection title="セカンダリ">
              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, opacity: pressed ? 0.8 : 1 }
                ]}
              >
                <Text className="text-foreground font-semibold text-center">キャンセル</Text>
              </Pressable>
            </SubSection>

            {/* グラデーションボタン */}
            <SubSection title="グラデーション">
              <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}>
                <LinearGradient
                  colors={[palette.pink500, palette.purple500]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.button, { borderRadius: 12 }]}
                >
                  <Text className="text-white font-semibold text-center">Xでシェア</Text>
                </LinearGradient>
              </Pressable>
            </SubSection>

            {/* アイコン付きボタン */}
            <SubSection title="アイコン付き">
              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  styles.buttonWithIcon,
                  { backgroundColor: color.twitter, opacity: pressed ? 0.8 : 1 }
                ]}
              >
                <Ionicons name="logo-twitter" size={20} color="white" />
                <Text className="text-white font-semibold">Twitterでログイン</Text>
              </Pressable>
            </SubSection>

            {/* 無効状態 */}
            <SubSection title="無効状態">
              <Pressable
                disabled
                style={[styles.button, { backgroundColor: colors.muted, opacity: 0.5 }]}
              >
                <Text className="text-white font-semibold text-center">送信中...</Text>
              </Pressable>
            </SubSection>
          </View>
        </Section>

        {/* カード */}
        <Section title="カード">
          <View style={{ gap: 12 }}>
            {/* 基本カード */}
            <SubSection title="基本">
              <View className="bg-surface p-4 rounded-xl border border-border">
                <Text className="text-foreground font-semibold">カードタイトル</Text>
                <Text className="text-muted text-sm mt-1">カードの説明文がここに入ります</Text>
              </View>
            </SubSection>

            {/* シャドウ付きカード */}
            <SubSection title="シャドウ付き">
              <View 
                className="bg-surface p-4 rounded-xl"
                style={{
                  shadowColor: palette.gray900,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <Text className="text-foreground font-semibold">シャドウカード</Text>
                <Text className="text-muted text-sm mt-1">影付きのカードスタイル</Text>
              </View>
            </SubSection>

            {/* ステータスカード */}
            <SubSection title="ステータス表示">
              <View className="bg-surface p-4 rounded-xl border border-border">
                <View className="flex-row items-center justify-between">
                  <Text className="text-foreground font-semibold">参加者数</Text>
                  <View className="flex-row items-center" style={{ gap: 4 }}>
                    <Text className="text-2xl font-bold" style={{ color: colors.primary }}>45</Text>
                    <Text className="text-muted">/ 100人</Text>
                  </View>
                </View>
                <View className="h-2 bg-border rounded-full mt-3 overflow-hidden">
                  <View 
                    className="h-full rounded-full"
                    style={{ width: '45%', backgroundColor: colors.primary }}
                  />
                </View>
              </View>
            </SubSection>
          </View>
        </Section>

        {/* タイポグラフィ */}
        <Section title="タイポグラフィ">
          <View style={{ gap: 8 }}>
            <Text className="text-3xl font-bold text-foreground">見出し1 (3xl bold)</Text>
            <Text className="text-2xl font-bold text-foreground">見出し2 (2xl bold)</Text>
            <Text className="text-xl font-semibold text-foreground">見出し3 (xl semibold)</Text>
            <Text className="text-lg font-semibold text-foreground">見出し4 (lg semibold)</Text>
            <Text className="text-base text-foreground">本文 (base)</Text>
            <Text className="text-sm text-muted">補足テキスト (sm muted)</Text>
            <Text className="text-xs text-muted">キャプション (xs muted)</Text>
          </View>
        </Section>

        {/* アイコン */}
        <Section title="アイコン（Ionicons）">
          <View className="flex-row flex-wrap" style={{ gap: 16 }}>
            {[
              'home', 'search', 'add-circle', 'person', 'settings',
              'heart', 'star', 'share-social', 'chatbubble', 'notifications',
              'checkmark-circle', 'close-circle', 'warning', 'information-circle',
              'trophy', 'ticket', 'calendar', 'location', 'people',
            ].map((icon) => (
              <View key={icon} className="items-center" style={{ width: 60 }}>
                <Ionicons name={icon as any} size={24} color={colors.foreground} />
                <Text className="text-xs text-muted mt-1">{icon}</Text>
              </View>
            ))}
          </View>
        </Section>

        {/* フッター */}
        <View className="mt-8 pt-6 border-t border-border">
          <Text className="text-xs text-muted text-center">
            コンポーネントギャラリー v{APP_VERSION}
          </Text>
          <Text className="text-xs text-muted text-center mt-1">
            デザインの一貫性を保つためにこの画面を参照してください
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

// セクションコンポーネント
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mb-8">
      <Text className="text-lg font-bold text-foreground mb-4">{title}</Text>
      {children}
    </View>
  );
}

// サブセクションコンポーネント
function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mb-4">
      <Text className="text-sm font-medium text-muted mb-2">{title}</Text>
      {children}
    </View>
  );
}

// カラースウォッチコンポーネント
function ColorSwatch({ name, color, border }: { name: string; color: string; border?: boolean }) {
  return (
    <View className="items-center">
      <View
        style={{
          width: 48,
          height: 48,
          backgroundColor: color,
          borderRadius: 8,
          borderWidth: border ? 1 : 0,
          borderColor: palette.gray700,
        }}
      />
      <Text className="text-xs text-muted mt-1">{name}</Text>
      <Text className="text-xs text-muted">{color}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  buttonWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});
