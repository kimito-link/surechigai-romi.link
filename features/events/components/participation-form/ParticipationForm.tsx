/**
 * features/events/components/participation-form/ParticipationForm.tsx
 * 
 * 参加表明フォームコンポーネント（リファクタリング版）
 */
import { View, Text, ScrollView } from "react-native";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui";
import { Image } from "expo-image";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import { color } from "@/theme/tokens";
import { eventUI } from "@/features/events/ui/theme/tokens";
import { useColors } from "@/hooks/use-colors";
import { prefectures } from "@/constants/prefectures";
import { styles } from "./ParticipationForm.styles";
import type { ParticipationFormProps } from "./types";
import { eventDetailCopy, authCopy, commonCopy } from "@/constants/copy";

export function ParticipationForm({
  user,
  isLoggedIn,
  onLogin,
  message,
  onMessageChange,
  prefecture,
  onPrefectureChange,
  gender,
  onGenderChange,
  allowVideoUse,
  onAllowVideoUseChange,
  showPrefectureList,
  onTogglePrefectureList,
  companions,
  showAddCompanionForm,
  onToggleAddCompanionForm,
  newCompanionName,
  onNewCompanionNameChange,
  newCompanionTwitter,
  onNewCompanionTwitterChange,
  isLookingUpTwitter,
  lookupError,
  lookedUpProfile,
  onLookupTwitterProfile,
  onAddCompanion,
  onRemoveCompanion,
  onCancelAddCompanion,
  attendanceType,
  onAttendanceTypeChange,
  onSubmit,
  isSubmitting,
  isEditMode = false,
  hasExistingParticipation = false,
}: ParticipationFormProps) {
  const colors = useColors();

  // ログインしていない場合
  if (!isLoggedIn) {
    return (
      <View style={styles.loginPrompt}>
        <MaterialIcons name="person-add" size={48} color={color.accentPrimary} />
        <Text style={[styles.loginPromptTitle, { color: colors.foreground }]}>
          {eventDetailCopy.actions.participateLogin}
        </Text>
        <Button variant="primary" onPress={onLogin} style={styles.loginButton}>
          <LinearGradient
            colors={[color.accentPrimary, color.accentAlt]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.loginButtonGradient}
          >
            <MaterialIcons name="login" size={20} color={colors.foreground} />
            <Text style={[styles.loginButtonText, { color: colors.foreground }]}>
              {authCopy.login.loginWithX}
            </Text>
          </LinearGradient>
        </Button>
      </View>
    );
  }

  // 既に参加表明済みの場合
  if (hasExistingParticipation && !isEditMode) {
    return (
      <View style={styles.alreadyParticipated}>
        <MaterialIcons name="check-circle" size={48} color={color.success} />
        <Text style={[styles.alreadyParticipatedTitle, { color: colors.foreground }]}>
          {eventDetailCopy.actions.participateDone}
        </Text>
        <Text style={styles.alreadyParticipatedSubtitle}>
          {eventDetailCopy.actions.participateDoneDesc}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="edit" size={20} color={color.accentPrimary} />
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          {isEditMode ? eventDetailCopy.actions.edit : eventDetailCopy.actions.participate}
        </Text>
      </View>

      {/* ユーザー情報表示 */}
      <View style={styles.userInfo}>
        {user?.profileImage ? (
          <Image
            source={{ uri: user.profileImage }}
            style={styles.userAvatar}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.userAvatarPlaceholder, { backgroundColor: color.accentPrimary }]}>
            <Text style={[styles.userAvatarText, { color: colors.foreground }]}>
              {(user?.name || user?.username || "ゲ")?.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.userDetails}>
          <Text style={[styles.userName, { color: colors.foreground }]}>
            {user?.name || user?.username || "ゲスト"}
          </Text>
          {user?.username && (
            <Text style={styles.userHandle}>@{user.username}</Text>
          )}
          {user?.followersCount !== undefined && user.followersCount > 0 && (
            <Text style={styles.userFollowers}>
              {user.followersCount.toLocaleString()} フォロワー
            </Text>
          )}
        </View>
      </View>

      {/* 参加方法選択 */}
      <View style={styles.inputSection}>
        <Text style={[styles.inputLabel, { color: colors.foreground }]}>
          {eventDetailCopy.labels.attendanceType}
        </Text>
        <Text style={[styles.inputHint, { color: colors.muted }]}>
          {eventDetailCopy.labels.attendanceTypeHint}
        </Text>
        <View style={styles.attendanceTypeContainer}>
          <Button
            variant={attendanceType === "venue" ? "primary" : "secondary"}
            onPress={() => onAttendanceTypeChange("venue")}
            style={[
              styles.attendanceTypeButton,
              attendanceType === "venue" && styles.attendanceTypeButtonActive,
            ]}
          >
            <MaterialIcons
              name="location-on"
              size={20}
              color={attendanceType === "venue" ? color.textWhite : color.accentPrimary}
            />
            <Text style={[
              styles.attendanceTypeText,
              { color: attendanceType === "venue" ? color.textWhite : colors.foreground }
            ]}>
              {eventDetailCopy.labels.venue}
            </Text>
          </Button>
          
          <Button
            variant={attendanceType === "streaming" ? "primary" : "secondary"}
            onPress={() => onAttendanceTypeChange("streaming")}
            style={[
              styles.attendanceTypeButton,
              attendanceType === "streaming" && styles.attendanceTypeButtonActive,
            ]}
          >
            <MaterialIcons
              name="play-circle"
              size={20}
              color={attendanceType === "streaming" ? color.textWhite : color.accentPrimary}
            />
            <Text style={[
              styles.attendanceTypeText,
              { color: attendanceType === "streaming" ? color.textWhite : colors.foreground }
            ]}>
              {eventDetailCopy.labels.streaming}
            </Text>
          </Button>
          
          <Button
            variant={attendanceType === "both" ? "primary" : "secondary"}
            onPress={() => onAttendanceTypeChange("both")}
            style={[
              styles.attendanceTypeButton,
              attendanceType === "both" && styles.attendanceTypeButtonActive,
            ]}
          >
            <MaterialIcons
              name="done-all"
              size={20}
              color={attendanceType === "both" ? color.textWhite : color.accentPrimary}
            />
            <Text style={[
              styles.attendanceTypeText,
              { color: attendanceType === "both" ? color.textWhite : colors.foreground }
            ]}>
              {eventDetailCopy.labels.both}
            </Text>
          </Button>
        </View>
        <Text style={styles.attendanceTypeHint}>
          {attendanceType === "venue" && "会場に足を運んで、生の熱量を共有する"}
          {attendanceType === "streaming" && "同じ時間に配信を見て、みんなと熱狂を共有する"}
          {attendanceType === "both" && "会場でも配信でも、同じ時間に熱狂を共有する"}
        </Text>
      </View>

      {/* 応援メッセージ入力 */}
      <View style={styles.inputSection}>
        <Input
          label="応援メッセージ"
          value={message}
          onChangeText={onMessageChange}
          placeholder="推しへの熱い思いを書いてね！"
          multiline
          numberOfLines={4}
          containerStyle={{ marginBottom: 0 }}
        />
      </View>

      {/* 都道府県選択 */}
      <View style={styles.inputSection}>
        <Text style={[styles.inputLabel, { color: colors.foreground }]}>
          都道府県
        </Text>
        <Button
          variant="secondary"
          onPress={onTogglePrefectureList}
          style={styles.selectButton}
        >
          <Text style={{ color: prefecture ? colors.foreground : color.textHint }}>
            {prefecture || "選択してください"}
          </Text>
          <MaterialIcons
            name={showPrefectureList ? "expand-less" : "expand-more"}
            size={24}
            color={color.textSecondary}
          />
        </Button>
        
        {showPrefectureList && (
          <View style={styles.prefectureList}>
            <ScrollView style={styles.prefectureScroll} nestedScrollEnabled>
              <View style={styles.prefectureGrid}>
                {prefectures.map((pref) => (
                  <Button
                    key={pref}
                    variant={prefecture === pref ? "primary" : "secondary"}
                    size="sm"
                    onPress={() => {
                      onPrefectureChange(pref);
                      onTogglePrefectureList();
                    }}
                    style={[
                      styles.prefectureItem,
                      prefecture === pref && styles.prefectureItemActive,
                    ]}
                  >
                    <Text style={[
                      styles.prefectureItemText,
                      { color: prefecture === pref ? color.textWhite : colors.foreground }
                    ]}>
                      {pref}
                    </Text>
                  </Button>
                ))}
              </View>
            </ScrollView>
          </View>
        )}
      </View>

      {/* 性別選択 */}
      <View style={styles.inputSection}>
        <Text style={[styles.inputLabel, { color: colors.foreground }]}>
          性別（任意）
        </Text>
        <View style={styles.genderButtons}>
          <Button
            variant={gender === "male" ? "primary" : "secondary"}
            size="sm"
            onPress={() => onGenderChange("male")}
            style={[
              styles.genderButton,
              gender === "male" && { backgroundColor: color.info, borderColor: color.info },
            ]}
          >
            <Text style={[
              styles.genderButtonText,
              { color: gender === "male" ? color.textWhite : color.textSecondary }
            ]}>
              男性
            </Text>
          </Button>
          <Button
            variant={gender === "female" ? "primary" : "secondary"}
            size="sm"
            onPress={() => onGenderChange("female")}
            style={[
              styles.genderButton,
              gender === "female" && { backgroundColor: eventUI.badge, borderColor: eventUI.badge },
            ]}
          >
            <Text style={[
              styles.genderButtonText,
              { color: gender === "female" ? color.textWhite : color.textSecondary }
            ]}>
              女性
            </Text>
          </Button>
          <Button
            variant={gender === "" ? "primary" : "secondary"}
            size="sm"
            onPress={() => onGenderChange("")}
            style={[
              styles.genderButton,
              gender === "" && { backgroundColor: color.textHint, borderColor: color.textHint },
            ]}
          >
            <Text style={[
              styles.genderButtonText,
              { color: gender === "" ? color.textWhite : color.textSecondary }
            ]}>
              未設定
            </Text>
          </Button>
        </View>
      </View>

      {/* 友人追加セクション */}
      <View style={styles.inputSection}>
        <View style={styles.companionHeader}>
          <Text style={[styles.inputLabel, { color: colors.foreground }]}>
            一緒に参加する友人（{companions.length}人）
          </Text>
          <Button
            variant="ghost"
            size="sm"
            onPress={onToggleAddCompanionForm}
            style={styles.addCompanionButton}
          >
            <MaterialIcons name="person-add" size={20} color={color.accentPrimary} />
            <Text style={styles.addCompanionButtonText}>追加</Text>
          </Button>
        </View>

        {/* 友人追加フォーム */}
        {showAddCompanionForm && (
          <View style={styles.addCompanionForm}>
            <Text style={[styles.addCompanionLabel, { color: colors.foreground }]}>
              X（Twitter）ユーザー名で検索
            </Text>
            <View style={styles.twitterSearchRow}>
              <Input
                value={newCompanionTwitter}
                onChangeText={onNewCompanionTwitterChange}
                placeholder="@username"
                autoCapitalize="none"
                containerStyle={{ marginBottom: 0, flex: 1 }}
                inputStyle={lookedUpProfile ? { borderColor: color.success } : undefined}
              />
              <Button
                variant="primary"
                size="sm"
                onPress={() => onLookupTwitterProfile(newCompanionTwitter)}
                disabled={isLookingUpTwitter || !newCompanionTwitter.trim()}
                loading={isLookingUpTwitter}
                style={[
                  styles.twitterSearchButton,
                  { backgroundColor: isLookingUpTwitter ? color.border : color.twitter },
                  !newCompanionTwitter.trim() && styles.twitterSearchButtonDisabled,
                ]}
              >
                <Text style={[styles.twitterSearchButtonText, { color: colors.foreground }]}>
                  {isLookingUpTwitter ? "検索中..." : "検索"}
                </Text>
              </Button>
            </View>

            {/* エラー表示 */}
            {lookupError && (
              <View style={styles.lookupError}>
                <MaterialIcons name="error-outline" size={20} color={color.danger} />
                <Text style={styles.lookupErrorText}>{lookupError}</Text>
              </View>
            )}

            {/* 取得したプロフィール表示 */}
            {lookedUpProfile && (
              <View style={styles.lookedUpProfile}>
                <Image
                  source={{ uri: lookedUpProfile.profileImage }}
                  style={styles.lookedUpProfileImage}
                />
                <View style={styles.lookedUpProfileInfo}>
                  <Text style={[styles.lookedUpProfileName, { color: colors.foreground }]}>
                    {lookedUpProfile.name}
                  </Text>
                  <Text style={styles.lookedUpProfileUsername}>
                    @{lookedUpProfile.username}
                  </Text>
                </View>
                <MaterialIcons name="check-circle" size={24} color={color.success} />
              </View>
            )}

            {/* 名前入力（Twitterがない場合のみ） */}
            {!lookedUpProfile && (
              <>
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>または名前で追加</Text>
                  <View style={styles.dividerLine} />
                </View>
                <Input
                  label="友人の名前"
                  value={newCompanionName}
                  onChangeText={onNewCompanionNameChange}
                  placeholder="ニックネーム"
                  containerStyle={{ marginBottom: 0 }}
                />
              </>
            )}

            <View style={styles.addCompanionActions}>
              <Button
                variant="secondary"
                size="sm"
                onPress={onCancelAddCompanion}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>キャンセル</Text>
              </Button>
              <Button
                variant="primary"
                size="sm"
                onPress={onAddCompanion}
                disabled={!lookedUpProfile && !newCompanionName.trim()}
                style={[
                  styles.confirmAddButton,
                  (!lookedUpProfile && !newCompanionName.trim()) && styles.confirmAddButtonDisabled,
                ]}
              >
                <Text style={[styles.confirmAddButtonText, { color: colors.foreground }]}>追加</Text>
              </Button>
            </View>
          </View>
        )}

        {/* 登録済み友人リスト */}
        {companions.length > 0 && (
          <View style={styles.companionList}>
            {companions.map((companion) => (
              <View key={companion.id} style={[
                styles.companionItem,
                { backgroundColor: colors.background },
                companion.profileImage && styles.companionItemWithTwitter,
              ]}>
                {companion.profileImage ? (
                  <Image
                    source={{ uri: companion.profileImage }}
                    style={styles.companionAvatar}
                  />
                ) : (
                  <View style={[styles.companionAvatarPlaceholder, { backgroundColor: color.accentPrimary }]}>
                    <Text style={[styles.companionAvatarText, { color: colors.foreground }]}>
                      {companion.displayName.charAt(0)}
                    </Text>
                  </View>
                )}
                <View style={styles.companionInfo}>
                  <Text style={[styles.companionName, { color: colors.foreground }]}>
                    {companion.displayName}
                  </Text>
                  {companion.twitterUsername && (
                    <Text style={styles.companionHandle}>@{companion.twitterUsername}</Text>
                  )}
                </View>
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={() => onRemoveCompanion(companion.id)}
                  style={styles.removeCompanionButton}
                >
                  <MaterialIcons name="close" size={20} color={color.textHint} />
                </Button>
              </View>
            ))}
          </View>
        )}

        {/* 貢献度表示 */}
        <View style={[styles.contributionDisplay, { backgroundColor: colors.background }]}>
          <Text style={styles.contributionLabel}>あなたの貢献</Text>
          <View style={styles.contributionValue}>
            <Text style={styles.contributionNumber}>{1 + companions.length}</Text>
            <Text style={styles.contributionUnit}>人</Text>
          </View>
        </View>
      </View>

      {/* 動画使用許可 */}
      <Button
        variant="ghost"
        onPress={() => onAllowVideoUseChange(!allowVideoUse)}
        style={styles.videoPermission}
      >
        <MaterialIcons
          name={allowVideoUse ? "check-box" : "check-box-outline-blank"}
          size={24}
          color={allowVideoUse ? color.accentPrimary : color.textSecondary}
        />
        <Text style={[styles.videoPermissionText, { color: colors.foreground }]}>
          応援動画への使用を許可する
        </Text>
      </Button>

      {/* 送信ボタン */}
      <Button
        variant="primary"
        onPress={onSubmit}
        disabled={isSubmitting}
        loading={isSubmitting}
        style={styles.submitButton}
      >
        <LinearGradient
          colors={[color.accentPrimary, color.accentAlt]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.submitButtonGradient, isSubmitting && styles.submitButtonDisabled]}
        >
          <MaterialIcons name="send" size={20} color={colors.foreground} />
          <Text style={[styles.submitButtonText, { color: colors.foreground }]}>
            {isSubmitting ? commonCopy.loading.submitting : isEditMode ? eventDetailCopy.actions.update : eventDetailCopy.actions.participate}
          </Text>
        </LinearGradient>
      </Button>
    </View>
  );
}
