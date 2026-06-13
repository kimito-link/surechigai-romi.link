import { View, Text, StyleSheet, Pressable, Modal, Platform } from "react-native";
import { useState } from "react";
import * as Haptics from "expo-haptics";
import { color, palette } from "@/theme/tokens";
import { LinearGradient } from "expo-linear-gradient";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";
import { AnimatedCard } from "@/components/molecules/animated-pressable";
import { LazyAvatar } from "@/components/molecules/lazy-image";
import { goalTypeConfig } from "@/constants/goal-types";

interface Challenge {
  id: number;
  hostName: string;
  hostUsername: string | null;
  hostProfileImage: string | null;
  hostFollowersCount: number | null;
  hostTwitterId?: string | null;
  hostGender?: "male" | "female" | "unspecified"; // v6.175: 主催者の性別
  title: string;
  description: string | null;
  goalType: string;
  goalValue: number;
  goalUnit: string;
  currentValue: number;
  eventType: string;
  eventDate: Date;
  venue: string | null;
  prefecture: string | null;
  status: string;
}

interface ColorfulChallengeCardProps {
  challenge: Challenge;
  onPress: () => void;
  numColumns?: number;
  width?: number; // px幅（useGridLayoutから渡す）
  colorIndex?: number;
  isFavorite?: boolean;
  onToggleFavorite?: (challengeId: number) => void;
  /** 現在ログイン中のユーザーのTwitter ID（運営者判定用） */
  currentUserTwitterId?: string | null;
  /** 編集ボタン押下時のコールバック */
  onEdit?: (challengeId: number) => void;
  /** 削除ボタン押下時のコールバック */
  onDelete?: (challengeId: number) => void;
}

// 「しゃべった！」風のカラフルなカラーパレット
const CARD_COLORS = [
  { bg: color.accentPrimary, gradient: [color.accentPrimary, color.pink400] }, // ピンク
  { bg: color.danger, gradient: [color.danger, color.red400] }, // 赤
  { bg: color.orange500, gradient: [color.orange500, color.orange400] }, // オレンジ
  { bg: color.yellow500, gradient: [color.yellow500, color.yellow400] }, // 黄色
  { bg: color.teal500, gradient: [color.teal500, color.teal400] }, // ティール
  { bg: color.success, gradient: [color.success, color.green400] }, // 緑
  { bg: color.accentAlt, gradient: [color.accentAlt, color.purple400] }, // 紫
  { bg: color.info, gradient: [color.info, color.blue400] }, // 青
];

// イベントタイプのバッジ
const eventTypeBadge: Record<string, { label: string; color: string }> = {
  solo: { label: "ソロ", color: palette.black + "4D" }, // 30% opacity
  group: { label: "グループ", color: palette.black + "4D" }, // 30% opacity
};

/**
 * カラフルなチャレンジカードコンポーネント
 * 「しゃべった！」アプリを参考にした、鮮やかな色のカード型UI
 * 
 * v6.07: 運営者向け編集・削除機能を追加
 */
export function ColorfulChallengeCard({ 
  challenge, 
  onPress, 
  numColumns = 2,
  width,
  colorIndex,
  isFavorite = false,
  onToggleFavorite,
  currentUserTwitterId,
  onEdit,
  onDelete,
}: ColorfulChallengeCardProps) {
  const colors = useColors();
  const eventDate = new Date(challenge.eventDate);
  const formattedDate = `${eventDate.getMonth() + 1}/${eventDate.getDate()}`;
  
  const progress = Math.min((challenge.currentValue / challenge.goalValue) * 100, 100);
  const goalConfig = goalTypeConfig[challenge.goalType] || goalTypeConfig.custom;
  const typeBadge = eventTypeBadge[challenge.eventType] || eventTypeBadge.solo;
  const unit = challenge.goalUnit || goalConfig.unit;

  // width(px)が来たらそれを使用、来なければ従来互換でフォールバック
  const fallbackCardWidth = numColumns === 3 ? "31%" : numColumns === 2 ? "47%" : "100%";
  const cardWidth = width ?? fallbackCardWidth;
  
  // v6.175: 性別に応じたグラデーション色を優先、なければ従来のカラフルカラー
  let cardColor: { bg: string; gradient: string[] };
  
  if (challenge.hostGender === "male") {
    // 男性: 青系グラデーション
    cardColor = { bg: palette.blue600, gradient: [palette.blue600, palette.blue500, palette.blue400] };
  } else if (challenge.hostGender === "female") {
    // 女性: ピンク系グラデーション
    cardColor = { bg: palette.pink600, gradient: [palette.pink600, palette.pink500, palette.pink500] };
  } else if (challenge.hostGender === "unspecified") {
    // 未指定: グレー系グラデーション
    cardColor = { bg: palette.gray600, gradient: [palette.gray600, palette.gray500, palette.gray400] };
  } else {
    // 性別情報がない場合は従来のカラフルカラーを使用
    const safeId = challenge?.id ?? 0;
    const cardColorIdx = colorIndex !== undefined ? colorIndex : safeId % CARD_COLORS.length;
    cardColor = CARD_COLORS[cardColorIdx] ?? CARD_COLORS[0];
  }

  // 運営者（作成者）かどうかを判定
  const isOwner = currentUserTwitterId && challenge.hostTwitterId === currentUserTwitterId;

  // メニューモーダルの状態
  const [showMenu, setShowMenu] = useState(false);

  const handleMenuPress = () => {
    setShowMenu(true);
  };

  const handleEdit = () => {
    setShowMenu(false);
    onEdit?.(challenge.id);
  };

  const handleDelete = () => {
    setShowMenu(false);
    onDelete?.(challenge.id);
  };

  const triggerHaptic = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  return (
    <>
      <AnimatedCard
        onPress={onPress}
        scaleAmount={0.97}
        style={{
          borderRadius: 16,
          // marginは0にしてgapで管理（FlatListのcolumnWrapperStyleで制御）
          marginBottom: 8, // 行間の余白
          overflow: "hidden",
          width: cardWidth as any,
          // UXガイドライン: 軽いドロップシャドウ
          shadowColor: cardColor.bg,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 5,
        }}
      >
        <LinearGradient
          colors={cardColor.gradient as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        >
          {/* お気に入りアイコン（左上） */}
          <Pressable 
            style={styles.favoriteIcon}
            onPress={(e) => {
              e.stopPropagation?.();
              triggerHaptic();
              onToggleFavorite?.(challenge.id);
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {({ pressed }) => (
              <MaterialIcons 
                name={isFavorite ? "star" : "star-outline"} 
                size={20} 
                color={isFavorite ? color.rankGold : palette.white + "99"} // 60% opacity 
                style={pressed ? { opacity: 0.6 } : undefined}
              />
            )}
          </Pressable>

          {/* メニューアイコン（右上）- 運営者の場合は編集・削除メニューを表示 */}
          <Pressable 
            style={styles.menuIcon}
            onPress={(e) => {
              e.stopPropagation?.();
              if (isOwner) {
                triggerHaptic();
                handleMenuPress();
              }
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {({ pressed }) => (
              <>
                <MaterialIcons 
                  name="more-horiz" 
                  size={20} 
                  color={isOwner ? palette.white + "E6" : palette.white + "99"} // 90% opacity or 60% opacity 
                  style={pressed ? { opacity: 0.6 } : undefined}
                />
                {/* 運営者バッジ */}
                {isOwner && (
                  <View style={styles.ownerBadge}>
                    <Text style={styles.ownerBadgeText}>主催</Text>
                  </View>
                )}
              </>
            )}
          </Pressable>

          {/* メインコンテンツ */}
          <View style={styles.content}>
            {/* タイトル（大きく中央に） */}
            <Text style={styles.title} numberOfLines={2}>
              {challenge.title}
            </Text>

            {/* 作成者情報 */}
            <View style={styles.hostContainer}>
              <LazyAvatar
                source={challenge.hostProfileImage ? { uri: challenge.hostProfileImage } : undefined}
                size={20}
                fallbackColor={palette.white + "4D"} // 30% opacity
                fallbackText={(challenge.hostName || "?").charAt(0)}
              />
              <View style={styles.hostInfo}>
                <Text style={styles.hostName} numberOfLines={1}>
                  {challenge.hostName}
                </Text>
                {challenge.hostUsername && (
                  <Text style={styles.hostUsername} numberOfLines={1}>
                    @{challenge.hostUsername}
                  </Text>
                )}
              </View>
            </View>

            {/* タグ/バッジ（タイプ表示） */}
            <View style={styles.badgeContainer}>
              <View style={[styles.badge, { backgroundColor: typeBadge.color }]}>
                <Text style={styles.badgeText}>{typeBadge.label}</Text>
              </View>
              {challenge.venue && (
                <View style={[styles.badge, { backgroundColor: palette.black + "33" }]}>
                  <MaterialIcons name="place" size={10} color={color.textWhite} />
                  <Text style={[styles.badgeText, { marginLeft: 2 }]} numberOfLines={1}>
                    {challenge.venue}
                  </Text>
                </View>
              )}
            </View>

            {/* 進捗情報 */}
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>
                {challenge.currentValue.toLocaleString()} / {challenge.goalValue.toLocaleString()}{unit}
              </Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${progress}%` }
                  ]} 
                />
              </View>
            </View>

            {/* 日付（右下） */}
            <View style={styles.dateContainer}>
              <MaterialIcons name="event" size={14} color={palette.white + "CC"} />
              <Text style={styles.dateText}>{formattedDate}</Text>
            </View>
          </View>

          {/* コメントアイコン（右下） */}
          <View style={styles.commentIcon}>
            <MaterialIcons name="chat-bubble-outline" size={18} color={palette.white + "99"} />
          </View>
        </LinearGradient>
      </AnimatedCard>

      {/* 運営者向けメニューモーダル */}
      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.menuModal}>
            <Text style={styles.menuTitle}>{challenge.title}</Text>
            <Text style={styles.menuSubtitle}>チャレンジを管理</Text>
            
            <Pressable 
              style={({ pressed }) => [
                styles.menuItem,
                pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] },
              ]}
              onPress={handleEdit}
            >
              <MaterialIcons name="edit" size={24} color={colors.foreground} />
              <Text style={[styles.menuItemText, { color: colors.foreground }]}>編集する</Text>
            </Pressable>
            
            <Pressable 
              style={({ pressed }) => [
                styles.menuItem,
                pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] },
              ]}
              onPress={handleDelete}
            >
              <MaterialIcons name="delete" size={24} color={color.danger} />
              <Text style={[styles.menuItemText, { color: color.danger }]}>削除する</Text>
            </Pressable>
            
            <Pressable 
              style={({ pressed }) => [
                styles.menuItem,
                styles.menuItemCancel,
                pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] },
              ]}
              onPress={() => setShowMenu(false)}
            >
              <Text style={[styles.menuItemText, { color: colors.muted }]}>キャンセル</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  cardGradient: {
    minHeight: 140,
    padding: 16,
    position: "relative",
  },
  favoriteIcon: {
    position: "absolute",
    top: 12,
    left: 12,
  },
  menuIcon: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  ownerBadge: {
    backgroundColor: palette.white + "4D", // 30% opacity
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 4,
  },
  ownerBadgeText: {
    color: color.textWhite,
    fontSize: 12,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 24,
  },
  title: {
    color: color.textWhite,
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
    textShadowColor: palette.black + "33", // 20% opacity
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  badgeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 6,
    marginBottom: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: color.textWhite,
    fontSize: 12,
    fontWeight: "600",
  },
  progressContainer: {
    width: "100%",
    marginTop: 8,
  },
  progressText: {
    color: color.textWhite,
    fontSize: 12,
    textAlign: "center",
    marginBottom: 4,
    fontWeight: "500",
  },
  progressBar: {
    height: 4,
    backgroundColor: palette.white + "4D", // 30% opacity
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: color.textWhite,
    borderRadius: 2,
  },
  dateContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    flexDirection: "row",
    alignItems: "center",
  },
  dateText: {
    color: palette.white + "CC", // 80% opacity
    fontSize: 12,
    marginLeft: 4,
  },
  commentIcon: {
    position: "absolute",
    bottom: 12,
    right: 12,
  },
  hostContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  hostInfo: {
    marginLeft: 6,
    flex: 1,
  },
  hostName: {
    color: palette.white + "E6", // 90% opacity
    fontSize: 12,
    fontWeight: "600",
  },
  hostUsername: {
    color: palette.white + "B3", // 70% opacity
    fontSize: 12,
  },
  // モーダルスタイル
  modalOverlay: {
    flex: 1,
    backgroundColor: palette.black + "80", // 50% opacity
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  menuModal: {
    backgroundColor: color.surface,
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxWidth: 320,
  },
  menuTitle: {
    color: color.textWhite,
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 4,
  },
  menuSubtitle: {
    color: color.textMuted,
    fontSize: 12,
    textAlign: "center",
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: color.bg,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 12,
  },
  menuItemCancel: {
    justifyContent: "center",
    backgroundColor: "transparent",
    marginTop: 8,
  },
});

export default ColorfulChallengeCard;
