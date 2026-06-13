/**
 * デフォルメ日本地図コンポーネント
 * 都道府県を四角形で配置し、モバイルで見やすく表示
 */
import { View, Text, Pressable } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { palette } from "@/theme/tokens";
import { PREFECTURE_COLORS } from "@/constants/prefecture-colors";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
} from "react-native-reanimated";
import { useEffect } from "react";

export interface JapanMapDeformedProps {
  /** 都道府県ごとの参加者数 */
  prefectureCounts: Record<string, number>;
  /** 点灯させる都道府県（参加完了時） */
  highlightPrefecture?: string | null;
  /** 都道府県がタップされたときのコールバック */
  onPrefecturePress?: (prefecture: string) => void;
}

/** 都道府県の配置情報 */
interface PrefectureLayout {
  name: string;
  row: number;
  col: number;
  color: string;
}

/** デフォルメ日本地図のレイアウト定義 */
const PREFECTURE_LAYOUT: PrefectureLayout[] = [
  // 北海道・東北（緑系）
  { name: "北海道", row: 0, col: 10, color: PREFECTURE_COLORS["北海道"] },
  { name: "青森", row: 2, col: 10, color: PREFECTURE_COLORS["青森"] },
  { name: "秋田", row: 3, col: 9, color: PREFECTURE_COLORS["秋田"] },
  { name: "岩手", row: 3, col: 10, color: PREFECTURE_COLORS["岩手"] },
  { name: "山形", row: 4, col: 9, color: PREFECTURE_COLORS["山形"] },
  { name: "宮城", row: 4, col: 10, color: PREFECTURE_COLORS["宮城"] },
  { name: "福島", row: 5, col: 10, color: PREFECTURE_COLORS["福島"] },
  
  // 関東（青系）
  { name: "茨城", row: 5, col: 11, color: PREFECTURE_COLORS["茨城"] },
  { name: "栃木", row: 5, col: 10, color: PREFECTURE_COLORS["栃木"] },
  { name: "群馬", row: 5, col: 9, color: PREFECTURE_COLORS["群馬"] },
  { name: "埼玉", row: 6, col: 10, color: PREFECTURE_COLORS["埼玉"] },
  { name: "千葉", row: 6, col: 11, color: PREFECTURE_COLORS["千葉"] },
  { name: "東京", row: 6, col: 10, color: PREFECTURE_COLORS["東京"] },
  { name: "神奈川", row: 7, col: 10, color: PREFECTURE_COLORS["神奈川"] },
  
  // 中部（紫・ピンク系）
  { name: "新潟", row: 4, col: 8, color: PREFECTURE_COLORS["新潟"] },
  { name: "富山", row: 5, col: 7, color: PREFECTURE_COLORS["富山"] },
  { name: "石川", row: 5, col: 6, color: PREFECTURE_COLORS["石川"] },
  { name: "福井", row: 6, col: 6, color: PREFECTURE_COLORS["福井"] },
  { name: "山梨", row: 6, col: 9, color: PREFECTURE_COLORS["山梨"] },
  { name: "長野", row: 5, col: 8, color: PREFECTURE_COLORS["長野"] },
  { name: "岐阜", row: 6, col: 7, color: PREFECTURE_COLORS["岐阜"] },
  { name: "静岡", row: 7, col: 9, color: PREFECTURE_COLORS["静岡"] },
  { name: "愛知", row: 7, col: 8, color: PREFECTURE_COLORS["愛知"] },
  
  // 近畿（ピンク系）
  { name: "三重", row: 7, col: 7, color: PREFECTURE_COLORS["三重"] },
  { name: "滋賀", row: 6, col: 7, color: PREFECTURE_COLORS["滋賀"] },
  { name: "京都", row: 6, col: 6, color: PREFECTURE_COLORS["京都"] },
  { name: "大阪", row: 7, col: 6, color: PREFECTURE_COLORS["大阪"] },
  { name: "兵庫", row: 6, col: 5, color: PREFECTURE_COLORS["兵庫"] },
  { name: "奈良", row: 7, col: 6, color: PREFECTURE_COLORS["奈良"] },
  { name: "和歌山", row: 8, col: 6, color: PREFECTURE_COLORS["和歌山"] },
  
  // 中国（赤系）
  { name: "鳥取", row: 5, col: 5, color: PREFECTURE_COLORS["鳥取"] },
  { name: "島根", row: 6, col: 4, color: PREFECTURE_COLORS["島根"] },
  { name: "岡山", row: 6, col: 5, color: PREFECTURE_COLORS["岡山"] },
  { name: "広島", row: 7, col: 5, color: PREFECTURE_COLORS["広島"] },
  { name: "山口", row: 7, col: 4, color: PREFECTURE_COLORS["山口"] },
  
  // 四国（オレンジ系）
  { name: "徳島", row: 8, col: 6, color: PREFECTURE_COLORS["徳島"] },
  { name: "香川", row: 7, col: 6, color: PREFECTURE_COLORS["香川"] },
  { name: "愛媛", row: 8, col: 5, color: PREFECTURE_COLORS["愛媛"] },
  { name: "高知", row: 9, col: 6, color: PREFECTURE_COLORS["高知"] },
  
  // 九州（黄色系）
  { name: "福岡", row: 7, col: 3, color: PREFECTURE_COLORS["福岡"] },
  { name: "佐賀", row: 8, col: 3, color: PREFECTURE_COLORS["佐賀"] },
  { name: "長崎", row: 8, col: 2, color: PREFECTURE_COLORS["長崎"] },
  { name: "熊本", row: 9, col: 3, color: PREFECTURE_COLORS["熊本"] },
  { name: "大分", row: 8, col: 4, color: PREFECTURE_COLORS["大分"] },
  { name: "宮崎", row: 9, col: 4, color: PREFECTURE_COLORS["宮崎"] },
  { name: "鹿児島", row: 10, col: 3, color: PREFECTURE_COLORS["鹿児島"] },
  { name: "沖縄", row: 12, col: 2, color: PREFECTURE_COLORS["沖縄"] },
];

/** 都道府県セルコンポーネント */
function PrefectureCell({
  prefecture,
  count,
  isHighlighted,
  onPress,
}: {
  prefecture: PrefectureLayout;
  count: number;
  isHighlighted: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  // ハイライト演出
  useEffect(() => {
    if (isHighlighted) {
      scale.value = withSequence(
        withTiming(1.2, { duration: 300 }),
        withTiming(1, { duration: 300 })
      );
      opacity.value = withSequence(
        withTiming(1, { duration: 300 }),
        withTiming(0.7, { duration: 300 })
      );
    }
  }, [isHighlighted, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const hasParticipants = count > 0;
  const backgroundColor = hasParticipants
    ? prefecture.color
    : colors.surface;

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          top: prefecture.row * 32,
          left: prefecture.col * 48,
          width: 44,
          height: 28,
          borderRadius: 4,
          backgroundColor,
          borderWidth: 1,
          borderColor: hasParticipants ? palette.white : colors.border,
          justifyContent: "center",
          alignItems: "center",
          padding: 2,
        },
        animatedStyle,
      ]}
    >
      <Pressable
        onPress={onPress}
        style={{
          width: "100%",
          height: "100%",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text
          style={{
            fontSize: 8,
            fontWeight: "bold",
            color: hasParticipants ? palette.black : colors.muted,
            textAlign: "center",
          }}
          numberOfLines={1}
        >
          {prefecture.name}
        </Text>
        {hasParticipants && (
          <Text
            style={{
              fontSize: 10,
              fontWeight: "bold",
              color: palette.black,
            }}
          >
            {count}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

export function JapanMapDeformed({
  prefectureCounts,
  highlightPrefecture,
  onPrefecturePress,
}: JapanMapDeformedProps) {
  const colors = useColors();

  // 地図の高さを計算（最大row + 余白）
  const maxRow = Math.max(...PREFECTURE_LAYOUT.map((p) => p.row));
  const mapHeight = (maxRow + 2) * 32;

  return (
    <View style={{ marginVertical: 16, paddingHorizontal: 16 }}>
      <Text
        style={{
          color: colors.foreground,
          fontSize: 16,
          fontWeight: "bold",
          marginBottom: 12,
        }}
      >
        都道府県別参加者
      </Text>
      <View
        style={{
          height: mapHeight,
          backgroundColor: colors.surface,
          borderRadius: 12,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {PREFECTURE_LAYOUT.map((prefecture) => {
          const count = prefectureCounts[prefecture.name] || 0;
          const isHighlighted = highlightPrefecture === prefecture.name;

          return (
            <PrefectureCell
              key={prefecture.name}
              prefecture={prefecture}
              count={count}
              isHighlighted={isHighlighted}
              onPress={() => onPrefecturePress?.(prefecture.name)}
            />
          );
        })}
      </View>
    </View>
  );
}
