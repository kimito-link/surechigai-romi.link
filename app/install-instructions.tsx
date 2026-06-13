import { ScrollView, Text, View, Platform, Pressable } from "react-native";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { useColors } from "@/hooks/use-colors";
import { color } from "@/theme/tokens";
import { navigateBack } from "@/lib/navigation";

/**
 * インストール説明ページ
 * 
 * iOS（Safari）とAndroid（Chrome）それぞれの手順を表示します。
 */
export default function InstallInstructionsScreen() {
  const colors = useColors();

  const isIOS = Platform.OS === "ios" || (Platform.OS === "web" && /iPad|iPhone|iPod/.test(navigator.userAgent));
  const isAndroid = Platform.OS === "android" || (Platform.OS === "web" && /Android/.test(navigator.userAgent));

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* ヘッダー */}
        <View style={{ marginBottom: 24 }}>
          <Pressable
            onPress={navigateBack}
            style={({ pressed }) => ({
              alignSelf: "flex-start",
              padding: 8,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Text style={{ fontSize: 24, color: colors.foreground }}>←</Text>
          </Pressable>
          <Text style={{ fontSize: 28, fontWeight: "bold", color: colors.foreground, marginTop: 16 }}>
            📱 ホーム画面に追加
          </Text>
          <Text style={{ fontSize: 16, color: colors.muted, marginTop: 8 }}>
            アプリのように使えます
          </Text>
        </View>

        {/* iOS向けの説明 */}
        {(isIOS || Platform.OS === "web") && (
          <View style={{ marginBottom: 32 }}>
            <Text style={{ fontSize: 20, fontWeight: "bold", color: colors.foreground, marginBottom: 16 }}>
              📱 iPhone / iPad（Safari）
            </Text>

            <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 12 }}>
                手順
              </Text>

              <View style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 14, color: colors.foreground, marginBottom: 4 }}>
                  <Text style={{ fontWeight: "bold" }}>1.</Text> Safariでこのページを開く
                </Text>
                <Text style={{ fontSize: 12, color: colors.muted, marginLeft: 16 }}>
                  ※ Chrome、Firefoxでは動作しません
                </Text>
              </View>

              <View style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 14, color: colors.foreground, marginBottom: 4 }}>
                  <Text style={{ fontWeight: "bold" }}>2.</Text> 画面下の「共有」ボタン（□に↑）をタップ
                </Text>
              </View>

              <View style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 14, color: colors.foreground, marginBottom: 4 }}>
                  <Text style={{ fontWeight: "bold" }}>3.</Text> 「ホーム画面に追加」をタップ
                </Text>
                <Text style={{ fontSize: 12, color: colors.muted, marginLeft: 16 }}>
                  ※ 下にスクロールすると見つかります
                </Text>
              </View>

              <View>
                <Text style={{ fontSize: 14, color: colors.foreground }}>
                  <Text style={{ fontWeight: "bold" }}>4.</Text> 「追加」をタップ
                </Text>
              </View>
            </View>

            <View style={{ backgroundColor: colors.primary, borderRadius: 12, padding: 16 }}>
              <Text style={{ fontSize: 14, color: color.textWhite, fontWeight: "600", marginBottom: 8 }}>
                ✨ 完了！
              </Text>
              <Text style={{ fontSize: 14, color: color.textWhite + "E6" }}>
                ホーム画面にアイコンが追加されました。
                次回からはアイコンをタップするだけで開けます。
              </Text>
            </View>
          </View>
        )}

        {/* Android向けの説明 */}
        {(isAndroid || Platform.OS === "web") && (
          <View style={{ marginBottom: 32 }}>
            <Text style={{ fontSize: 20, fontWeight: "bold", color: colors.foreground, marginBottom: 16 }}>
              🤖 Android（Chrome）
            </Text>

            <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 12 }}>
                手順
              </Text>

              <View style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 14, color: colors.foreground, marginBottom: 4 }}>
                  <Text style={{ fontWeight: "bold" }}>1.</Text> Chromeでこのページを開く
                </Text>
              </View>

              <View style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 14, color: colors.foreground, marginBottom: 4 }}>
                  <Text style={{ fontWeight: "bold" }}>2.</Text> 画面右上の「︙」（メニュー）をタップ
                </Text>
              </View>

              <View style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 14, color: colors.foreground, marginBottom: 4 }}>
                  <Text style={{ fontWeight: "bold" }}>3.</Text> 「ホーム画面に追加」をタップ
                </Text>
                <Text style={{ fontSize: 12, color: colors.muted, marginLeft: 16 }}>
                  ※ または「アプリをインストール」をタップ
                </Text>
              </View>

              <View>
                <Text style={{ fontSize: 14, color: colors.foreground }}>
                  <Text style={{ fontWeight: "bold" }}>4.</Text> 「追加」をタップ
                </Text>
              </View>
            </View>

            <View style={{ backgroundColor: colors.primary, borderRadius: 12, padding: 16 }}>
              <Text style={{ fontSize: 14, color: color.textWhite, fontWeight: "600", marginBottom: 8 }}>
                ✨ 完了！
              </Text>
              <Text style={{ fontSize: 14, color: color.textWhite + "E6" }}>
                ホーム画面にアイコンが追加されました。
                次回からはアイコンをタップするだけで開けます。
              </Text>
            </View>
          </View>
        )}

        {/* メリットの説明 */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 20, fontWeight: "bold", color: colors.foreground, marginBottom: 16 }}>
            💡 ホーム画面に追加するメリット
          </Text>

          <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16 }}>
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 14, color: colors.foreground, marginBottom: 4 }}>
                ✅ <Text style={{ fontWeight: "600" }}>ワンタップで起動</Text>
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted, marginLeft: 16 }}>
                URLを入力する手間が不要
              </Text>
            </View>

            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 14, color: colors.foreground, marginBottom: 4 }}>
                ✅ <Text style={{ fontWeight: "600" }}>フルスクリーン表示</Text>
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted, marginLeft: 16 }}>
                URLバーが非表示になり、画面が広く使える
              </Text>
            </View>

            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 14, color: colors.foreground, marginBottom: 4 }}>
                ✅ <Text style={{ fontWeight: "600" }}>オフラインでも動作</Text>
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted, marginLeft: 16 }}>
                一度開いたページはキャッシュされる
              </Text>
            </View>

            <View>
              <Text style={{ fontSize: 14, color: colors.foreground, marginBottom: 4 }}>
                ✅ <Text style={{ fontWeight: "600" }}>アプリのような体験</Text>
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted, marginLeft: 16 }}>
                ネイティブアプリと同じ操作感
              </Text>
            </View>
          </View>
        </View>

        {/* 戻るボタン */}
        <Pressable
          onPress={navigateBack}
          style={({ pressed }) => ({
            backgroundColor: colors.primary,
            paddingVertical: 16,
            borderRadius: 12,
            alignItems: "center",
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Text style={{ color: color.textWhite, fontSize: 16, fontWeight: "600" }}>
            閉じる
          </Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}
