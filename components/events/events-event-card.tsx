import { View, Text, StyleSheet, TextInput, Pressable } from "react-native";
import { useState, useCallback } from "react";
import MaterialIcons from "@/lib/icons/material-icons";
import { trpc } from "@/lib/trpc";
import { color } from "@/theme/tokens";
import { openExternalUrl } from "@/lib/navigation/external-links";
import { EventParticipationPanel } from "@/components/events/event-participation-panel";
import { EventCreatorLink } from "@/components/events/event-creator-link";
import { TYPE_TAG_LABELS } from "@/lib/events/type-tag-labels";

export { TYPE_TAG_LABELS };

export function formatEventDateTime(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  const mm = d.getMonth() + 1;
  const dd = d.getDate();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${mm}/${dd} ${hh}:${mi}`;
}

/** イベント1件のカード。一覧で使う共通表示。 */
export function EventCard({
  id,
  creatorName,
  creatorUsername,
  creatorXId,
  creatorXUrl,
  creatorProfileImage,
  title,
  typeTags,
  locationType,
  prefecture,
  venueName,
  onlineUrl,
  startAt,
  status,
  visibility,
  participantCount,
  participantAvatars,
  footer,
}: {
  id: number;
  creatorName?: string | null;
  creatorUsername?: string | null;
  creatorXId?: string | null;
  creatorXUrl?: string | null;
  creatorProfileImage?: string | null;
  title: string;
  typeTags: string[];
  locationType: string;
  prefecture: string | null;
  venueName: string | null;
  onlineUrl: string | null;
  startAt: string | Date;
  status: string;
  visibility: string;
  participantCount?: number;
  participantAvatars?: (string | null)[];
  footer?: React.ReactNode;
}) {
  const [revealed, setRevealed] = useState<{ venueName: string | null; onlineUrl: string | null } | null>(
    null,
  );
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [code, setCode] = useState("");
  const [revealError, setRevealError] = useState("");
  const revealMut = trpc.event.reveal.useMutation();

  const isUnlisted = visibility === "unlisted";
  const effectiveVenue = revealed ? revealed.venueName : venueName;
  const effectiveUrl = revealed ? revealed.onlineUrl : onlineUrl;

  const place =
    locationType === "online"
      ? effectiveUrl
        ? "オンライン"
        : isUnlisted
          ? "オンライン（合言葉で開く）"
          : "オンライン"
      : [prefecture, effectiveVenue].filter(Boolean).join(" ") || "場所未設定";

  const openLink = useCallback(() => {
    if (effectiveUrl) void openExternalUrl(effectiveUrl);
  }, [effectiveUrl]);

  const shareOnX = useCallback(() => {
    const d = typeof startAt === "string" ? new Date(startAt) : startAt;
    const mm = d.getMonth() + 1;
    const dd = d.getDate();
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    const placeStr =
      locationType === "online"
        ? "オンライン"
        : [prefecture, venueName].filter(Boolean).join(" ") || "場所未定";
    const text = `【集まり】${title}\n${mm}/${dd} ${hh}:${mi}〜 ${placeStr}\n#君斗りんくのすれ違ひ通信`;
    void openExternalUrl(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`);
  }, [title, startAt, locationType, prefecture, venueName]);

  const handleReveal = useCallback(() => {
    setRevealError("");
    if (!code.trim()) {
      setRevealError("合言葉を入れてください");
      return;
    }
    revealMut.mutate(
      { eventId: id, accessCode: code.trim() },
      {
        onSuccess: (data) => {
          setRevealed(data);
          setShowCodeInput(false);
          setCode("");
        },
        onError: (err) => setRevealError(err.message),
      },
    );
  }, [code, id, revealMut]);

  return (
    <View style={styles.card}>
      <View style={styles.cardTopRow}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {title}
        </Text>
        {status === "live" && (
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveBadgeText}>ライブ中</Text>
          </View>
        )}
      </View>

      {(creatorName || creatorUsername || creatorXUrl || creatorProfileImage || creatorXId) && (
        <EventCreatorLink
          creatorName={creatorName}
          creatorUsername={creatorUsername}
          creatorXId={creatorXId}
          creatorProfileImage={creatorProfileImage}
          creatorXUrl={creatorXUrl}
        />
      )}

      <View style={styles.cardMetaRow}>
        <MaterialIcons
          name={locationType === "online" ? "videocam" : "place"}
          size={14}
          color={color.textMuted}
        />
        <Text style={styles.cardMeta}>{place}</Text>
        <MaterialIcons name="schedule" size={14} color={color.textMuted} style={{ marginLeft: 8 }} />
        <Text style={styles.cardMeta}>{formatEventDateTime(startAt)}</Text>
        {isUnlisted && (
          <View style={styles.lockChip}>
            <MaterialIcons name="lock" size={11} color={color.warning} />
            <Text style={styles.lockChipText}>限定</Text>
          </View>
        )}
      </View>

      {typeTags.length > 0 && (
        <View style={styles.tagRow}>
          {typeTags.map((t) => (
            <View key={t} style={styles.tagChip}>
              <Text style={styles.tagChipText}>{TYPE_TAG_LABELS[t] ?? t}</Text>
            </View>
          ))}
        </View>
      )}

      {locationType === "online" && effectiveUrl && (
        <Pressable
          onPress={openLink}
          accessibilityRole="link"
          accessibilityLabel="配信または通話を開く"
          style={({ pressed }) => [styles.joinBtn, pressed && { opacity: 0.85 }]}
        >
          <MaterialIcons name="open-in-new" size={16} color={color.textWhite} />
          <Text style={styles.joinBtnText}>配信/通話を開く</Text>
        </Pressable>
      )}

      {isUnlisted && !revealed && (
        <View style={styles.revealBox}>
          {!showCodeInput ? (
            <Pressable
              onPress={() => setShowCodeInput(true)}
              accessibilityRole="button"
              accessibilityLabel="合言葉を入れて場所を見る"
              style={({ pressed }) => [styles.revealOpenBtn, pressed && { opacity: 0.85 }]}
            >
              <MaterialIcons name="lock-open" size={15} color={color.accentIndigo} />
              <Text style={styles.revealOpenText}>合言葉を入れて場所を見る</Text>
            </Pressable>
          ) : (
            <>
              <TextInput
                style={styles.input}
                placeholder="合言葉"
                placeholderTextColor={color.textHint}
                value={code}
                onChangeText={setCode}
                autoCapitalize="none"
                secureTextEntry
                accessibilityLabel="合言葉"
              />
              {revealError !== "" && <Text style={styles.formError}>{revealError}</Text>}
              <Pressable
                onPress={handleReveal}
                disabled={revealMut.isPending}
                accessibilityRole="button"
                accessibilityLabel="合言葉を確認して開く"
                style={({ pressed }) => [styles.revealSubmitBtn, pressed && { opacity: 0.85 }]}
              >
                <Text style={styles.revealSubmitText}>
                  {revealMut.isPending ? "確認中..." : "開く"}
                </Text>
              </Pressable>
            </>
          )}
        </View>
      )}

      {visibility === "public" && (
        <Pressable
          onPress={shareOnX}
          accessibilityRole="link"
          accessibilityLabel="Xでシェア"
          style={({ pressed }) => [styles.xShareBtn, pressed && { opacity: 0.7 }]}
        >
          <Text style={styles.xShareText}>𝕏でシェア</Text>
        </Pressable>
      )}

      <EventParticipationPanel
        eventId={id}
        eventTitle={title}
        locationType={locationType}
        prefecture={prefecture}
        participantCount={participantCount}
        participantAvatars={participantAvatars}
      />

      {footer}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: color.surface,
    borderRadius: 16,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: color.border,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: color.textPrimary,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: color.danger,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: color.textWhite,
  },
  liveBadgeText: {
    color: color.textWhite,
    fontSize: 10,
    fontWeight: "800",
  },
  cardMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexWrap: "wrap",
  },
  cardMeta: {
    fontSize: 12,
    color: color.textMuted,
  },
  lockChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginLeft: 8,
    backgroundColor: color.warning + "22",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  lockChipText: {
    fontSize: 10,
    color: color.warning,
    fontWeight: "700",
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tagChip: {
    backgroundColor: color.accentIndigo + "1A",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tagChipText: {
    fontSize: 11,
    color: color.accentIndigo,
    fontWeight: "600",
  },
  creatorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  creatorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    flexShrink: 0,
  },
  creatorAvatarFallback: {
    backgroundColor: color.bg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: color.border,
  },
  creatorName: {
    fontSize: 13,
    fontWeight: "600",
    color: color.textSecondary,
    flexShrink: 1,
  },
  xChip: {
    backgroundColor: color.textPrimary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 2,
  },
  xChipText: {
    color: color.textWhite,
    fontSize: 11,
    fontWeight: "700",
  },
  joinBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: color.accentIndigo,
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 2,
  },
  joinBtnText: {
    color: color.textWhite,
    fontSize: 13,
    fontWeight: "700",
  },
  revealBox: {
    gap: 8,
    marginTop: 2,
  },
  revealOpenBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: color.accentIndigo,
    borderRadius: 10,
    paddingVertical: 9,
  },
  revealOpenText: {
    color: color.accentIndigo,
    fontSize: 13,
    fontWeight: "700",
  },
  revealSubmitBtn: {
    backgroundColor: color.accentIndigo,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  revealSubmitText: {
    color: color.textWhite,
    fontSize: 13,
    fontWeight: "700",
  },
  input: {
    backgroundColor: color.bg,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: color.textPrimary,
    borderWidth: 1,
    borderColor: color.border,
  },
  formError: {
    color: color.danger,
    fontSize: 12,
  },
  xShareBtn: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: color.textPrimary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 2,
  },
  xShareText: {
    color: color.textWhite,
    fontSize: 12,
    fontWeight: "700",
  },
});
