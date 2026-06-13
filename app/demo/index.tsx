/**
 * デモチャレンジ体験画面
 *
 * ログインなしでチャレンジ参加を体験できる
 */

import { useEffect } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { navigate } from "@/lib/navigation/app-routes";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { DoinAnimation } from "@/components/molecules/doin-animation";
import { useColors } from "@/hooks/use-colors";
import { useDemoChallenge } from "@/features/demo/hooks/use-demo-challenge";
import { useDemoAnimations } from "@/features/demo/hooks/use-demo-animations";
import {
  DemoBanner,
  DemoChallengeCard,
  DemoJoinSection,
  DemoParticipantsList,
  DemoLoginPrompt,
} from "@/features/demo/components";

export default function DemoScreen() {
  const colors = useColors();

  const {
    challenge,
    loading,
    joining,
    showConfetti,
    error,
    loadChallenge,
    handleJoin,
    handleAddContribution,
    handleReset,
  } = useDemoChallenge();

  const animations = useDemoAnimations();

  useEffect(() => {
    if (!challenge) return;
    const progress = (challenge.currentValue / challenge.goalValue) * 100;
    animations.animateProgress(progress);
  }, [challenge?.currentValue, challenge?.goalValue]);

  const handleJoinWithAnimation = async () => {
    if (!challenge) return;
    const nextProgress = ((challenge.currentValue + 1) / challenge.goalValue) * 100;
    animations.animateJoin(nextProgress);
    await handleJoin();
  };

  const handleContributionWithAnimation = async () => {
    if (!challenge) return;
    const nextProgress = ((challenge.currentValue + 1) / challenge.goalValue) * 100;
    animations.animateContribution(nextProgress);
    await handleAddContribution();
  };

  const handleResetWithAnimation = async () => {
    animations.resetProgress();
    await handleReset();
  };

  if (loading) {
    return (
      <ScreenContainer style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.muted }]}>デモを読み込み中...</Text>
      </ScreenContainer>
    );
  }

  if (error || !challenge) {
    return (
      <ScreenContainer style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
        <Text style={[styles.errorText, { color: colors.foreground }]}>
          {error ?? "デモデータの取得に失敗しました"}
        </Text>
        <Pressable
          onPress={loadChallenge}
          accessibilityRole="button"
          accessibilityLabel="デモデータを再読み込みする"
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.retryButtonText}>再試行</Text>
        </Pressable>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <DoinAnimation visible={showConfetti} showConfetti />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <DemoBanner onReset={handleResetWithAnimation} />

        <DemoChallengeCard
          challenge={challenge}
          animations={{ progressAnimatedStyle: animations.progressAnimatedStyle, numberAnimatedStyle: animations.numberAnimatedStyle }}
        />

        <View style={[styles.descriptionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={{ color: colors.foreground }}>{challenge.description}</Text>
        </View>

        <DemoJoinSection
          hasJoined={challenge.userState.hasJoined}
          contribution={challenge.userState.contribution}
          joining={joining}
          onJoin={handleJoinWithAnimation}
          onAddContribution={handleContributionWithAnimation}
          animations={{ buttonAnimatedStyle: animations.buttonAnimatedStyle, celebrationAnimatedStyle: animations.celebrationAnimatedStyle }}
        />

        <DemoParticipantsList
          participants={challenge.participants}
          total={challenge.participants.length}
        />

        <DemoLoginPrompt onLogin={() => navigate.toHome()} />

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 16,
  },
  errorText: {
    marginTop: 16,
    textAlign: "center",
    marginHorizontal: 24,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "#ffffff",
    fontWeight: "bold",
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  descriptionCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  bottomSpacer: {
    height: 80,
  },
});
