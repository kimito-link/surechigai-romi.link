/**
 * ContributionDisplay Component
 * 汎用貢献人数表示
 */

import { View, Text } from "react-native";
import { color } from "@/theme/tokens";
import { useColors } from "@/hooks/use-colors";

export interface ContributionDisplayProps {
  /** 追加人数（友人など） */
  additionalCount: number;
  /** ベース人数（デフォルト: 1 = 自分） */
  baseCount?: number;
  /** ラベルテキスト */
  label?: string;
  /** 単位テキスト */
  unit?: string;
  /** 説明テキストのフォーマット関数 */
  descriptionFormatter?: (base: number, additional: number, total: number) => string;
  /** 説明テキストを表示するかどうか */
  showDescription?: boolean;
}

export function ContributionDisplay({
  additionalCount,
  baseCount = 1,
  label = "貢献人数",
  unit = "人",
  descriptionFormatter,
  showDescription = true,
}: ContributionDisplayProps) {
  const colors = useColors();
  const totalCount = baseCount + additionalCount;
  
  const defaultDescription = `※ 自分 + 友人${additionalCount}人 = ${totalCount}人の貢献になります`;
  const description = descriptionFormatter 
    ? descriptionFormatter(baseCount, additionalCount, totalCount)
    : defaultDescription;
  
  return (
    <>
      {/* メイン表示 */}
      <View style={{
        backgroundColor: colors.background,
        borderRadius: 8,
        padding: 12,
        marginTop: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <Text style={{ color: color.textSecondary, fontSize: 14 }}>
          {label}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "baseline" }}>
          <Text style={{ color: color.accentPrimary, fontSize: 24, fontWeight: "bold" }}>
            {totalCount}
          </Text>
          <Text style={{ color: color.textSecondary, fontSize: 14, marginLeft: 4 }}>
            {unit}
          </Text>
        </View>
      </View>

      {/* 説明テキスト */}
      {showDescription && (
        <Text style={{ color: color.textHint, fontSize: 12, marginTop: 8 }}>
          {description}
        </Text>
      )}
    </>
  );
}
