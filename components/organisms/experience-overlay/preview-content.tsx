/**
 * experience-overlay/preview-content.tsx
 * 
 * 経験値オーバーレイのプレビューコンテンツコンポーネント
 * 26種類のプレビュータイプを描画
 */
import { View, Text, Pressable } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { color } from "@/theme/tokens";
import { ExperienceSlide } from "@/lib/experience-context";
import { styles } from "./preview-content.styles";

interface PreviewContentProps {
  type: ExperienceSlide["previewType"];
}

export function PreviewContent({ type }: PreviewContentProps) {
  switch (type) {
    case "map":
      return (
        <View style={styles.previewContainer}>
          <View style={styles.mapPreview}>
            <View style={styles.mapHeader}>
              <Text style={styles.mapTitle}>地域別参加者</Text>
            </View>
            <View style={styles.mapGrid}>
              <View style={[styles.mapRegion, { backgroundColor: color.accentPrimary }]}>
                <Text style={styles.mapRegionName}>東京</Text>
                <Text style={styles.mapRegionCount}>25人</Text>
              </View>
              <View style={[styles.mapRegion, { backgroundColor: color.accentAlt }]}>
                <Text style={styles.mapRegionName}>大阪</Text>
                <Text style={styles.mapRegionCount}>18人</Text>
              </View>
              <View style={[styles.mapRegion, { backgroundColor: color.info }]}>
                <Text style={styles.mapRegionName}>福岡</Text>
                <Text style={styles.mapRegionCount}>12人</Text>
              </View>
              <View style={[styles.mapRegion, { backgroundColor: color.successDark }]}>
                <Text style={styles.mapRegionName}>北海道</Text>
                <Text style={styles.mapRegionCount}>8人</Text>
              </View>
            </View>
          </View>
        </View>
      );
    case "participants":
      return (
        <View style={styles.previewContainer}>
          <View style={styles.participantRow}>
            <View style={styles.participantCard}>
              <View style={[styles.participantAvatar, { backgroundColor: color.accentPrimary }]}>
                <Text style={styles.participantInitial}>田</Text>
              </View>
              <Text style={styles.participantName}>田中さん</Text>
              <Text style={styles.participantPref}>東京都</Text>
            </View>
            <View style={styles.participantCard}>
              <View style={[styles.participantAvatar, { backgroundColor: color.accentAlt }]}>
                <Text style={styles.participantInitial}>佐</Text>
              </View>
              <Text style={styles.participantName}>佐藤さん</Text>
              <Text style={styles.participantPref}>千葉県</Text>
            </View>
            <View style={styles.participantCard}>
              <View style={[styles.participantAvatar, { backgroundColor: color.info }]}>
                <Text style={styles.participantInitial}>鈴</Text>
              </View>
              <Text style={styles.participantName}>鈴木さん</Text>
              <Text style={styles.participantPref}>福岡県</Text>
            </View>
          </View>
        </View>
      );
    case "chart":
      return (
        <View style={styles.previewContainer}>
          <View style={styles.chartPreview}>
            <Text style={styles.chartTitle}>カテゴリ別チャレンジ</Text>
            <View style={styles.chartBars}>
              <View style={styles.chartBarItem}>
                <View style={[styles.chartBarFill, { height: 60, backgroundColor: color.accentPrimary }]} />
                <Text style={styles.chartBarLabel}>アイドル</Text>
              </View>
              <View style={styles.chartBarItem}>
                <View style={[styles.chartBarFill, { height: 45, backgroundColor: color.accentAlt }]} />
                <Text style={styles.chartBarLabel}>バンド</Text>
              </View>
              <View style={styles.chartBarItem}>
                <View style={[styles.chartBarFill, { height: 35, backgroundColor: color.info }]} />
                <Text style={styles.chartBarLabel}>VTuber</Text>
              </View>
              <View style={styles.chartBarItem}>
                <View style={[styles.chartBarFill, { height: 25, backgroundColor: color.successDark }]} />
                <Text style={styles.chartBarLabel}>その他</Text>
              </View>
            </View>
          </View>
        </View>
      );
    case "notification":
      return (
        <View style={styles.notificationPreview}>
          <View style={styles.notificationIconContainer}>
            <Text style={styles.notificationIconText}>🔔</Text>
          </View>
          <View style={styles.notificationContent}>
            <Text style={styles.notificationTitle}>動員ちゃれんじ</Text>
            <Text style={styles.notificationBody}>推しの新しいチャレンジが始まりました！</Text>
            <Text style={styles.notificationTime}>たった今</Text>
          </View>
        </View>
      );
    case "crown":
      return (
        <View style={styles.previewContainer}>
          <View style={styles.badgePreview}>
            <View style={styles.crownIcon}>
              <Text style={styles.crownEmoji}>👑</Text>
            </View>
            <Text style={styles.badgeTitle}>常連ファンバッジ</Text>
            <Text style={styles.badgeDesc}>5回以上参加で獲得！</Text>
          </View>
        </View>
      );
    case "comment":
      return (
        <View style={styles.commentPreview}>
          <View style={styles.commentHeader}>
            <View style={[styles.commentAvatar, { backgroundColor: color.accentPrimary }]}>
              <Text style={styles.commentAvatarText}>M</Text>
            </View>
            <View>
              <Text style={styles.commentName}>@music_lover</Text>
              <Text style={styles.commentTime}>2時間前</Text>
            </View>
          </View>
          <Text style={styles.commentText}>「今回のライブ、絶対行く！チェキ会も楽しみ！推しに会えるの待ちきれない〜💕」</Text>
        </View>
      );
    case "invite":
      return (
        <View style={styles.previewContainer}>
          <View style={styles.invitePreview}>
            <Text style={styles.inviteTitle}>友達を誘う</Text>
            <View style={styles.inviteCounter}>
              <Pressable style={styles.inviteButton}>
                <Text style={styles.inviteButtonText}>−</Text>
              </Pressable>
              <Text style={styles.inviteCount}>3人</Text>
              <Pressable style={[styles.inviteButton, styles.inviteButtonActive]}>
                <Text style={[styles.inviteButtonText, styles.inviteButtonTextActive]}>＋</Text>
              </Pressable>
            </View>
            <Text style={styles.inviteDesc}>一緒に参加する友達の人数</Text>
          </View>
        </View>
      );
    case "form":
      return (
        <View style={styles.formPreview}>
          <View style={styles.formField}>
            <Text style={styles.formLabel}>応援メッセージ</Text>
            <View style={styles.formInput}>
              <Text style={styles.formInputText}>今回も全力で応援します！楽しみにしてます！</Text>
            </View>
          </View>
          <View style={styles.formField}>
            <Text style={styles.formLabel}>参加する都道府県</Text>
            <View style={styles.formSelect}>
              <Text style={styles.formSelectText}>福岡県</Text>
              <Text style={styles.formSelectArrow}>▼</Text>
            </View>
          </View>
        </View>
      );
    case "prefecture":
      return (
        <View style={styles.previewContainer}>
          <Text style={styles.prefectureTitle}>参加する都道府県を選択</Text>
          <View style={styles.prefectureGrid}>
            <View style={styles.prefectureButton}>
              <Text style={styles.prefectureText}>東京都</Text>
            </View>
            <View style={styles.prefectureButton}>
              <Text style={styles.prefectureText}>大阪府</Text>
            </View>
            <View style={[styles.prefectureButton, styles.prefectureButtonSelected]}>
              <Text style={styles.prefectureTextSelected}>福岡県 ✓</Text>
            </View>
            <View style={styles.prefectureButton}>
              <Text style={styles.prefectureText}>北海道</Text>
            </View>
          </View>
        </View>
      );
    case "profile":
      return (
        <View style={styles.profilePreview}>
          <View style={styles.profileHeader}>
            <View style={[styles.profileAvatar, { backgroundColor: color.accentAlt }]}>
              <Text style={styles.profileAvatarText}>M</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>@music_lover_123</Text>
              <Text style={styles.profileBio}>音楽好き / 推し活 / ライブ参戦</Text>
              <Text style={styles.profileFollowers}>フォロワー 1,234人</Text>
            </View>
          </View>
          <View style={styles.followButton}>
            <Text style={styles.followButtonText}>フォローする</Text>
          </View>
        </View>
      );
    case "influencer":
      return (
        <View style={styles.profilePreview}>
          <View style={styles.profileHeader}>
            <View style={[styles.profileAvatar, { backgroundColor: color.rankGold }]}>
              <Text style={styles.profileAvatarText}>S</Text>
            </View>
            <View style={styles.profileInfo}>
              <View style={styles.influencerBadge}>
                <Text style={styles.influencerBadgeText}>👑 インフルエンサー</Text>
              </View>
              <Text style={styles.profileName}>@super_fan_2024</Text>
              <Text style={styles.profileFollowers}>フォロワー 12,500人</Text>
            </View>
          </View>
          <View style={[styles.followButton, { backgroundColor: color.rankGold }]}>
            <Text style={[styles.followButtonText, { color: color.overlayDark }]}>フォローする</Text>
          </View>
        </View>
      );
    case "gender":
      return (
        <View style={styles.genderPreview}>
          <Text style={styles.genderTitle}>参加者の男女比</Text>
          <View style={styles.genderChart}>
            <View style={[styles.genderBar, { flex: 6, backgroundColor: color.info }]}>
              <Text style={styles.genderText}>男性 60%</Text>
            </View>
            <View style={[styles.genderBar, { flex: 4, backgroundColor: color.accentPrimary }]}>
              <Text style={styles.genderText}>女性 40%</Text>
            </View>
          </View>
          <View style={styles.genderLegend}>
            <View style={styles.genderLegendItem}>
              <View style={[styles.genderLegendDot, { backgroundColor: color.info }]} />
              <Text style={styles.genderLegendText}>男性: 60人</Text>
            </View>
            <View style={styles.genderLegendItem}>
              <View style={[styles.genderLegendDot, { backgroundColor: color.accentPrimary }]} />
              <Text style={styles.genderLegendText}>女性: 40人</Text>
            </View>
          </View>
        </View>
      );
    
    // 新しいプレビュータイプ
    case "challenge-card":
      return (
        <View style={styles.challengeCardPreview}>
          <View style={styles.challengeCardHeader}>
            <Text style={styles.challengeCardCategory}>🎤 アイドル</Text>
            <Text style={styles.challengeCardDays}>あと7日</Text>
          </View>
          <Text style={styles.challengeCardTitle}>りんくの100人動員チャレンジ</Text>
          <View style={styles.challengeCardHost}>
            <View style={[styles.challengeCardAvatar, { backgroundColor: color.accentPrimary }]}>
              <Text style={styles.challengeCardAvatarText}>り</Text>
            </View>
            <Text style={styles.challengeCardHostName}>@kimito_link</Text>
          </View>
          <View style={styles.challengeCardProgress}>
            <View style={styles.challengeCardProgressBar}>
              <View style={[styles.challengeCardProgressFill, { width: "65%" }]} />
            </View>
            <Text style={styles.challengeCardProgressText}>65 / 100人</Text>
          </View>
        </View>
      );
    case "progress-bar":
      return (
        <View style={styles.progressBarPreview}>
          <Text style={styles.progressBarTitle}>目標達成状況</Text>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarTrack}>
              <Animated.View 
                entering={FadeIn.duration(500)}
                style={[styles.progressBarFill, { width: "65%" }]} 
              />
            </View>
            <View style={styles.progressBarLabels}>
              <Text style={styles.progressBarCurrent}>65人</Text>
              <Text style={styles.progressBarGoal}>/ 100人</Text>
            </View>
          </View>
          <View style={styles.progressBarMilestones}>
            <View style={[styles.progressBarMilestone, styles.progressBarMilestoneCompleted]}>
              <Text style={styles.progressBarMilestoneText}>25%</Text>
            </View>
            <View style={[styles.progressBarMilestone, styles.progressBarMilestoneCompleted]}>
              <Text style={styles.progressBarMilestoneText}>50%</Text>
            </View>
            <View style={styles.progressBarMilestone}>
              <Text style={styles.progressBarMilestoneText}>75%</Text>
            </View>
            <View style={styles.progressBarMilestone}>
              <Text style={styles.progressBarMilestoneText}>100%</Text>
            </View>
          </View>
        </View>
      );
    case "countdown":
      return (
        <View style={styles.countdownPreview}>
          <Text style={styles.countdownTitle}>イベントまであと</Text>
          <View style={styles.countdownNumbers}>
            <View style={styles.countdownItem}>
              <Text style={styles.countdownNumber}>7</Text>
              <Text style={styles.countdownLabel}>日</Text>
            </View>
            <Text style={styles.countdownSeparator}>:</Text>
            <View style={styles.countdownItem}>
              <Text style={styles.countdownNumber}>12</Text>
              <Text style={styles.countdownLabel}>時間</Text>
            </View>
            <Text style={styles.countdownSeparator}>:</Text>
            <View style={styles.countdownItem}>
              <Text style={styles.countdownNumber}>34</Text>
              <Text style={styles.countdownLabel}>分</Text>
            </View>
          </View>
          <Text style={styles.countdownDate}>2026年1月26日(日) 18:00開演</Text>
        </View>
      );
    case "achievement":
      return (
        <View style={styles.achievementPreview}>
          <View style={styles.achievementIcon}>
            <Text style={styles.achievementEmoji}>🏆</Text>
          </View>
          <Text style={styles.achievementTitle}>達成記念ページ</Text>
          <Text style={styles.achievementDesc}>参加者100人の名前が掲載されます</Text>
          <View style={styles.achievementNames}>
            <Text style={styles.achievementName}>田中さん</Text>
            <Text style={styles.achievementName}>佐藤さん</Text>
            <Text style={styles.achievementName}>鈴木さん</Text>
            <Text style={styles.achievementMore}>...他97人</Text>
          </View>
        </View>
      );
    case "share":
      return (
        <View style={styles.sharePreview}>
          <Text style={styles.shareTitle}>SNSでシェア</Text>
          <View style={styles.shareButtons}>
            <View style={[styles.shareButton, { backgroundColor: color.twitter }]}>
              <Text style={styles.shareButtonText}>𝕏 でシェア</Text>
            </View>
            <View style={[styles.shareButton, { backgroundColor: color.line }]}>
              <Text style={styles.shareButtonText}>LINE</Text>
            </View>
          </View>
          <View style={styles.shareCard}>
            <Text style={styles.shareCardText}>「りんくの100人動員チャレンジに参加しました！🎉」</Text>
          </View>
        </View>
      );
    case "ranking":
      return (
        <View style={styles.rankingPreview}>
          <Text style={styles.rankingTitle}>貢献度ランキング</Text>
          <View style={styles.rankingList}>
            <View style={styles.rankingItem}>
              <Text style={styles.rankingPosition}>🥇</Text>
              <View style={[styles.rankingAvatar, { backgroundColor: color.rankGold }]}>
                <Text style={styles.rankingAvatarText}>S</Text>
              </View>
              <Text style={styles.rankingName}>@super_fan</Text>
              <Text style={styles.rankingScore}>+15人</Text>
            </View>
            <View style={styles.rankingItem}>
              <Text style={styles.rankingPosition}>🥈</Text>
              <View style={[styles.rankingAvatar, { backgroundColor: color.rankSilver }]}>
                <Text style={styles.rankingAvatarText}>M</Text>
              </View>
              <Text style={styles.rankingName}>@music_lover</Text>
              <Text style={styles.rankingScore}>+8人</Text>
            </View>
            <View style={[styles.rankingItem, styles.rankingItemHighlight]}>
              <Text style={styles.rankingPosition}>5</Text>
              <View style={[styles.rankingAvatar, { backgroundColor: color.accentPrimary }]}>
                <Text style={styles.rankingAvatarText}>あ</Text>
              </View>
              <Text style={styles.rankingName}>あなた</Text>
              <Text style={styles.rankingScore}>+3人</Text>
            </View>
          </View>
        </View>
      );
    case "dm":
      return (
        <View style={styles.dmPreview}>
          <Text style={styles.dmTitle}>ダイレクトメッセージ</Text>
          <View style={styles.dmMessages}>
            <View style={styles.dmMessageReceived}>
              <Text style={styles.dmMessageText}>福岡から参加するんですね！私も福岡です😊</Text>
            </View>
            <View style={styles.dmMessageSent}>
              <Text style={styles.dmMessageText}>そうなんです！一緒に遠征しませんか？</Text>
            </View>
            <View style={styles.dmMessageReceived}>
              <Text style={styles.dmMessageText}>ぜひ！新幹線で行く予定です🚄</Text>
            </View>
          </View>
        </View>
      );
    case "reminder":
      return (
        <View style={styles.reminderPreview}>
          <Text style={styles.reminderTitle}>リマインダー設定</Text>
          <View style={styles.reminderOptions}>
            <View style={styles.reminderOption}>
              <Text style={styles.reminderOptionText}>1日前</Text>
              <View style={[styles.reminderToggle, styles.reminderToggleOn]}>
                <View style={styles.reminderToggleKnob} />
              </View>
            </View>
            <View style={styles.reminderOption}>
              <Text style={styles.reminderOptionText}>3時間前</Text>
              <View style={[styles.reminderToggle, styles.reminderToggleOn]}>
                <View style={styles.reminderToggleKnob} />
              </View>
            </View>
            <View style={styles.reminderOption}>
              <Text style={styles.reminderOptionText}>1時間前</Text>
              <View style={styles.reminderToggle}>
                <View style={styles.reminderToggleKnob} />
              </View>
            </View>
          </View>
        </View>
      );
    case "ticket":
      return (
        <View style={styles.ticketPreview}>
          <Text style={styles.ticketTitle}>チケット情報</Text>
          <View style={styles.ticketList}>
            <View style={styles.ticketItem}>
              <Text style={styles.ticketType}>前売り券</Text>
              <Text style={styles.ticketPrice}>¥3,000</Text>
            </View>
            <View style={styles.ticketItem}>
              <Text style={styles.ticketType}>当日券</Text>
              <Text style={styles.ticketPrice}>¥3,500</Text>
            </View>
          </View>
          <View style={styles.ticketButton}>
            <Text style={styles.ticketButtonText}>チケットを購入する →</Text>
          </View>
        </View>
      );
    case "cheer":
      return (
        <View style={styles.cheerPreview}>
          <Text style={styles.cheerTitle}>エールを送る</Text>
          <View style={styles.cheerButtons}>
            <View style={styles.cheerButton}>
              <Text style={styles.cheerEmoji}>👏</Text>
              <Text style={styles.cheerCount}>24</Text>
            </View>
            <View style={styles.cheerButton}>
              <Text style={styles.cheerEmoji}>❤️</Text>
              <Text style={styles.cheerCount}>56</Text>
            </View>
            <View style={styles.cheerButton}>
              <Text style={styles.cheerEmoji}>🔥</Text>
              <Text style={styles.cheerCount}>18</Text>
            </View>
            <View style={styles.cheerButton}>
              <Text style={styles.cheerEmoji}>✨</Text>
              <Text style={styles.cheerCount}>32</Text>
            </View>
          </View>
        </View>
      );
    case "badge":
      return (
        <View style={styles.badgePreview}>
          <Text style={styles.badgeTitle}>獲得バッジ</Text>
          <View style={styles.badgeGrid}>
            <View style={styles.badgeItem}>
              <Text style={styles.badgeEmoji}>🎉</Text>
              <Text style={styles.badgeName}>初参加</Text>
            </View>
            <View style={styles.badgeItem}>
              <Text style={styles.badgeEmoji}>🌟</Text>
              <Text style={styles.badgeName}>連続参加</Text>
            </View>
            <View style={styles.badgeItem}>
              <Text style={styles.badgeEmoji}>👑</Text>
              <Text style={styles.badgeName}>常連ファン</Text>
            </View>
            <View style={[styles.badgeItem, styles.badgeItemLocked]}>
              <Text style={styles.badgeEmoji}>🏆</Text>
              <Text style={styles.badgeName}>???</Text>
            </View>
          </View>
        </View>
      );
    case "stats":
      return (
        <View style={styles.statsPreview}>
          <Text style={styles.statsTitle}>統計ダッシュボード</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statsItem}>
              <Text style={styles.statsValue}>65</Text>
              <Text style={styles.statsLabel}>参加者数</Text>
            </View>
            <View style={styles.statsItem}>
              <Text style={styles.statsValue}>12</Text>
              <Text style={styles.statsLabel}>都道府県</Text>
            </View>
            <View style={styles.statsItem}>
              <Text style={styles.statsValue}>156</Text>
              <Text style={styles.statsLabel}>エール数</Text>
            </View>
            <View style={styles.statsItem}>
              <Text style={styles.statsValue}>89%</Text>
              <Text style={styles.statsLabel}>リピート率</Text>
            </View>
          </View>
        </View>
      );
    case "celebration":
      return (
        <View style={styles.celebrationPreview}>
          <Text style={styles.celebrationEmoji}>🎉</Text>
          <Text style={styles.celebrationTitle}>目標達成！</Text>
          <Text style={styles.celebrationSubtitle}>100人の参加表明が集まりました！</Text>
          <View style={styles.celebrationConfetti}>
            <Text style={styles.confettiItem}>🎊</Text>
            <Text style={styles.confettiItem}>✨</Text>
            <Text style={styles.confettiItem}>🎉</Text>
            <Text style={styles.confettiItem}>🌟</Text>
          </View>
        </View>
      );
    default:
      return null;
  }
}
