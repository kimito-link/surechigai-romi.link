/**
 * 絵文字をFontAwesomeアイコンに変換するユーティリティコンポーネント
 * 
 * v6.58: UI/UX視認性改善
 * - 絵文字の代わりにFontAwesomeアイコンを使用
 * - モバイルでの視認性向上
 * - 一貫したスタイリング
 */
import { FontAwesome5, FontAwesome6 } from "@expo/vector-icons";
import { View, Text, StyleSheet } from "react-native";
import { color } from "@/theme/tokens";

// 絵文字からFontAwesomeアイコンへのマッピング
const EMOJI_TO_ICON: Record<string, { name: string; family: "fa5" | "fa6"; color?: string }> = {
  // 祝い・達成系
  "🎉": { name: "gift", family: "fa5", color: color.accentAlt },
  "🎊": { name: "gift", family: "fa5", color: color.accentAlt },
  "🏆": { name: "trophy", family: "fa5", color: color.rankGold },
  "🥇": { name: "medal", family: "fa5", color: color.rankGold },
  "🥈": { name: "medal", family: "fa5", color: color.rankSilver },
  "🥉": { name: "medal", family: "fa5", color: color.rankBronze },
  "👑": { name: "crown", family: "fa5", color: color.rankGold },
  
  // 星・評価系
  "⭐": { name: "star", family: "fa5", color: color.accentAlt },
  "🌟": { name: "star", family: "fa5", color: color.accentAlt },
  "✨": { name: "star", family: "fa5", color: color.accentAlt },
  
  // 炎・エネルギー系
  "🔥": { name: "fire", family: "fa5", color: color.accentPrimary },
  "💪": { name: "fist-raised", family: "fa5", color: color.accentPrimary },
  "🚀": { name: "rocket", family: "fa5", color: color.teal500 },
  
  // ターゲット・目標系
  "🎯": { name: "bullseye", family: "fa5", color: color.accentPrimary },
  "📈": { name: "chart-line", family: "fa5", color: color.success },
  "📊": { name: "chart-bar", family: "fa5", color: color.teal500 },
  
  // コミュニケーション系
  "💬": { name: "comment", family: "fa5", color: color.teal500 },
  "💕": { name: "heart", family: "fa5", color: color.danger },
  "💖": { name: "heart", family: "fa5", color: color.danger },
  "💎": { name: "gem", family: "fa5", color: color.teal500 },
  
  // 通知・アラート系
  "🔔": { name: "bell", family: "fa5", color: color.accentAlt },
  "📅": { name: "calendar", family: "fa5", color: color.teal500 },
  "📍": { name: "map-marker-alt", family: "fa5", color: color.accentPrimary },
  "🎫": { name: "ticket-alt", family: "fa5", color: color.accentPrimary },
  
  // ソーシャル系
  "🐦": { name: "twitter", family: "fa5", color: color.twitter },
  "👥": { name: "users", family: "fa5", color: color.teal500 },
  "👤": { name: "user", family: "fa5", color: color.textMuted },
  
  // 音楽・エンタメ系
  "🎵": { name: "music", family: "fa5", color: color.accentAlt },
  "🎤": { name: "microphone", family: "fa5", color: color.accentPrimary },
  
  // その他
  "🥳": { name: "laugh-beam", family: "fa5", color: color.accentAlt },
  "🌈": { name: "rainbow", family: "fa5", color: color.accentAlt },
};

export interface EmojiIconProps {
  /** 絵文字（例: "🎉"） */
  emoji: string;
  /** アイコンサイズ */
  size?: number;
  /** カスタムカラー（指定しない場合はマッピングの色を使用） */
  color?: string;
  /** フォールバック時に絵文字を表示するか */
  fallbackToEmoji?: boolean;
}

/**
 * 絵文字をFontAwesomeアイコンに変換して表示
 * マッピングにない絵文字はそのまま表示
 */
export function EmojiIcon({ 
  emoji, 
  size = 24, 
  color: customColor,
  fallbackToEmoji = true,
}: EmojiIconProps) {
  const mapping = EMOJI_TO_ICON[emoji];
  
  if (!mapping) {
    // マッピングにない場合は絵文字をそのまま表示
    if (fallbackToEmoji) {
      return <Text style={{ fontSize: size, lineHeight: size * 1.2 }}>{emoji}</Text>;
    }
    return null;
  }
  
  const iconColor = customColor || mapping.color || color.textPrimary;
  
  if (mapping.family === "fa6") {
    return <FontAwesome6 name={mapping.name as any} size={size} color={iconColor} />;
  }
  
  return <FontAwesome5 name={mapping.name as any} size={size} color={iconColor} />;
}

/**
 * アイコン付きバッジ（背景色・ボーダー付き）
 */
export interface IconBadgeProps {
  /** 絵文字またはアイコン名 */
  emoji: string;
  /** ラベルテキスト */
  label?: string;
  /** サイズ */
  size?: "small" | "medium" | "large";
  /** バッジの背景色 */
  backgroundColor?: string;
  /** バッジのボーダー色 */
  borderColor?: string;
  /** テキスト色 */
  textColor?: string;
}

export function IconBadge({
  emoji,
  label,
  size = "medium",
  backgroundColor,
  borderColor,
  textColor,
}: IconBadgeProps) {
  const sizeConfig = {
    small: { iconSize: 12, fontSize: 10, paddingH: 6, paddingV: 2 },
    medium: { iconSize: 14, fontSize: 12, paddingH: 8, paddingV: 3 },
    large: { iconSize: 18, fontSize: 14, paddingH: 10, paddingV: 4 },
  };
  
  const config = sizeConfig[size];
  const mapping = EMOJI_TO_ICON[emoji];
  const defaultColor = mapping?.color || color.accentPrimary;
  
  return (
    <View style={[
      styles.badge,
      {
        backgroundColor: backgroundColor || `${defaultColor}20`,
        borderColor: borderColor || `${defaultColor}60`,
        paddingHorizontal: config.paddingH,
        paddingVertical: config.paddingV,
      }
    ]}>
      <EmojiIcon emoji={emoji} size={config.iconSize} color={textColor || defaultColor} />
      {label && (
        <Text style={[
          styles.badgeText,
          { 
            fontSize: config.fontSize, 
            color: textColor || defaultColor,
            marginLeft: 4,
          }
        ]}>
          {label}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeText: {
    fontWeight: "600",
  },
});

// エクスポート: マッピング情報（テスト・デバッグ用）
export const emojiMappings = EMOJI_TO_ICON;
