/**
 * Event Detail Screen
 * イベント詳細画面 - リファクタリング済み
 * 
 * 分割されたコンポーネント:
 * - features/event-detail/hooks/ - カスタムフック
 * - features/event-detail/components/ - UIコンポーネント
 */

import { View, Text, ScrollView, KeyboardAvoidingView, Platform, RefreshControl, Modal, Pressable } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { navigate } from "@/lib/navigation";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { useColors } from "@/hooks/use-colors";
import { color, palette } from "@/theme/tokens";
import { AppHeader } from "@/components/organisms/app-header";
import { EventDetailSkeleton } from "@/components/organisms/event-detail-skeleton";
import { PrefectureParticipantsModal } from "@/components/molecules/prefecture-participants-modal";
import { RegionParticipantsModal } from "@/components/molecules/region-participants-modal";
import { HostProfileModal } from "@/components/organisms/host-profile-modal";
import { FanProfileModal } from "@/components/organisms/fan-profile-modal";
import { SharePromptModal } from "@/components/molecules/share-prompt-modal";
import { RefreshingIndicator } from "@/components/molecules/refreshing-indicator";
import { LinkSpeech } from "@/components/organisms/link-speech";
import {
  MessagesSection,
  ConfirmationModal,
  DeleteParticipationModal,
} from "@/features/events/components";
import type { Participation } from "@/types/participation";

// Event Detail Feature
import {
  useEventDetail,
  useParticipationForm,
  useEventActions,
  useModalState,
  EventHeaderSection,
  CountdownSection,
  ProgressSection,
  EventInfoSection,
  TicketInfoSection,
  HostManagementSection,
  ShareSection,
  InviteButton,
  ParticipantsOverview,
  ParticipationFormSection,
} from "@/features/event-detail";
import { usePerformanceMonitor } from "@/lib/performance-monitor";

export default function ChallengeDetailScreen() {
  const colors = useColors();
  
  const { id } = useLocalSearchParams<{ id: string }>();
  const challengeId = parseInt(id || "0", 10);

  // Event detail data hook
  const eventDetail = useEventDetail({ challengeId });
  
  // Performance monitoring
  usePerformanceMonitor(
    "EventDetail",
    eventDetail.hasData,
    eventDetail.isInitialLoading,
    !eventDetail.hasData
  );
  
  // Modal state hook
  const modalState = useModalState();
  
  // Participation form hook
  const participationForm = useParticipationForm({
    challengeId,
    user: eventDetail.user,
    login: eventDetail.login,
    refetch: eventDetail.refetch,
  });
  
  // Event actions hook
  const eventActions = useEventActions({
    challengeId,
    challengeTitle: eventDetail.challenge?.title || "",
    currentValue: eventDetail.currentValue,
    goalValue: eventDetail.goalValue,
    unit: eventDetail.unit,
    progress: eventDetail.progress,
    remaining: eventDetail.remaining,
    refetch: eventDetail.refetch,
  });

  // Loading state (初回のみスケルトン表示)
  if (eventDetail.isInitialLoading) {
    return <EventDetailSkeleton />;
  }

  // Not found state
  if (!eventDetail.challenge) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
          <View style={{ padding: 20 }}>
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 16, color: colors.foreground }}>
                チャレンジが見つかりません
              </Text>
            </View>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  const { challenge, participations, user } = eventDetail;
  
  // Check if current user is the owner
  const userTwitterId = user?.openId?.startsWith("twitter:") 
    ? user.openId.replace("twitter:", "") 
    : user?.openId;
  const isOwner = Boolean(userTwitterId && challenge.hostTwitterId === userTwitterId);
  const isHost = Boolean(user && challenge.hostUserId === user.id);

  return (
    <ScreenContainer edges={["top", "left", "right"]} containerClassName="bg-background">
      {/* 更新中インジケータ */}
      <RefreshingIndicator isRefreshing={eventDetail.isRefreshing} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView 
          ref={participationForm.scrollViewRef} 
          style={{ flex: 1, backgroundColor: colors.background }}
          showsHorizontalScrollIndicator={false}
          horizontal={false}
          directionalLockEnabled={true}
          alwaysBounceHorizontal={false}
          refreshControl={
            <RefreshControl
              refreshing={eventDetail.isRefreshing}
              onRefresh={eventDetail.onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {/* ヘッダー */}
          <AppHeader 
            title="君斗りんくの動員ちゃれんじ" 
            showCharacters={false}
            showMenu={true}
            showLoginButton={true}
          />

          {/* イベントヘッダー */}
          <EventHeaderSection
            challenge={challenge}
            challengeId={challengeId}
            isOwner={isOwner}
            isChallengeFavorite={eventDetail.isChallengeFavorite}
            toggleFavorite={eventDetail.toggleFavorite}
            isFollowing={eventDetail.isFollowing}
            hostUserId={eventDetail.hostUserId}
            userId={user?.id}
            onFollowToggle={eventDetail.handleFollowToggle}
            onShowHostProfile={() => modalState.setShowHostProfileModal(true)}
          />

          {/* カウントダウン */}
          <CountdownSection
            eventDate={challenge.eventDate}
            isDateUndecided={eventDetail.isDateUndecided}
          />

          {/* 進捗セクション */}
          <ProgressSection
            currentValue={eventDetail.currentValue}
            goalValue={eventDetail.goalValue}
            unit={eventDetail.unit}
            progress={eventDetail.progress}
            remaining={eventDetail.remaining}
            challengeId={challengeId}
            prefectureCounts={eventDetail.prefectureCounts}
            participations={participations}
            myParticipation={eventDetail.myParticipation}
            onPrefecturePress={(prefName) => modalState.setSelectedPrefectureForModal(prefName)}
            onRegionPress={(region) => modalState.setSelectedRegion(region)}
          />

          {/* イベント情報 */}
          <View style={{ paddingHorizontal: 16 }}>
            <EventInfoSection
              formattedDate={eventDetail.formattedDate}
              venue={challenge.venue}
              description={challenge.description}
            />

            {/* チケット情報 */}
            <TicketInfoSection
              ticketPresale={challenge.ticketPresale}
              ticketDoor={challenge.ticketDoor}
              ticketUrl={challenge.ticketUrl}
            />

            {/* ホスト用管理ボタン */}
            <HostManagementSection
              challengeId={challengeId}
              isHost={isHost}
              progress={eventDetail.progress}
            />

            {/* 友達を招待ボタン */}
            <InviteButton challengeId={challengeId} />
          </View>

          {/* 参加者概要（チケット譲渡、地域マップ、ランキング） */}
          <ParticipantsOverview
            challengeId={challengeId}
            challengeTitle={challenge.title}
            participations={participations}
            followerIds={eventDetail.followerIds}
            onFanPress={(fan) => modalState.setSelectedFan(fan)}
            highlightPrefecture={participationForm.lastParticipation?.prefecture}
            onPrefecturePress={(prefName) => modalState.setSelectedPrefectureForModal(prefName)}
            attendanceTypeCounts={eventDetail.attendanceTypeCounts}
          />

          {/* 応援メッセージセクション */}
          {participations && participations.length > 0 && (
            <View ref={participationForm.messagesRef} style={{ marginTop: 16 }}>
              <MessagesSection
                participations={participations as Participation[]}
                challengeCompanions={eventDetail.challengeCompanions}
                selectedGenderFilter={modalState.selectedGenderFilter}
                onGenderFilterChange={modalState.setSelectedGenderFilter}
                selectedPrefectureFilter={modalState.selectedPrefectureFilter}
                onPrefectureFilterChange={modalState.setSelectedPrefectureFilter}
                showPrefectureFilterList={modalState.showPrefectureFilterList}
                onTogglePrefectureFilterList={() => modalState.setShowPrefectureFilterList(!modalState.showPrefectureFilterList)}
                justSubmitted={participationForm.justSubmitted}
                currentUserId={user?.id}
                currentUserTwitterId={eventDetail.currentUserTwitterId}
                challengeId={challengeId}
                onCheer={eventActions.handleSendCheer}
                onDM={(userId) => navigate.toMessages(userId, challengeId)}
                onEdit={(participationId) => navigate.toEditParticipation(participationId, challengeId)}
                onDelete={(participation) => {
                  eventActions.setDeleteTargetParticipation(participation);
                  eventActions.setShowDeleteParticipationModal(true);
                }}
              />
            </View>
          )}

          {/* 参加表明フォーム / シェアボタン */}
          <View style={{ paddingHorizontal: 16 }}>
            {participationForm.showForm ? (
              <ParticipationFormSection
                user={user}
                login={eventDetail.login}
                message={participationForm.message}
                setMessage={participationForm.setMessage}
                prefecture={participationForm.prefecture}
                setPrefecture={participationForm.setPrefecture}
                gender={participationForm.gender}
                setGender={participationForm.setGender}
                allowVideoUse={participationForm.allowVideoUse}
                setAllowVideoUse={participationForm.setAllowVideoUse}
                showPrefectureList={participationForm.showPrefectureList}
                setShowPrefectureList={participationForm.setShowPrefectureList}
                companions={participationForm.companions}
                showAddCompanionForm={participationForm.showAddCompanionForm}
                setShowAddCompanionForm={participationForm.setShowAddCompanionForm}
                newCompanionName={participationForm.newCompanionName}
                setNewCompanionName={participationForm.setNewCompanionName}
                newCompanionTwitter={participationForm.newCompanionTwitter}
                setNewCompanionTwitter={participationForm.setNewCompanionTwitter}
                isLookingUpTwitter={participationForm.isLookingUpTwitter}
                lookupError={participationForm.lookupError}
                lookedUpProfile={participationForm.lookedUpProfile}
                setLookedUpProfile={participationForm.setLookedUpProfile}
                setLookupError={participationForm.setLookupError}
                onSubmit={participationForm.handleSubmit}
                onCancel={() => participationForm.setShowForm(false)}
                onAddCompanion={participationForm.handleAddCompanion}
                onRemoveCompanion={participationForm.handleRemoveCompanion}
                onLookupTwitterProfile={participationForm.lookupTwitterProfile}
                isSubmitting={participationForm.isSubmitting}
              />
            ) : (
              <ShareSection
                challengeId={challengeId}
                challengeTitle={challenge.title}
                eventDate={challenge.eventDate}
                onShare={eventActions.handleShare}
                onTwitterShare={eventActions.handleTwitterShare}
                onShowForm={participationForm.openParticipationForm}
              />
            )}
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 参加表明確認モーダル */}
      <ConfirmationModal
        visible={participationForm.showConfirmation}
        onClose={() => participationForm.setShowConfirmation(false)}
        onConfirm={participationForm.handleConfirmSubmit}
        isSubmitting={participationForm.isSubmitting}
        user={user}
        prefecture={participationForm.prefecture}
        companions={participationForm.companions}
        message={participationForm.message}
      />

      {/* 1-Click 参加表明確認モーダル */}
      <Modal
        visible={participationForm.showOneClickConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => participationForm.setShowOneClickConfirm(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: palette.gray900 + "80", justifyContent: "center", padding: 24 }}
          onPress={() => participationForm.setShowOneClickConfirm(false)}
        >
          <Pressable style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 24 }} onPress={(e) => e.stopPropagation()}>
            <Text style={{ fontSize: 16, color: colors.foreground, marginBottom: 24, textAlign: "center" }}>
              {participationForm.prefecture}・{participationForm.gender === "male" ? "男性" : participationForm.gender === "female" ? "女性" : ""}で参加表明します。よろしいですか？
            </Text>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <Pressable
                onPress={() => participationForm.setShowOneClickConfirm(false)}
                style={{ flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center", backgroundColor: colors.background }}
              >
                <Text style={{ color: colors.foreground }}>キャンセル</Text>
              </Pressable>
              <Pressable
                onPress={participationForm.handleConfirmSubmit}
                disabled={participationForm.isSubmitting}
                style={{ flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center", backgroundColor: colors.primary, opacity: participationForm.isSubmitting ? 0.6 : 1 }}
              >
                <Text style={{ color: color.textWhite, fontWeight: "600" }}>{participationForm.isSubmitting ? "送信中..." : "参加表明する"}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* りんく吹き出し: ◯人目の参加だよ！ */}
      {participationForm.showParticipantNumberSpeech && participationForm.participantNumber && (
        <View style={{
          position: "absolute",
          bottom: 100,
          left: 16,
          right: 16,
          zIndex: 1000,
        }}>
          <LinkSpeech
            message={`あなたは${participationForm.participantNumber}人目の参加表明だよ！\n同じ時間を共有する仲間が増えてるね♪`}
          />
        </View>
      )}

      {/* シェア促進モーダル */}
      <SharePromptModal
        visible={participationForm.showSharePrompt}
        onClose={() => {
          participationForm.setShowSharePrompt(false);
          participationForm.setLastParticipation(null);
        }}
        challengeTitle={challenge.title}
        hostName={challenge.hostName}
        challengeId={challengeId}
        participantName={participationForm.lastParticipation?.name}
        participantUsername={participationForm.lastParticipation?.username}
        participantImage={participationForm.lastParticipation?.image}
        message={participationForm.lastParticipation?.message}
        contribution={participationForm.lastParticipation?.contribution}
        currentParticipants={eventDetail.currentValue}
        goalParticipants={eventDetail.goalValue}
        participantNumber={eventDetail.currentValue}
        prefecture={participationForm.lastParticipation?.prefecture}
      />

      {/* 都道府県別参加者モーダル */}
      {modalState.selectedPrefectureForModal && participations && (
        <PrefectureParticipantsModal
          visible={!!modalState.selectedPrefectureForModal}
          onClose={() => modalState.setSelectedPrefectureForModal(null)}
          prefectureName={modalState.selectedPrefectureForModal}
          participants={participations.filter(p => p.prefecture === modalState.selectedPrefectureForModal).map(p => ({
            id: p.id,
            userId: p.userId,
            displayName: p.displayName,
            username: p.username,
            profileImage: p.profileImage,
            contribution: p.contribution || 1,
            message: p.message,
            companionCount: p.companionCount || 0,
            prefecture: p.prefecture,
            isAnonymous: p.isAnonymous || false,
            followersCount: p.followersCount,
          }))}
        />
      )}

      {/* 地域別参加者モーダル */}
      {modalState.selectedRegion && participations && (
        <RegionParticipantsModal
          visible={!!modalState.selectedRegion}
          onClose={() => modalState.setSelectedRegion(null)}
          regionName={modalState.selectedRegion.name}
          prefectures={modalState.selectedRegion.prefectures}
          participants={participations.filter(p => p.prefecture && modalState.selectedRegion?.prefectures.includes(p.prefecture)).map(p => ({
            id: p.id,
            userId: p.userId,
            displayName: p.displayName,
            username: p.username,
            profileImage: p.profileImage,
            contribution: p.contribution || 1,
            message: p.message,
            companionCount: p.companionCount || 0,
            prefecture: p.prefecture,
            isAnonymous: p.isAnonymous || false,
            followersCount: p.followersCount,
          }))}
        />
      )}

      {/* ホストプロフィールモーダル */}
      {modalState.showHostProfileModal && challenge.hostUsername && (
        <HostProfileModal
          visible={modalState.showHostProfileModal}
          onClose={() => modalState.setShowHostProfileModal(false)}
          username={challenge.hostUsername}
          displayName={challenge.hostName}
          profileImage={challenge.hostProfileImage}
        />
      )}

      {/* ファンプロフィールモーダル */}
      {modalState.selectedFan && (
        <FanProfileModal
          visible={!!modalState.selectedFan}
          onClose={() => modalState.setSelectedFan(null)}
          twitterId={modalState.selectedFan.twitterId}
          username={modalState.selectedFan.username}
          displayName={modalState.selectedFan.displayName}
          profileImage={modalState.selectedFan.profileImage}
        />
      )}

      {/* 参加表明削除モーダル */}
      <DeleteParticipationModal
        visible={eventActions.showDeleteParticipationModal}
        onClose={() => {
          eventActions.setShowDeleteParticipationModal(false);
          eventActions.setDeleteTargetParticipation(null);
        }}
        onConfirm={eventActions.handleDeleteParticipation}
        participation={eventActions.deleteTargetParticipation}
        isDeleting={eventActions.isDeleting}
      />
    </ScreenContainer>
  );
}
