/**
 * 集まりカード内の参加表明 UI（doin-challenge 参加表明の簡略版）。
 */
import { useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { useLoginGuide } from "@/hooks/use-login-guide";
import { useToast } from "@/components/atoms/toast";
import { regionGroups } from "@/constants/prefectures";
import { eventDetailCopy } from "@/constants/copy/event-detail";
import { color, palette } from "@/theme/tokens";
import { openExternalUrl } from "@/lib/navigation/external-links";

type Props = {
  eventId: number;
  eventTitle: string;
  locationType: string;
  prefecture: string | null;
  participantCount?: number;
  participantAvatars?: (string | null)[];
};

function AvatarStack({ avatars, count }: { avatars: (string | null)[]; count: number }) {
  if (count === 0) return null;
  const shown = avatars.slice(0, 5);
  return (
    <View style={styles.avatarStackRow}>
      <View style={styles.avatarStack}>
        {shown.map((uri, i) => (
          <View key={`${uri ?? "none"}-${i}`} style={[styles.stackAvatarWrap, { marginLeft: i === 0 ? 0 : -8 }]}>
            {uri ? (
              <Image source={{ uri }} style={styles.stackAvatar} contentFit="cover" />
            ) : (
              <View style={[styles.stackAvatar, styles.stackAvatarFallback]}>
                <MaterialIcons name="person" size={12} color={color.textMuted} />
              </View>
            )}
          </View>
        ))}
      </View>
      <Text style={styles.participantCountText}>{count}人が参加表明</Text>
    </View>
  );
}

export function EventParticipationPanel({
  eventId,
  eventTitle,
  locationType,
  prefecture,
  participantCount = 0,
  participantAvatars = [],
}: Props) {
  const { isAuthenticated, user } = useAuth();
  const openLoginGuide = useLoginGuide();
  const toast = useToast();
  const utils = trpc.useUtils();

  const [modalOpen, setModalOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedPref, setSelectedPref] = useState<string>(
    user?.prefecture ?? prefecture ?? "",
  );
  const [showPrefList, setShowPrefList] = useState(false);

  const { data: mine } = trpc.eventParticipation.mineForEvent.useQuery(
    { eventId },
    { enabled: isAuthenticated },
  );

  const createMut = trpc.eventParticipation.create.useMutation({
    onSuccess: () => {
      void utils.event.listUpcoming.invalidate();
      void utils.event.listLive.invalidate();
      void utils.eventParticipation.listByEvent.invalidate({ eventId });
      void utils.eventParticipation.mineForEvent.invalidate({ eventId });
      setModalOpen(false);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      toast.showSuccess(eventDetailCopy.success.participated);
    },
    onError: (err) => toast.showError(err.message || eventDetailCopy.errors.failed),
  });

  const cancelMut = trpc.eventParticipation.cancel.useMutation({
    onSuccess: () => {
      void utils.event.listUpcoming.invalidate();
      void utils.event.listLive.invalidate();
      void utils.eventParticipation.listByEvent.invalidate({ eventId });
      void utils.eventParticipation.mineForEvent.invalidate({ eventId });
      toast.showInfo("参加表明を取り消しました");
    },
  });

  const openForm = useCallback(() => {
    if (!isAuthenticated) {
      openLoginGuide();
      return;
    }
    setSelectedPref(mine?.prefecture ?? user?.prefecture ?? prefecture ?? "");
    setMessage(mine?.message ?? "");
    setModalOpen(true);
  }, [isAuthenticated, mine, openLoginGuide, prefecture, user?.prefecture]);

  const submit = useCallback(() => {
    if (locationType === "offline" && !selectedPref) {
      toast.showError(eventDetailCopy.errors.prefectureRequired);
      return;
    }
    createMut.mutate({
      eventId,
      message: message.trim() || undefined,
      prefecture: selectedPref || undefined,
    });
  }, [createMut, eventId, locationType, message, selectedPref, toast]);

  const shareParticipation = useCallback(() => {
    const text = `🎉「${eventTitle}」に参加表明しました！\n一緒に行こう👇\n#君斗りんくのすれ違ひ通信`;
    void openExternalUrl(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`);
  }, [eventTitle]);

  const hasParticipated = Boolean(mine);

  return (
    <View style={styles.wrap}>
      <AvatarStack avatars={participantAvatars} count={participantCount} />

      {hasParticipated ? (
        <View style={styles.doneRow}>
          <View style={styles.doneBadge}>
            <MaterialIcons name="check-circle" size={16} color={palette.kimitoOrange} />
            <Text style={styles.doneText}>{eventDetailCopy.actions.participateDone}</Text>
          </View>
          <View style={styles.doneActions}>
            <Pressable
              onPress={openForm}
              accessibilityRole="button"
              accessibilityLabel={eventDetailCopy.actions.edit}
              style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.secondaryBtnText}>{eventDetailCopy.actions.edit}</Text>
            </Pressable>
            <Pressable
              onPress={shareParticipation}
              accessibilityRole="link"
              accessibilityLabel="Xで参加表明をシェア"
              style={({ pressed }) => [styles.xShareMini, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.xShareMiniText}>𝕏でシェア</Text>
            </Pressable>
            <Pressable
              onPress={() => cancelMut.mutate({ eventId })}
              disabled={cancelMut.isPending}
              accessibilityRole="button"
              accessibilityLabel="参加表明を取り消す"
              style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.cancelBtnText}>取消</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable
          onPress={openForm}
          accessibilityRole="button"
          accessibilityLabel={eventDetailCopy.actions.participate}
          style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
        >
          <MaterialIcons name="front-hand" size={18} color={palette.white} />
          <Text style={styles.primaryBtnText}>{eventDetailCopy.actions.participate}</Text>
        </Pressable>
      )}

      <Modal visible={modalOpen} animationType="slide" transparent onRequestClose={() => setModalOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setModalOpen(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>{eventDetailCopy.section.participation}</Text>
            <Text style={styles.modalEventTitle} numberOfLines={2}>
              {eventTitle}
            </Text>

            {locationType === "offline" && (
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>{eventDetailCopy.labels.prefecture}</Text>
                <Pressable
                  onPress={() => setShowPrefList((v) => !v)}
                  style={styles.prefPicker}
                  accessibilityRole="button"
                >
                  <Text style={selectedPref ? styles.prefValue : styles.prefPlaceholder}>
                    {selectedPref || eventDetailCopy.labels.prefectureRequired}
                  </Text>
                  <MaterialIcons
                    name={showPrefList ? "expand-less" : "expand-more"}
                    size={22}
                    color={color.textMuted}
                  />
                </Pressable>
                {showPrefList && (
                  <ScrollView style={styles.prefScroll} nestedScrollEnabled>
                    {regionGroups.map((group) => (
                      <View key={group.name}>
                        <Text style={styles.regionLabel}>{group.name}</Text>
                        {group.prefectures.map((pref) => (
                          <Pressable
                            key={pref}
                            onPress={() => {
                              setSelectedPref(pref);
                              setShowPrefList(false);
                            }}
                            style={({ pressed }) => [
                              styles.prefOption,
                              selectedPref === pref && styles.prefOptionActive,
                              pressed && { opacity: 0.85 },
                            ]}
                          >
                            <Text
                              style={[
                                styles.prefOptionText,
                                selectedPref === pref && styles.prefOptionTextActive,
                              ]}
                            >
                              {pref}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{eventDetailCopy.labels.message}</Text>
              <TextInput
                style={styles.messageInput}
                placeholder="楽しみにしてます！"
                placeholderTextColor={color.textHint}
                value={message}
                onChangeText={setMessage}
                multiline
                maxLength={500}
                accessibilityLabel={eventDetailCopy.labels.message}
              />
            </View>

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setModalOpen(false)}
                style={({ pressed }) => [styles.modalCancel, pressed && { opacity: 0.85 }]}
              >
                <Text style={styles.modalCancelText}>{eventDetailCopy.actions.cancel}</Text>
              </Pressable>
              <Pressable
                onPress={submit}
                disabled={createMut.isPending}
                style={({ pressed }) => [styles.modalSubmit, pressed && { opacity: 0.9 }]}
              >
                {createMut.isPending ? (
                  <ActivityIndicator color={palette.white} />
                ) : (
                  <Text style={styles.modalSubmitText}>
                    {mine ? eventDetailCopy.actions.update : eventDetailCopy.actions.submit}
                  </Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 4,
    gap: 8,
  },
  avatarStackRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  avatarStack: {
    flexDirection: "row",
    alignItems: "center",
  },
  stackAvatarWrap: {
    borderWidth: 2,
    borderColor: color.surface,
    borderRadius: 14,
  },
  stackAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  stackAvatarFallback: {
    backgroundColor: color.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  participantCountText: {
    fontSize: 12,
    fontWeight: "600",
    color: color.textMuted,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 44,
    borderRadius: 999,
    backgroundColor: palette.kimitoOrange,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  primaryBtnText: {
    color: palette.white,
    fontSize: 14,
    fontWeight: "800",
  },
  doneRow: {
    gap: 8,
  },
  doneBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  doneText: {
    fontSize: 13,
    fontWeight: "700",
    color: palette.kimitoOrange,
  },
  doneActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  secondaryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.bg,
  },
  secondaryBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: color.textSecondary,
  },
  xShareMini: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: color.textPrimary,
  },
  xShareMiniText: {
    fontSize: 12,
    fontWeight: "700",
    color: color.textWhite,
  },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: color.textMuted,
    textDecorationLine: "underline",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: color.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === "web" ? 28 : 36,
    maxHeight: "85%",
    gap: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: color.textPrimary,
  },
  modalEventTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: color.textSecondary,
    lineHeight: 20,
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: color.textSecondary,
  },
  prefPicker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: color.bg,
  },
  prefValue: {
    fontSize: 14,
    color: color.textPrimary,
    fontWeight: "600",
  },
  prefPlaceholder: {
    fontSize: 14,
    color: color.textHint,
  },
  prefScroll: {
    maxHeight: 180,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: 10,
    backgroundColor: color.bg,
  },
  regionLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: color.textMuted,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 4,
  },
  prefOption: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  prefOptionActive: {
    backgroundColor: color.accentIndigo + "18",
  },
  prefOptionText: {
    fontSize: 14,
    color: color.textPrimary,
  },
  prefOptionTextActive: {
    fontWeight: "700",
    color: color.accentIndigo,
  },
  messageInput: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: color.textPrimary,
    backgroundColor: color.bg,
    textAlignVertical: "top",
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  modalCancel: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: color.border,
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: "700",
    color: color.textMuted,
  },
  modalSubmit: {
    flex: 2,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: palette.kimitoOrange,
  },
  modalSubmitText: {
    fontSize: 14,
    fontWeight: "800",
    color: palette.white,
  },
});
