/**
 * 主催タブ — PrefectureSelector / EventDateTimePicker chunk はタブ選択時のみ load。
 */
import { View, Text, StyleSheet, TextInput, Platform, Pressable } from "react-native";
import { useState, useCallback } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { toDateKey } from "@/lib/events/date-key";
import { toStartDate, type EventDateTimeValue } from "@/lib/events/datetime-value";
import { LazyEventDateTimePicker, LazyPrefectureSelector } from "@/lib/lazy-heavy-components";
import { trpc } from "@/lib/trpc";
import { color } from "@/theme/tokens";
import { EventCard, TYPE_TAG_LABELS } from "@/components/events/events-event-card";
import { EventsEmptyState } from "@/components/events/events-empty-state";

export function EventsHostPanel() {
  const utils = trpc.useUtils();
  const myQuery = trpc.event.listMine.useQuery();
  const createMut = trpc.event.create.useMutation({
    onSuccess: () => {
      utils.event.listMine.invalidate();
      utils.event.listUpcoming.invalidate();
    },
  });
  const goLiveMut = trpc.event.goLive.useMutation({
    onSuccess: () => {
      utils.event.listMine.invalidate();
      utils.event.listLive.invalidate();
    },
  });
  const endMut = trpc.event.endLive.useMutation({
    onSuccess: () => {
      utils.event.listMine.invalidate();
      utils.event.listLive.invalidate();
    },
  });

  const [title, setTitle] = useState("");
  const [isOnline, setIsOnline] = useState(true);
  const [onlineUrl, setOnlineUrl] = useState("");
  const [prefecture, setPrefecture] = useState("");
  const [isPrefOpen, setIsPrefOpen] = useState(false);
  const [venueName, setVenueName] = useState("");
  const [startDateTime, setStartDateTime] = useState<EventDateTimeValue>({
    dateKey: "",
    hour: 20,
    minute: 0,
  });
  const [typeTags, setTypeTags] = useState<string[]>([]);
  const [isUnlisted, setIsUnlisted] = useState(false);
  const [accessCode, setAccessCode] = useState("");
  const [formError, setFormError] = useState("");

  const quickStart = useCallback((preset: "now" | "1h" | "tonight" | "tomorrow") => {
    const d = new Date();
    if (preset === "now") {
      // そのまま
    } else if (preset === "1h") {
      d.setHours(d.getHours() + 1);
    } else if (preset === "tonight") {
      d.setHours(20, 0, 0, 0);
      if (d.getTime() < Date.now()) d.setDate(d.getDate() + 1);
    } else if (preset === "tomorrow") {
      d.setDate(d.getDate() + 1);
      d.setHours(20, 0, 0, 0);
    }
    setStartDateTime({ dateKey: toDateKey(d), hour: d.getHours(), minute: d.getMinutes() });
  }, []);

  const toggleTypeTag = useCallback((key: string) => {
    setTypeTags((prev) =>
      prev.includes(key) ? prev.filter((t) => t !== key) : prev.length >= 8 ? prev : [...prev, key],
    );
  }, []);

  const handleCreate = useCallback(() => {
    setFormError("");
    if (!title.trim()) {
      setFormError("タイトルを入れてください");
      return;
    }
    if (!isOnline && !prefecture) {
      setFormError("リアル開催は都道府県を選んでください");
      return;
    }
    const start = toStartDate(startDateTime) ?? new Date(Date.now() + 60 * 60 * 1000);
    if (Number.isNaN(start.getTime())) {
      setFormError("開始日時を選び直してください");
      return;
    }
    if (isUnlisted && !accessCode.trim()) {
      setFormError("限定にする場合は合言葉を決めてください");
      return;
    }
    createMut.mutate(
      {
        title: title.trim(),
        typeTags: typeTags.length > 0 ? typeTags : undefined,
        locationType: isOnline ? "online" : "offline",
        onlineUrl: isOnline ? onlineUrl.trim() || undefined : undefined,
        prefecture: !isOnline ? prefecture || undefined : undefined,
        venueName: !isOnline ? venueName.trim() || undefined : undefined,
        startAt: start.toISOString(),
        visibility: isUnlisted ? "unlisted" : "public",
        accessCode: isUnlisted ? accessCode.trim() : undefined,
      },
      {
        onSuccess: () => {
          setTitle("");
          setOnlineUrl("");
          setPrefecture("");
          setVenueName("");
          setStartDateTime({ dateKey: "", hour: 20, minute: 0 });
          setTypeTags([]);
          setIsUnlisted(false);
          setAccessCode("");
        },
        onError: (err) => setFormError(err.message),
      },
    );
  }, [title, isOnline, onlineUrl, prefecture, venueName, startDateTime, typeTags, isUnlisted, accessCode, createMut]);

  const items = myQuery.data ?? [];

  return (
    <View style={styles.list}>
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>集まりを立てる</Text>

        <TextInput
          style={styles.input}
          placeholder="タイトル（例: 凸待ち配信します）"
          placeholderTextColor={color.textHint}
          value={title}
          onChangeText={setTitle}
          maxLength={80}
          accessibilityLabel="集まりのタイトル"
        />

        <Text style={styles.fieldLabel}>種別（複数選べます）</Text>
        <View style={styles.tagSelectRow}>
          {Object.entries(TYPE_TAG_LABELS).map(([key, label]) => {
            const selected = typeTags.includes(key);
            return (
              <Pressable
                key={key}
                onPress={() => toggleTypeTag(key)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`種別 ${label}`}
                style={({ pressed }) => [
                  styles.tagSelectChip,
                  selected && styles.tagSelectChipActive,
                  pressed && { opacity: 0.8 },
                ]}
              >
                {selected && (
                  <MaterialIcons name="check" size={14} color={color.textWhite} style={{ marginRight: 4 }} />
                )}
                <Text style={[styles.tagSelectText, selected && styles.tagSelectTextActive]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.toggleRow}>
          <Pressable
            onPress={() => setIsOnline(true)}
            accessibilityRole="button"
            accessibilityState={{ selected: isOnline }}
            accessibilityLabel="オンライン開催"
            style={[styles.toggleBtn, isOnline && styles.toggleBtnActive]}
          >
            <MaterialIcons name="videocam" size={16} color={isOnline ? color.textWhite : color.textMuted} />
            <Text style={[styles.toggleText, isOnline && styles.toggleTextActive]}>オンライン</Text>
          </Pressable>
          <Pressable
            onPress={() => setIsOnline(false)}
            accessibilityRole="button"
            accessibilityState={{ selected: !isOnline }}
            accessibilityLabel="リアル開催"
            style={[styles.toggleBtn, !isOnline && styles.toggleBtnActive]}
          >
            <MaterialIcons name="place" size={16} color={!isOnline ? color.textWhite : color.textMuted} />
            <Text style={[styles.toggleText, !isOnline && styles.toggleTextActive]}>リアル</Text>
          </Pressable>
        </View>

        {isOnline ? (
          <TextInput
            style={styles.input}
            placeholder="配信/通話URL（YouTube・ニコ生など）"
            placeholderTextColor={color.textHint}
            value={onlineUrl}
            onChangeText={setOnlineUrl}
            autoCapitalize="none"
            accessibilityLabel="配信または通話のURL"
          />
        ) : (
          <>
            <LazyPrefectureSelector
              value={prefecture}
              onChange={setPrefecture}
              isOpen={isPrefOpen}
              onOpenChange={setIsPrefOpen}
              label="都道府県"
              required
              placeholder="都道府県を選ぶ"
            />
            <TextInput
              style={styles.input}
              placeholder="会場名（任意）"
              placeholderTextColor={color.textHint}
              value={venueName}
              onChangeText={setVenueName}
              accessibilityLabel="会場名"
            />
          </>
        )}

        <Text style={styles.fieldLabel}>開始日時</Text>
        <LazyEventDateTimePicker value={startDateTime} onChange={setStartDateTime} />

        <View style={styles.quickRow}>
          {(
            [
              { key: "now", label: "今すぐ" },
              { key: "1h", label: "1時間後" },
              { key: "tonight", label: "今夜20時" },
              { key: "tomorrow", label: "明日20時" },
            ] as const
          ).map((p) => (
            <Pressable
              key={p.key}
              onPress={() => quickStart(p.key)}
              accessibilityRole="button"
              accessibilityLabel={`開始日時 ${p.label}`}
              style={({ pressed }) => [styles.quickChip, pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.quickChipText}>{p.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.unlistedRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.unlistedTitle}>限定にする（合言葉が要る）</Text>
            <Text style={styles.unlistedHint}>オフ会など。会場/URLは合言葉を知る人だけに見える</Text>
          </View>
          <Pressable
            onPress={() => setIsUnlisted((v) => !v)}
            accessibilityRole="switch"
            accessibilityState={{ checked: isUnlisted }}
            accessibilityLabel="限定公開にする"
            style={[styles.switch, { backgroundColor: isUnlisted ? color.accentPrimary : color.border }]}
          >
            <View style={[styles.switchKnob, { transform: [{ translateX: isUnlisted ? 20 : 0 }] }]} />
          </Pressable>
        </View>
        {isUnlisted && (
          <TextInput
            style={styles.input}
            placeholder="合言葉（参加者に伝える）"
            placeholderTextColor={color.textHint}
            value={accessCode}
            onChangeText={setAccessCode}
            autoCapitalize="none"
            accessibilityLabel="合言葉"
          />
        )}

        {formError !== "" && <Text style={styles.formError}>{formError}</Text>}

        <Pressable
          onPress={handleCreate}
          disabled={createMut.isPending}
          accessibilityRole="button"
          accessibilityLabel="予定を作成"
          style={({ pressed }) => [
            styles.createBtn,
            pressed && { opacity: 0.85 },
            createMut.isPending && { opacity: 0.6 },
          ]}
        >
          <Text style={styles.createBtnText}>{createMut.isPending ? "作成中..." : "予定を作成"}</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionLabel}>あなたの集まり</Text>
      {myQuery.isLoading ? (
        <EventsEmptyState loading />
      ) : items.length === 0 ? (
        <EventsEmptyState message="まだありません。上から立ててみましょう" />
      ) : (
        items.map((e) => (
          <EventCard
            key={e.id}
            {...e}
            footer={
              <View style={styles.hostActions}>
                {e.status !== "live" && e.status !== "ended" && e.status !== "canceled" && (
                  <Pressable
                    onPress={() => goLiveMut.mutate({ eventId: e.id })}
                    accessibilityRole="button"
                    accessibilityLabel="今ここにいるよとライブ表明"
                    style={({ pressed }) => [styles.actionBtn, styles.goLiveBtn, pressed && { opacity: 0.85 }]}
                  >
                    <MaterialIcons name="sensors" size={16} color={color.textWhite} />
                    <Text style={styles.actionBtnText}>今ここにいるよ</Text>
                  </Pressable>
                )}
                {e.status === "live" && (
                  <Pressable
                    onPress={() => endMut.mutate({ eventId: e.id })}
                    accessibilityRole="button"
                    accessibilityLabel="ライブを終了する"
                    style={({ pressed }) => [styles.actionBtn, styles.endBtn, pressed && { opacity: 0.85 }]}
                  >
                    <MaterialIcons name="stop-circle" size={16} color={color.textWhite} />
                    <Text style={styles.actionBtnText}>終了する</Text>
                  </Pressable>
                )}
                {e.status === "ended" && <Text style={styles.endedLabel}>終了しました</Text>}
                {e.status === "canceled" && <Text style={styles.endedLabel}>キャンセル済み</Text>}
              </View>
            }
          />
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 12,
  },
  formCard: {
    backgroundColor: color.surface,
    borderRadius: 16,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: color.border,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: color.textPrimary,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: color.textSecondary,
    marginTop: 2,
  },
  tagSelectRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagSelectChip: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.bg,
  },
  tagSelectChipActive: {
    backgroundColor: color.accentIndigo,
    borderColor: color.accentIndigo,
  },
  tagSelectText: {
    fontSize: 13,
    fontWeight: "700",
    color: color.textSecondary,
  },
  tagSelectTextActive: {
    color: color.textWhite,
  },
  input: {
    backgroundColor: color.bg,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    fontSize: 14,
    color: color.textPrimary,
    borderWidth: 1,
    borderColor: color.border,
  },
  toggleRow: {
    flexDirection: "row",
    gap: 8,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: color.bg,
    borderWidth: 1,
    borderColor: color.border,
  },
  toggleBtnActive: {
    backgroundColor: color.accentIndigo,
    borderColor: color.accentIndigo,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: "600",
    color: color.textMuted,
  },
  toggleTextActive: {
    color: color.textWhite,
  },
  formError: {
    color: color.danger,
    fontSize: 12,
  },
  createBtn: {
    backgroundColor: color.accentPrimary,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 2,
  },
  createBtnText: {
    color: color.textWhite,
    fontSize: 15,
    fontWeight: "700",
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: color.textSecondary,
    marginTop: 8,
    marginBottom: 2,
  },
  hostActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  goLiveBtn: {
    backgroundColor: color.danger,
  },
  endBtn: {
    backgroundColor: color.textMuted,
  },
  actionBtnText: {
    color: color.textWhite,
    fontSize: 13,
    fontWeight: "700",
  },
  endedLabel: {
    fontSize: 12,
    color: color.textHint,
    fontStyle: "italic",
  },
  quickRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  quickChip: {
    backgroundColor: color.bg,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  quickChipText: {
    fontSize: 12,
    color: color.textSecondary,
    fontWeight: "600",
  },
  unlistedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 2,
  },
  unlistedTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: color.textPrimary,
  },
  unlistedHint: {
    fontSize: 11,
    color: color.textMuted,
    marginTop: 2,
  },
  switch: {
    width: 48,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  switchKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: color.textWhite,
  },
});
