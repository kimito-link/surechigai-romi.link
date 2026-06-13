import { View, Text, ScrollView, Pressable } from "react-native";
import { commonCopy } from "@/constants/copy/common";
import { color } from "@/theme/tokens";
import { navigateBack } from "@/lib/navigation";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { LoadingIndicator } from "@/components/molecules/loading-screen";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { trpc } from "@/lib/trpc";
import * as Haptics from "expo-haptics";
import { APP_VERSION } from "@/shared/version";

// 変更タイプのアイコンと色
const changeTypeConfig = {
  new: { icon: "new-releases", color: color.accentPrimary, label: "新機能" },
  improve: { icon: "trending-up", color: color.accentAlt, label: "改善" },
  fix: { icon: "build", color: color.warning, label: "修正" },
  change: { icon: "swap-horiz", color: color.textMuted, label: "変更" },
};

export default function ReleaseNotesScreen() {
  const { data: releaseNotes, isLoading } = (trpc as any).releaseNotes.getAll.useQuery();

  return (
    <ScreenContainer>
      <View style={{ backgroundColor: color.surface, borderBottomWidth: 1, borderBottomColor: color.border }}>
        <View style={{ flexDirection: "row", alignItems: "center", padding: 16 }}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigateBack();
            }}
            style={{ flexDirection: "row", alignItems: "center", marginRight: 16 }}
          >
            <MaterialIcons name="arrow-back" size={24} color={color.textPrimary} />
          </Pressable>
          <Text style={{ color: color.textPrimary, fontSize: 20, fontWeight: "bold" }}>アップデート履歴</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        {/* 現在のバージョン */}
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
          <Text style={{ color: color.textMuted, fontSize: 14, marginBottom: 4 }}>現在のバージョン</Text>
          <Text style={{ color: color.textPrimary, fontSize: 24, fontWeight: "bold" }}>{APP_VERSION}</Text>
        </View>

        {/* ローディング */}
        {isLoading && (
          <View style={{ alignItems: "center", padding: 32 }}>
            <LoadingIndicator message="読み込み中..." />
          </View>
        )}

        {/* リリースノート一覧 */}
        {releaseNotes?.map((note: any, index: number) => (
          <View
            key={note.id}
            style={{
              backgroundColor: color.surface,
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: color.border,
            }}
          >
            {/* バージョンと日付 */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <Text style={{ color: color.accentPrimary, fontSize: 18, fontWeight: "bold" }}>{note.version}</Text>
              <Text style={{ color: color.textMuted, fontSize: 14 }}>{note.date}</Text>
            </View>

            {/* タイトル */}
            <Text style={{ color: color.textPrimary, fontSize: 16, fontWeight: "600", marginBottom: 12 }}>{note.title}</Text>

            {/* 変更内容 */}
            {(note.changes as any[]).map((change, changeIndex) => {
              const config = changeTypeConfig[change.type as keyof typeof changeTypeConfig];
              return (
                <View key={changeIndex} style={{ flexDirection: "row", marginBottom: 8, alignItems: "flex-start" }}>
                  <View
                    style={{
                      backgroundColor: `${config.color}20`,
                      borderRadius: 4,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      marginRight: 8,
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <MaterialIcons name={config.icon as any} size={14} color={config.color} />
                    <Text style={{ color: config.color, fontSize: 12, fontWeight: "600", marginLeft: 4 }}>{config.label}</Text>
                  </View>
                  <Text style={{ color: color.textSecondary, fontSize: 14, flex: 1, lineHeight: 20 }}>{change.text}</Text>
                </View>
              );
            })}
          </View>
        ))}

        {/* データがない場合 */}
        {!isLoading && releaseNotes?.length === 0 && (
          <View style={{ alignItems: "center", padding: 32 }}>
            <MaterialIcons name="info-outline" size={48} color={color.textMuted} />
            <Text style={{ color: color.textMuted, marginTop: 16 }}>{commonCopy.empty.noReleaseNotes}</Text>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
