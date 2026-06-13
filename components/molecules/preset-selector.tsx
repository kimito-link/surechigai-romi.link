/**
 * プリセット選択コンポーネント
 * 
 * チャレンジ作成画面でワンタップでプリセットを適用できるUI
 */

import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
} from "react-native";
import { FontAwesome6 } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/use-colors";
import { CHALLENGE_PRESETS, type ChallengePreset } from "@/constants/challenge-presets";

interface PresetSelectorProps {
  selectedPresetId: string | null;
  onSelectPreset: (preset: ChallengePreset) => void;
}

export function PresetSelector({
  selectedPresetId,
  onSelectPreset,
}: PresetSelectorProps) {
  const colors = useColors();
  const [expanded, setExpanded] = useState(false);

  const handleSelect = (preset: ChallengePreset) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onSelectPreset(preset);
    setExpanded(false);
  };

  const selectedPreset = CHALLENGE_PRESETS.find(p => p.id === selectedPresetId);

  // アイコンマッピング
  const getIconName = (icon: string): string => {
    const iconMap: Record<string, string> = {
      music: "music",
      guitar: "guitar",
      star: "star",
      video: "video",
      play: "play",
      users: "users",
      "people-group": "people-group",
      "user-plus": "user-plus",
      sliders: "sliders",
    };
    return iconMap[icon] || "circle";
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.foreground }]}>
        📋 かんたん設定
      </Text>
      <Text style={[styles.hint, { color: colors.muted }]}>
        よく使う設定をワンタップで適用
      </Text>

      {/* 選択済みプリセット表示 / 選択ボタン */}
      <Pressable
        style={[
          styles.selectedBox,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
        onPress={() => setExpanded(!expanded)}
      >
        {selectedPreset ? (
          <View style={styles.selectedContent}>
            <FontAwesome6
              name={getIconName(selectedPreset.icon) as any}
              size={20}
              color={colors.primary}
            />
            <View style={styles.selectedText}>
              <Text style={[styles.selectedName, { color: colors.foreground }]}>
                {selectedPreset.name}
              </Text>
              <Text style={[styles.selectedDesc, { color: colors.muted }]}>
                {selectedPreset.description}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.selectedContent}>
            <FontAwesome6 name="wand-magic-sparkles" size={20} color={colors.primary} />
            <Text style={[styles.placeholderText, { color: colors.muted }]}>
              タップしてプリセットを選択
            </Text>
          </View>
        )}
        <FontAwesome6
          name={expanded ? "chevron-up" : "chevron-down"}
          size={14}
          color={colors.muted}
        />
      </Pressable>

      {/* プリセット一覧 */}
      {expanded && (
        <View style={[styles.presetList, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <ScrollView style={styles.scrollView} nestedScrollEnabled>
            {CHALLENGE_PRESETS.map((preset) => (
              <Pressable
                key={preset.id}
                style={[
                  styles.presetItem,
                  { borderBottomColor: colors.border },
                  selectedPresetId === preset.id && { backgroundColor: colors.primary + "15" },
                ]}
                onPress={() => handleSelect(preset)}
              >
                <View style={[styles.presetIcon, { backgroundColor: colors.primary + "20" }]}>
                  <FontAwesome6
                    name={getIconName(preset.icon) as any}
                    size={16}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.presetContent}>
                  <Text style={[styles.presetName, { color: colors.foreground }]}>
                    {preset.name}
                  </Text>
                  <Text style={[styles.presetDesc, { color: colors.muted }]}>
                    {preset.description}
                  </Text>
                  <View style={styles.presetMeta}>
                    <Text style={[styles.presetMetaText, { color: colors.primary }]}>
                      目標: {preset.goalValue}{preset.goalUnit}
                    </Text>
                    {preset.suggestedTicketPresale && (
                      <Text style={[styles.presetMetaText, { color: colors.muted }]}>
                        前売: ¥{preset.suggestedTicketPresale.toLocaleString()}
                      </Text>
                    )}
                  </View>
                </View>
                {selectedPresetId === preset.id && (
                  <FontAwesome6 name="check" size={16} color={colors.primary} />
                )}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  hint: {
    fontSize: 12,
    marginBottom: 12,
  },
  selectedBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  selectedContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  selectedText: {
    flex: 1,
  },
  selectedName: {
    fontSize: 15,
    fontWeight: "600",
  },
  selectedDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  placeholderText: {
    fontSize: 14,
  },
  presetList: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    maxHeight: 300,
    overflow: "hidden",
  },
  scrollView: {
    maxHeight: 300,
  },
  presetItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  presetIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  presetContent: {
    flex: 1,
  },
  presetName: {
    fontSize: 14,
    fontWeight: "600",
  },
  presetDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  presetMeta: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  presetMetaText: {
    fontSize: 12,
  },
});
