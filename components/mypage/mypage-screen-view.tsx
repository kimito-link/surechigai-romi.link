/**
 * mypage-authenticated-screen.tsx から切り出した見た目(JSX)専用コンポーネント。
 * 状態機械・useEffectの順序・見た目は一切変えていない
 * (refactor-instructions.md Phase 7 Debt #11)。
 * 呼び出し側(MypageAuthenticatedScreen)が持つ状態・ハンドラーをそのまま
 * propsとして受け取り、351-676行にあったJSXをそのまま配置する。
 */
import {
  View,
  Text,
  ScrollView,
  Linking,
  Pressable,
  Switch,
} from "react-native";
import { Image } from "expo-image";
import MaterialIcons from "@/lib/icons/material-icons";
import appConfig from "@/app.config.json";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { TabScreenHeader } from "@/components/organisms/tab-screen-header";
import { MySignalSummary } from "@/components/dashboard/my-signal-summary";
import { SponsorSlot } from "@/components/molecules/sponsor-slot";
import { MypageActionList } from "@/components/dashboard/mypage-action-list";
import { LatestFootprintCard } from "@/components/dashboard/latest-footprint-card";
import { HostEventsSummary } from "@/components/dashboard/host-events-summary";
import { XLinkRescueCard } from "@/components/dashboard/x-link-rescue-card";
import {
  SwitchXAccountModal,
  SwitchXAccountResultNotice,
} from "@/components/auth/switch-x-account-modal";
import type { ShareTarget } from "@/lib/share";
import { color, palette } from "@/theme/tokens";
import { navigate } from "@/lib/navigation";
import {
  TRAIL_VISIBILITY_VALUES,
  trailVisibilityDescription,
  trailVisibilityLabel,
  type TrailVisibility,
} from "@/modules/encounter/core/trail-visibility";
import { LocationPauseControl } from "@/components/mypage/location-pause-control";
import { DeleteAccountControl } from "@/components/mypage/delete-account-control";
import { HitokotoModal } from "@/components/mypage/hitokoto-modal";
import type { AuthUser } from "@/lib/auth-context";
import { styles } from "@/components/mypage/mypage-screen-styles";

export type MypageScreenViewProps = {
  isDesktop: boolean;
  user: AuthUser;
  tabInset: number;
  hitokotoDisplay: string;
  isSharing: boolean;
  handleViewPublicPage: () => void;
  /** 共有先を渡す。既定は X。 */
  handleShareLocation: (target?: ShareTarget) => void;
  settingsOpen: boolean;
  setSettingsOpen: (value: boolean) => void;
  /** Xアカウント切り替えモーダルの開閉（状態は呼び出し側が持つ既存の分担に合わせる）。 */
  switchModalVisible: boolean;
  setSwitchModalVisible: (value: boolean) => void;
  sharePrecise: boolean;
  handleTogglePrecision: (next: boolean) => void;
  settingsLoading: boolean;
  isSetSharePrecisionPending: boolean;
  isPausing: boolean;
  liveEnabled: boolean;
  toggleLivePresence: (value: boolean) => void;
  livePresenceLoading: boolean;
  /** すれちがい到着のアプリ内お知らせ（端末ローカル設定。サーバー同期しない） */
  noticeEnabled: boolean;
  onToggleEncounterNotice: (value: boolean) => void;
  trailVisibility: TrailVisibility;
  handleSelectTrailVisibility: (value: TrailVisibility) => void;
  isSetTrailVisibilityPending: boolean;
  pausedUntilLabel: string | null;
  isPauseOrResumePending: boolean;
  handlePauseLocation: (hours: number) => void;
  handleResumeLocation: () => void;
  hitokotoModalVisible: boolean;
  setHitokotoModalVisible: (value: boolean) => void;
  localHitokoto: string;
  handleHitokotoSave: (text: string) => void;
  showBlockList: boolean;
  setShowBlockList: (value: boolean) => void;
  resetTutorial: () => void;
  resetOnboarding: () => void;
  handleLogout: () => void;
};

export function MypageScreenView(props: MypageScreenViewProps) {
  const {
    isDesktop,
    user,
    tabInset,
    hitokotoDisplay,
    isSharing,
    handleViewPublicPage,
    handleShareLocation,
    settingsOpen,
    setSettingsOpen,
    switchModalVisible,
    setSwitchModalVisible,
    sharePrecise,
    handleTogglePrecision,
    settingsLoading,
    isSetSharePrecisionPending,
    isPausing,
    liveEnabled,
    toggleLivePresence,
    livePresenceLoading,
    noticeEnabled,
    onToggleEncounterNotice,
    trailVisibility,
    handleSelectTrailVisibility,
    isSetTrailVisibilityPending,
    pausedUntilLabel,
    isPauseOrResumePending,
    handlePauseLocation,
    handleResumeLocation,
    hitokotoModalVisible,
    setHitokotoModalVisible,
    localHitokoto,
    handleHitokotoSave,
    showBlockList,
    setShowBlockList,
    resetTutorial,
    resetOnboarding,
    handleLogout,
  } = props;

  return (
    <ScreenContainer containerClassName="bg-background">
      <TabScreenHeader
        title="マイページ"
        contextKey="mypage"
        showCharacters={false}
        isDesktop={isDesktop}
        showMenu
      />

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: tabInset }]}>
        <View style={styles.pageBody}>
        {/* プロフィールカード */}
        <View style={styles.profileCard}>
          <View style={styles.profileRow}>
            {user.profileImage ? (
              <Image
                source={{ uri: user.profileImage }}
                style={styles.avatar}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.avatarPlaceholder]}>
                <MaterialIcons name="account-circle" size={48} color={color.textMuted} />
              </View>
            )}
            <View style={styles.profileInfo}>
              <Text style={styles.profileName} numberOfLines={1}>
                {user.name || user.username || "ロミユーザー"}
              </Text>
              {user.username && (
                <Text style={styles.profileUsername} numberOfLines={1}>@{user.username}</Text>
              )}
              {typeof user.followersCount === "number" ? (
                <Text style={styles.profileMetaText}>
                  フォロワー {user.followersCount.toLocaleString("ja-JP")}
                </Text>
              ) : null}
            </View>
          </View>

          <View style={styles.profileActionsRow}>
            <Pressable
              onPress={handleViewPublicPage}
              disabled={isSharing}
              style={({ pressed }) => [
                styles.publicPagePreviewLink,
                pressed && { opacity: 0.7 },
                isSharing && { opacity: 0.6 },
              ]}
              accessibilityRole="button"
            >
              <MaterialIcons name="visibility" size={16} color={color.accentIndigo} />
              <Text style={styles.publicPagePreviewText}>
                {isSharing ? "準備中…" : "公開ページを見る"}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => handleShareLocation("x")}
              disabled={isSharing}
              style={({ pressed }) => [
                styles.publicPagePreviewLink,
                pressed && { opacity: 0.7 },
                isSharing && { opacity: 0.6 },
              ]}
              accessibilityRole="button"
            >
              <MaterialIcons name="ios-share" size={16} color={color.accentIndigo} />
              <Text style={styles.publicPagePreviewText}>
                {isSharing ? "準備中…" : "現在地をXでシェア"}
              </Text>
            </Pressable>
            {/* X だけでは届かない層（Instagram / Threads しか使っていない人）向け。
                Threads は X と同じく公式の Web Intent があるので同じ導線で出せる。 */}
            <Pressable
              onPress={() => handleShareLocation("threads")}
              disabled={isSharing}
              style={({ pressed }) => [
                styles.publicPagePreviewLink,
                pressed && { opacity: 0.7 },
                isSharing && { opacity: 0.6 },
              ]}
              accessibilityRole="button"
            >
              <MaterialIcons name="ios-share" size={16} color={color.accentIndigo} />
              <Text style={styles.publicPagePreviewText}>
                {isSharing ? "準備中…" : "現在地をThreadsでシェア"}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* X 未連携で公開ページを作れない人への脱出路。該当しなければ何も描かない
            （2026-08-05 SIWA を主導線にしたことで現実に発生するようになった状態）。 */}
        <XLinkRescueCard />
        {/* 切り替えを試した直後だけ出る成否バナー。試していなければ何も描かない。
            X でのログアウト完了は検知できないので、代わりに「結果」を検知して閉じる。 */}
        <SwitchXAccountResultNotice onRetry={() => setSwitchModalVisible(true)} />
        <MypageActionList />
        <LatestFootprintCard />
        <MySignalSummary />
        {/* 協賛枠。在庫が無い/今日の上限に達している場合は何も描かない。
            統計の直後＝「自分の記録を見終えた」区切りに置く。 */}
        <SponsorSlot slot="mypage_stats" />
        <HostEventsSummary />

        {/* 設定（折りたたみ） */}
        <View style={styles.section}>
          <Pressable
            onPress={() => setSettingsOpen(!settingsOpen)}
            style={({ pressed }) => [styles.sectionHeader, pressed && { opacity: 0.8 }]}
            accessibilityRole="button"
            accessibilityState={{ expanded: settingsOpen }}
          >
            <Text style={styles.sectionTitle}>設定</Text>
            <MaterialIcons
              name={settingsOpen ? "expand-less" : "expand-more"}
              size={20}
              color={color.textMuted}
            />
          </Pressable>

          {settingsOpen ? (
            <View style={styles.settingsBody}>
        {/* 現在地をXでシェアはプロフィールカードへ移設済み（行動は設定に置かない方針） */}

        {/* 共有サムネの粒度設定 */}
        <View style={styles.precisionRow}>
          <View style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
            <Text style={styles.precisionTitle}>正確な現在地で共有する</Text>
            <Text style={styles.precisionSub}>
              {sharePrecise
                ? "サムネに正確な座標を表示します（後でその場所に行ける精度）"
                : "OFFの間は市区町村レベル（約500m）で安全側に表示します"}
            </Text>
          </View>
          <Switch
            value={sharePrecise}
            onValueChange={handleTogglePrecision}
            disabled={settingsLoading || isSetSharePrecisionPending}
            trackColor={{ false: palette.gray400, true: palette.kimitoBlue }}
            thumbColor={palette.white}
          />
        </View>

        {/* 居場所をリアルタイム公開（レーダー） */}
        <View style={styles.precisionRow}>
          <View style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
            <Text style={styles.precisionTitle}>居場所をリアルタイム公開</Text>
            <Text style={styles.precisionSub}>
              {isPausing
                ? "位置情報が一時停止中のため利用できません"
                : liveEnabled
                  ? "ONの間、レーダー上で「いまここにいるよ」と表示されます（約45秒ごとに更新）"
                  : "OFFの間は他の人にリアルタイムの居場所は表示されません"}
            </Text>
          </View>
          <Switch
            value={liveEnabled}
            onValueChange={toggleLivePresence}
            disabled={settingsLoading || livePresenceLoading || isPausing}
            trackColor={{ false: palette.gray400, true: palette.kimitoBlue }}
            thumbColor={palette.white}
          />
        </View>

        {/* すれちがいのお知らせ（アプリ内表示のみ・端末ローカル設定） */}
        <View style={styles.precisionRow}>
          <View style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
            <Text style={styles.precisionTitle}>すれちがいのお知らせ</Text>
            <Text style={styles.precisionSub}>
              {noticeEnabled
                ? "アプリを開いている間、新しいすれちがいが届いたらお知らせします"
                : "お知らせを表示しません（封筒はホームでいつでも開けます）"}
            </Text>
          </View>
          <Switch
            value={noticeEnabled}
            onValueChange={onToggleEncounterNotice}
            trackColor={{ false: palette.gray400, true: palette.kimitoBlue }}
            thumbColor={palette.white}
          />
        </View>

        {/* 軌跡の公開範囲 */}
        <View style={styles.visibilitySection}>
          <Text style={styles.visibilityHeading}>軌跡の公開範囲</Text>
          <Text style={styles.visibilityNote}>
            記録自体は残ります。交流はXで行い、アプリ内DMはありません。
          </Text>
          {TRAIL_VISIBILITY_VALUES.map((value) => {
            const selected = trailVisibility === value;
            return (
              <Pressable
                key={value}
                onPress={() => handleSelectTrailVisibility(value)}
                disabled={settingsLoading || isSetTrailVisibilityPending}
                style={({ pressed }) => [
                  styles.visibilityOption,
                  selected && styles.visibilityOptionSelected,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <MaterialIcons
                  name={selected ? "radio-button-checked" : "radio-button-unchecked"}
                  size={20}
                  color={selected ? palette.kimitoBlue : color.textMuted}
                  style={{ marginRight: 10 }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.visibilityTitle, selected && styles.visibilityTitleSelected]}>
                    {trailVisibilityLabel(value)}
                  </Text>
                  <Text style={styles.visibilitySub}>
                    {trailVisibilityDescription(value)}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* 足あとの一時停止（docs/uiux-brushup-SPEC.md §6.3） */}
        <View style={styles.section}>
          <LocationPauseControl
            isPausing={isPausing}
            pausedUntilLabel={pausedUntilLabel}
            isBusy={isPauseOrResumePending}
            onPause={handlePauseLocation}
            onResume={handleResumeLocation}
          />
        </View>

        {/* ひとこと */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>ひとこと</Text>
            <Pressable
              onPress={() => setHitokotoModalVisible(true)}
              style={({ pressed }) => [styles.editButton, pressed && { opacity: 0.7 }]}
            >
              <MaterialIcons name="edit" size={16} color={color.accentIndigo} />
              <Text style={styles.editButtonText}>編集</Text>
            </Pressable>
          </View>
          <Text style={styles.hitokotoDisplay}>{hitokotoDisplay}</Text>
          <Text style={styles.hitokotoNote}>
            すれ違い相手に24時間だけ表示されます
          </Text>
        </View>

        {/* ブロックリスト */}
        <View style={styles.section}>
          <Pressable
            onPress={() => setShowBlockList(!showBlockList)}
            style={({ pressed }) => [styles.sectionHeader, pressed && { opacity: 0.8 }]}
          >
            <Text style={styles.sectionTitle}>ブロックリスト</Text>
            <MaterialIcons
              name={showBlockList ? "expand-less" : "expand-more"}
              size={20}
              color={color.textMuted}
            />
          </Pressable>
          {showBlockList && (
            <View style={styles.blockListContent}>
              <Text style={styles.blockListEmpty}>
                ブロックしているユーザーはいません
              </Text>
            </View>
          )}
        </View>

        {/* 設定・ログアウト */}
        <View style={styles.settingsSubSection}>
          <Text style={styles.settingsSubHeading}>その他</Text>

          <Pressable
            onPress={() => void resetTutorial()}
            style={({ pressed }) => [styles.menuItem, pressed && { opacity: 0.7 }]}
          >
            <MaterialIcons name="school" size={20} color={palette.kimitoBlue} style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.menuItemText, { color: color.textPrimary }]}>使い方ガイドをもう一度</Text>
              <Text style={{ color: color.textMuted, fontSize: 11, marginTop: 2 }}>
                封筒・チェックイン・現在地・ナビ・集まりの6ステップ
              </Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => void resetOnboarding()}
            style={({ pressed }) => [styles.menuItem, pressed && { opacity: 0.7 }]}
          >
            <MaterialIcons name="auto-stories" size={20} color={palette.kimitoBlue} style={{ marginRight: 12 }} />
            <Text style={[styles.menuItemText, { color: color.textPrimary }]}>初回スライドをもう一度</Text>
          </Pressable>

          {/*
            プレミアム導線（docs/monetization-DESIGN.md B-3）。
            カード型にせず設定リストの静かな1行に留める（訴求密度ルール:
            1画面1商業訴求・新しい訴求枠を作らない）。
          */}
          <Pressable
            onPress={navigate.toPremium}
            style={({ pressed }) => [styles.menuItem, pressed && { opacity: 0.7 }]}
          >
            <MaterialIcons
              name="workspace-premium"
              size={20}
              color={color.accentOrange}
              style={{ marginRight: 12 }}
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.menuItemText, { color: color.textPrimary }]}>プレミアム</Text>
              <Text style={{ color: color.textMuted, fontSize: 11, marginTop: 2 }}>
                記録と再訪はずっと無料。広告非表示と足あとの書き出し
              </Text>
            </View>
          </Pressable>

          <Pressable
            onPress={navigate.toSpecialThanks}
            style={({ pressed }) => [styles.menuItem, pressed && { opacity: 0.7 }]}
          >
            <MaterialIcons name="stars" size={20} color={color.accentAlt} style={{ marginRight: 12 }} />
            <Text style={[styles.menuItemText, { color: color.textPrimary }]}>Special Thanks</Text>
          </Pressable>

          {/* 姉妹サービス導線：同じアカウント(シグナルID)でそのまま接続できる別サービスへ。 */}
          {(appConfig.siblingServices ?? []).map((svc) => (
            <Pressable
              key={svc.url}
              onPress={() => Linking.openURL(svc.url)}
              style={({ pressed }) => [styles.menuItem, pressed && { opacity: 0.7 }]}
            >
              <MaterialIcons name="hub" size={20} color={color.accentAlt} style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuItemText, { color: color.textPrimary }]}>{svc.name}</Text>
                {svc.sharedAccount && (
                  <Text style={{ color: color.textMuted, fontSize: 11, marginTop: 2 }}>
                    同じアカウントで接続 / 登録不要
                  </Text>
                )}
              </View>
              <MaterialIcons name="open-in-new" size={16} color={color.textMuted} />
            </Pressable>
          ))}

          {/* 別アカウントへの切り替え。ログアウト（危険操作）とは別枠にして、
              区切り線より前＝通常操作として置く。 */}
          <Pressable
            onPress={() => setSwitchModalVisible(true)}
            style={({ pressed }) => [styles.menuItem, pressed && { opacity: 0.7 }]}
            accessibilityRole="button"
          >
            <MaterialIcons
              name="swap-horiz"
              size={20}
              color={color.accentPrimary}
              style={{ marginRight: 12 }}
            />
            <Text style={[styles.menuItemText, { color: color.textPrimary }]}>
              別のXアカウントに切り替える
            </Text>
          </Pressable>

          <View style={styles.dangerZoneDivider} />

          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [styles.menuItem, styles.dangerItem, pressed && { opacity: 0.7 }]}
          >
            <MaterialIcons name="logout" size={20} color={color.danger} style={{ marginRight: 12 }} />
            <Text style={[styles.menuItemText, { color: color.danger }]}>ログアウト</Text>
          </Pressable>

          {/* アカウント削除（App Store Guideline 5.1.1(v) が要求するアプリ内削除導線） */}
          <DeleteAccountControl onDeleted={handleLogout} />
        </View>

        {/* リーガルリンク */}
        <View style={styles.legalSection}>
          <Pressable
            onPress={() => Linking.openURL("https://surechigai.kimito.link/terms")}
            style={({ pressed }) => [styles.legalLink, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.legalLinkText}>利用規約</Text>
          </Pressable>
          <Text style={styles.legalSep}>・</Text>
          <Pressable
            onPress={() => Linking.openURL("https://surechigai.kimito.link/privacy")}
            style={({ pressed }) => [styles.legalLink, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.legalLinkText}>プライバシーポリシー</Text>
          </Pressable>
          <Text style={styles.legalSep}>・</Text>
          <Pressable
            onPress={() => Linking.openURL("https://surechigai.kimito.link/support")}
            style={({ pressed }) => [styles.legalLink, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.legalLinkText}>サポート</Text>
          </Pressable>
        </View>

        <Text style={styles.version}>君斗りんくのすれ違ひ通信 v1.0.0</Text>
            </View>
          ) : null}
        </View>
        </View>
      </ScrollView>

      {/* ひとこと編集モーダル */}
      <HitokotoModal
        visible={hitokotoModalVisible}
        current={localHitokoto}
        onClose={() => setHitokotoModalVisible(false)}
        onSave={handleHitokotoSave}
      />

      {/* Xアカウント切り替え。X側のログアウトはユーザー操作が要るので案内する。 */}
      <SwitchXAccountModal
        visible={switchModalVisible}
        onClose={() => setSwitchModalVisible(false)}
        returnTo="/mypage"
      />
    </ScreenContainer>
  );
}
