import { Modal, View, Text, Pressable, StyleSheet, Animated, Platform } from "react-native";
import { color, palette } from "@/theme/tokens";
import { Image } from "expo-image";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { useEffect, useRef, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { shareParticipation } from "@/lib/share";

interface SharePromptModalProps {
  visible: boolean;
  onClose: () => void;
  challengeTitle: string;
  hostName: string;
  challengeId: number;
  // 参加者情報（オプション）
  participantName?: string;
  participantUsername?: string;
  participantImage?: string;
  message?: string;
  contribution?: number;
  // 進捗情報（新規追加）
  currentParticipants?: number;
  goalParticipants?: number;
  participantNumber?: number; // あなたが◯人目
  prefecture?: string;
}

/**
 * 参加表明後のシェア促進モーダル（強化版）
 * - 進捗バー表示
 * - 「あなたが◯人目の参加者です」表示
 * - シェア導線を強化
 */
export function SharePromptModal({
  visible,
  onClose,
  challengeTitle,
  hostName,
  challengeId,
  participantName,
  participantUsername,
  participantImage,
  message,
  contribution,
  currentParticipants = 0,
  goalParticipants = 100,
  participantNumber,
  prefecture,
}: SharePromptModalProps) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [isSharing, setIsSharing] = useState(false);
  const [displayNumber, setDisplayNumber] = useState(0);

  // 進捗率を計算
  const progressPercent = goalParticipants > 0 
    ? Math.min((currentParticipants / goalParticipants) * 100, 100) 
    : 0;

  useEffect(() => {
    if (visible) {
      // ハプティックフィードバック
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // アニメーション開始
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // 進捗バーアニメーション
      Animated.timing(progressAnim, {
        toValue: progressPercent,
        duration: 1000,
        useNativeDriver: false,
      }).start();

      // 参加者番号カウントアップアニメーション
      if (participantNumber) {
        const duration = 1000;
        const startTime = Date.now();
        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
          setDisplayNumber(Math.floor(eased * participantNumber));
          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        };
        animate();
      }
    } else {
      scaleAnim.setValue(0.8);
      opacityAnim.setValue(0);
      progressAnim.setValue(0);
      setDisplayNumber(0);
    }
  }, [visible, scaleAnim, opacityAnim, progressAnim, progressPercent, participantNumber]);

  const handleShare = async () => {
    setIsSharing(true);
    try {
      await shareParticipation(challengeTitle, hostName, challengeId);
      if (Platform.OS !== "web") {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      onClose();
    } finally {
      setIsSharing(false);
    }
  };

  const handleSkip = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onClose();
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          {/* 成功アイコン */}
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={[color.accentPrimary, color.accentAlt]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconGradient}
            >
              <MaterialIcons name="check" size={40} color={color.textWhite} />
            </LinearGradient>
          </View>

          {/* タイトル */}
          <Text style={styles.title}>参加表明完了！</Text>
          <Text style={styles.subtitle}>
            「{challengeTitle}」への参加を表明しました
          </Text>

          {/* あなたが◯人目の参加者です */}
          {participantNumber && (
            <View style={styles.participantNumberContainer}>
              <Text style={styles.participantNumberLabel}>あなたは</Text>
              <View style={styles.participantNumberBadge}>
                <Text style={styles.participantNumberValue}>{displayNumber || participantNumber}</Text>
                <Text style={styles.participantNumberUnit}>人目</Text>
              </View>
              <Text style={styles.participantNumberLabel}>人目の参加予定者です！</Text>
            </View>
          )}

          {/* 進捗バー */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <View style={styles.progressLabelContainer}>
                <FontAwesome5 name="users" size={14} color={color.accentPrimary} />
                <Text style={styles.progressLabel}>現在の参加予定者</Text>
              </View>
              <Text style={styles.progressNumbers}>
                <Text style={styles.progressCurrent}>{currentParticipants}</Text>
                <Text style={styles.progressSeparator}> / </Text>
                <Text style={styles.progressGoal}>{goalParticipants}人</Text>
              </Text>
            </View>
            <View style={styles.progressBarContainer}>
              <Animated.View 
                style={[
                  styles.progressBar, 
                  { width: progressWidth }
                ]} 
              />
            </View>
            <Text style={styles.progressPercent}>
              達成率 {Math.round(progressPercent)}%（参加予定）
            </Text>
          </View>

          {/* 地域表示（オプション） */}
          {prefecture && (
            <View style={styles.prefectureContainer}>
              <FontAwesome5 name="map-marker-alt" size={14} color={color.accentAlt} />
              <Text style={styles.prefectureText}>
                {prefecture}からの参加予定が記録されました
              </Text>
            </View>
          )}

          {/* 参加者情報カード */}
          {participantName && (
            <View style={styles.participantCard}>
              <View style={styles.participantHeader}>
                {participantImage ? (
                  <Image
                    source={{ uri: participantImage }}
                    style={styles.participantAvatar}
                    contentFit="cover"
                  />
                ) : (
                  <View style={[styles.participantAvatar, { backgroundColor: color.accentPrimary }]}>
                    <Text style={styles.avatarText}>{participantName.charAt(0)}</Text>
                  </View>
                )}
                <View style={styles.participantInfo}>
                  <Text style={styles.participantName}>{participantName}</Text>
                  {participantUsername && (
                    <Text style={styles.participantUsername}>@{participantUsername}</Text>
                  )}
                </View>
                {contribution && (
                  <View style={styles.contributionBadge}>
                    <Text style={styles.contributionText}>+{contribution}</Text>
                    <Text style={styles.contributionLabel}>貢献</Text>
                  </View>
                )}
              </View>
              {message && (
                <View style={styles.messageBox}>
                  <Text style={styles.messageText}>{message}</Text>
                </View>
              )}
            </View>
          )}

          {/* シェア促進メッセージ */}
          <View style={styles.messageContainer}>
            <Text style={styles.message}>
              同じ時間を共有する仲間を増やそう！
            </Text>
            <Text style={styles.subMessage}>
              リアルタイムで一緒に盛り上がる仲間を募集中
            </Text>
          </View>

          {/* ボタン */}
          <View style={styles.buttonContainer}>
            <Pressable
              onPress={handleShare}
              disabled={isSharing}
              style={({ pressed }) => [
                styles.shareButton,
                pressed && !isSharing && { opacity: 0.8 },
              ]}
            >
              <LinearGradient
                colors={[palette.black, color.surface]}
                style={styles.shareButtonGradient}
              >
                <Text style={styles.xLogo}>𝕏</Text>
                <Text style={styles.shareButtonText}>
                  {isSharing ? "シェア中..." : "Xでシェアする"}
                </Text>
              </LinearGradient>
            </Pressable>

            <Pressable
              onPress={handleSkip}
              style={({ pressed }) => [
                styles.skipButton,
                pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] },
              ]}
            >
              <Text style={styles.skipButtonText}>今回はスキップ</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: palette.black + "B3", // 70% opacity
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  container: {
    backgroundColor: color.surface,
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
  },
  participantNumberContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 4,
  },
  participantNumberLabel: {
    color: color.textMuted,
    fontSize: 14,
  },
  participantNumberBadge: {
    flexDirection: "row",
    alignItems: "baseline",
    backgroundColor: color.accentPrimary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  participantNumberValue: {
    color: color.textWhite,
    fontSize: 24,
    fontWeight: "bold",
  },
  participantNumberUnit: {
    color: color.textWhite,
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 2,
  },
  progressSection: {
    width: "100%",
    backgroundColor: color.bg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  progressLabel: {
    color: color.textMuted,
    fontSize: 13,
  },
  progressNumbers: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  progressCurrent: {
    color: color.accentPrimary,
    fontSize: 18,
    fontWeight: "bold",
  },
  progressSeparator: {
    color: color.textMuted,
    fontSize: 14,
  },
  progressGoal: {
    color: color.textMuted,
    fontSize: 14,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: color.border,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: color.accentPrimary,
    borderRadius: 4,
  },
  progressPercent: {
    color: color.textSubtle,
    fontSize: 12,
    textAlign: "right",
    marginTop: 4,
  },
  prefectureContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: palette.gold + "1A", // 10% opacity
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  prefectureText: {
    color: color.accentAlt,
    fontSize: 13,
  },
  participantCard: {
    backgroundColor: color.border,
    borderRadius: 12,
    padding: 16,
    width: "100%",
    marginBottom: 16,
  },
  participantHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  participantAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: color.textWhite,
    fontSize: 20,
    fontWeight: "bold",
  },
  participantInfo: {
    flex: 1,
    marginLeft: 12,
  },
  participantName: {
    color: color.textWhite,
    fontSize: 16,
    fontWeight: "600",
  },
  participantUsername: {
    color: color.hostAccentLegacy,
    fontSize: 14,
  },
  contributionBadge: {
    alignItems: "center",
  },
  contributionText: {
    color: color.accentPrimary,
    fontSize: 24,
    fontWeight: "bold",
  },
  contributionLabel: {
    color: color.textSubtle,
    fontSize: 12,
  },
  messageBox: {
    backgroundColor: color.surface,
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  messageText: {
    color: color.textPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
  iconContainer: {
    marginBottom: 16,
  },
  iconGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: color.textWhite,
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    color: color.textMuted,
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
  messageContainer: {
    backgroundColor: color.bg,
    borderRadius: 12,
    padding: 16,
    width: "100%",
    marginBottom: 20,
  },
  message: {
    color: color.textWhite,
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 4,
  },
  subMessage: {
    color: color.textMuted,
    fontSize: 13,
    textAlign: "center",
  },
  buttonContainer: {
    width: "100%",
    gap: 12,
  },
  shareButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  shareButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 8,
  },
  xLogo: {
    color: color.textWhite,
    fontSize: 18,
    fontWeight: "bold",
  },
  shareButtonText: {
    color: color.textWhite,
    fontSize: 16,
    fontWeight: "600",
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  skipButtonText: {
    color: color.textSubtle,
    fontSize: 14,
  },
});
