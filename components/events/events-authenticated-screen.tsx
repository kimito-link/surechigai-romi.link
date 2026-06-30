/**
 * イベント画面（予定 × 今ここにいるよ）
 * 君斗りんくのすれ違ひ通信 — event モジュールのフロント。
 *
 * 1画面でセグメント切替:
 *  - 予定（カレンダー）: 公開イベントの今後の予定一覧（未ログインでも閲覧可）
 *  - ライブ中（在席）: 今まさにライブ表明中の公開イベント
 *  - 主催（自分）: 自分のイベント一覧 + 新規作成 + ライブ表明/終了
 *
 * 会議の合意設計: 単一の events を status で「予定→ライブ→終了」と扱う。
 * 配信専用にせず汎用「集まり」。誰=X公開／場所=県・会場の粗い粒度。
 */

import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  Platform,
  Linking,
  Pressable,
} from "react-native";
import { useState, useCallback, useMemo } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { AppHeader } from "@/components/organisms/app-header";
import { toDateKey } from "@/lib/events/date-key";
import { toStartDate, type EventDateTimeValue } from "@/lib/events/datetime-value";
import {
  LazyEventCalendar,
  LazyEventDateTimePicker,
  LazyPrefectureSelector,
} from "@/lib/lazy-heavy-components";
import { LoginPreviewBanner } from "@/components/molecules/login-preview-banner";
import { useTabBarInset } from "@/hooks/use-tab-bar-inset";
import { useResponsive } from "@/hooks/use-responsive";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { color, palette } from "@/theme/tokens";
import { useRouter } from "expo-router";

type Segment = "calendar" | "live" | "host";

const TYPE_TAG_LABELS: Record<string, string> = {
  haishin: "配信",
  totsumachi: "凸待ち",
  offkai: "オフ会",
  sagyo: "作業通話",
  utawaku: "歌枠",
  other: "その他",
};

function formatDateTime(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  const mm = d.getMonth() + 1;
  const dd = d.getDate();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${mm}/${dd} ${hh}:${mi}`;
}

/** イベント1件のカード。一覧で使う共通表示。 */
function EventCard({
  id,
  creatorName,
  creatorXUrl,
  title,
  typeTags,
  locationType,
  prefecture,
  venueName,
  onlineUrl,
  startAt,
  status,
  visibility,
  footer,
}: {
  id: number;
  creatorName?: string | null;
  creatorXUrl?: string | null;
  title: string;
  typeTags: string[];
  locationType: string;
  prefecture: string | null;
  venueName: string | null;
  onlineUrl: string | null;
  startAt: string | Date;
  status: string;
  visibility: string;
  footer?: React.ReactNode;
}) {
  // 限定イベントの開示状態（合言葉入力で reveal した結果をここに保持）
  const [revealed, setRevealed] = useState<{ venueName: string | null; onlineUrl: string | null } | null>(null);
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

  const openX = useCallback(() => {
    if (creatorXUrl) Linking.openURL(creatorXUrl).catch(() => {});
  }, [creatorXUrl]);

  const openLink = useCallback(() => {
    if (effectiveUrl) Linking.openURL(effectiveUrl).catch(() => {});
  }, [effectiveUrl]);

  /** Xシェア: タイトル・日時・場所をツイートテキストにして intent/tweet へ飛ばす */
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
    Linking.openURL(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`).catch(() => {});
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

      {/* 主催（誰が＝公開）＋ X送客リンク */}
      {(creatorName || creatorXUrl) && (
        <Pressable
          onPress={openX}
          disabled={!creatorXUrl}
          style={({ pressed }) => [styles.creatorRow, pressed && creatorXUrl ? { opacity: 0.7 } : null]}
        >
          <MaterialIcons name="person" size={14} color={color.textMuted} />
          <Text style={styles.creatorName} numberOfLines={1}>
            {creatorName ?? "クリエイター"}
          </Text>
          {creatorXUrl && (
            <View style={styles.xChip}>
              <Text style={styles.xChipText}>𝕏で見る</Text>
            </View>
          )}
        </Pressable>
      )}

      <View style={styles.cardMetaRow}>
        <MaterialIcons
          name={locationType === "online" ? "videocam" : "place"}
          size={14}
          color={color.textMuted}
        />
        <Text style={styles.cardMeta}>{place}</Text>
        <MaterialIcons name="schedule" size={14} color={color.textMuted} style={{ marginLeft: 8 }} />
        <Text style={styles.cardMeta}>{formatDateTime(startAt)}</Text>
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

      {/* オンラインURLが見える場合は参加リンク */}
      {locationType === "online" && effectiveUrl && (
        <Pressable
          onPress={openLink}
          style={({ pressed }) => [styles.joinBtn, pressed && { opacity: 0.85 }]}
        >
          <MaterialIcons name="open-in-new" size={16} color={color.textWhite} />
          <Text style={styles.joinBtnText}>配信/通話を開く</Text>
        </Pressable>
      )}

      {/* 限定イベント: 合言葉で会場/URLを開く */}
      {isUnlisted && !revealed && (
        <View style={styles.revealBox}>
          {!showCodeInput ? (
            <Pressable
              onPress={() => setShowCodeInput(true)}
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
              />
              {revealError !== "" && <Text style={styles.formError}>{revealError}</Text>}
              <Pressable
                onPress={handleReveal}
                disabled={revealMut.isPending}
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

      {/* Xシェアボタン（公開イベントのみ。unlisted は合言葉が要るため省略） */}
      {visibility === "public" && (
        <Pressable
          onPress={shareOnX}
          style={({ pressed }) => [styles.xShareBtn, pressed && { opacity: 0.7 }]}
        >
          <Text style={styles.xShareText}>𝕏でシェア</Text>
        </Pressable>
      )}

      {footer}
    </View>
  );
}

/** 予定（カレンダー）タブ。月めくりカレンダー＋選択日のイベント一覧。 */
function CalendarList() {
  const q = trpc.event.listUpcoming.useQuery({ limit: 100 });
  // 表示中の月（その月の1日アンカー）。初期は今月。
  const [monthAnchor, setMonthAnchor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  // 選択中の日（YYYY-MM-DD）。初期は今日。
  const [selectedKey, setSelectedKey] = useState<string>(() => toDateKey(new Date()));

  const items = useMemo(() => q.data ?? [], [q.data]);

  const changeMonth = useCallback((delta: number) => {
    setMonthAnchor((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  }, []);

  // 選択日のイベント（時刻順）
  const selectedEvents = useMemo(
    () =>
      items
        .filter((e) => toDateKey(e.startAt) === selectedKey)
        .sort(
          (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
        ),
    [items, selectedKey],
  );

  // 選択日見出し用（M月D日(曜)）
  const selectedLabel = useMemo(() => {
    const [y, m, d] = selectedKey.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    const wd = ["日", "月", "火", "水", "木", "金", "土"][date.getDay()];
    return `${m}月${d}日(${wd})`;
  }, [selectedKey]);

  if (q.isLoading) return <EmptyOrLoading loading />;

  return (
    <View style={styles.list}>
      <LazyEventCalendar
        events={items}
        monthAnchor={monthAnchor}
        selectedKey={selectedKey}
        onSelectDate={setSelectedKey}
        onChangeMonth={changeMonth}
      />

      <Text style={styles.sectionLabel}>{selectedLabel}の予定</Text>
      {selectedEvents.length === 0 ? (
        <EmptyOrLoading message={"この日の予定はありません\nカレンダーの色つきの日をタップしてみてください"} />
      ) : (
        selectedEvents.map((e) => <EventCard key={e.id} {...e} />)
      )}
    </View>
  );
}

/** ライブ中（在席）タブ。 */
function LiveList() {
  const q = trpc.event.listLive.useQuery(undefined, { refetchInterval: 30_000 });
  if (q.isLoading) return <EmptyOrLoading loading />;
  const items = q.data ?? [];
  if (items.length === 0)
    return <EmptyOrLoading message={"今ライブ中の人はいません\n「主催」タブから自分の集まりをライブ表明できます"} />;
  return (
    <View style={styles.list}>
      {items.map((e) => (
        <EventCard key={e.id} {...e} />
      ))}
    </View>
  );
}

/** 主催（自分）タブ: 作成フォーム + 自分の一覧 + ライブ操作。 */
function HostPanel() {
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
  // 開始日時はカレンダー＋時刻プルダウンで決める（手入力なし）。初期は今夜20時相当。
  const [startDateTime, setStartDateTime] = useState<EventDateTimeValue>({
    dateKey: "",
    hour: 20,
    minute: 0,
  });
  const [typeTags, setTypeTags] = useState<string[]>([]);
  const [isUnlisted, setIsUnlisted] = useState(false);
  const [accessCode, setAccessCode] = useState("");
  const [formError, setFormError] = useState("");

  // 開始時刻のクイック選択（カレンダーを開かずに一発で決める）
  const quickStart = useCallback((preset: "now" | "1h" | "tonight" | "tomorrow") => {
    const d = new Date();
    if (preset === "now") {
      // そのまま（数分後）
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
    // 開始日時: 日付未選択なら1時間後を既定にする
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
      {/* 作成フォーム */}
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>集まりを立てる</Text>

        <TextInput
          style={styles.input}
          placeholder="タイトル（例: 凸待ち配信します）"
          placeholderTextColor={color.textHint}
          value={title}
          onChangeText={setTitle}
          maxLength={80}
        />

        {/* 種別（複数選択可・タップで選ぶ） */}
        <Text style={styles.fieldLabel}>種別（複数選べます）</Text>
        <View style={styles.tagSelectRow}>
          {Object.entries(TYPE_TAG_LABELS).map(([key, label]) => {
            const selected = typeTags.includes(key);
            return (
              <Pressable
                key={key}
                onPress={() => toggleTypeTag(key)}
                style={({ pressed }) => [
                  styles.tagSelectChip,
                  selected && styles.tagSelectChipActive,
                  pressed && { opacity: 0.8 },
                ]}
              >
                {selected && (
                  <MaterialIcons name="check" size={14} color={color.textWhite} style={{ marginRight: 4 }} />
                )}
                <Text style={[styles.tagSelectText, selected && styles.tagSelectTextActive]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* オンライン / リアル 切替 */}
        <View style={styles.toggleRow}>
          <Pressable
            onPress={() => setIsOnline(true)}
            style={[styles.toggleBtn, isOnline && styles.toggleBtnActive]}
          >
            <MaterialIcons
              name="videocam"
              size={16}
              color={isOnline ? color.textWhite : color.textMuted}
            />
            <Text style={[styles.toggleText, isOnline && styles.toggleTextActive]}>
              オンライン
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setIsOnline(false)}
            style={[styles.toggleBtn, !isOnline && styles.toggleBtnActive]}
          >
            <MaterialIcons
              name="place"
              size={16}
              color={!isOnline ? color.textWhite : color.textMuted}
            />
            <Text style={[styles.toggleText, !isOnline && styles.toggleTextActive]}>
              リアル
            </Text>
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
            />
          </>
        )}

        {/* 開始日時（カレンダー＋時刻プルダウン。手入力なし） */}
        <Text style={styles.fieldLabel}>開始日時</Text>
        <LazyEventDateTimePicker value={startDateTime} onChange={setStartDateTime} />

        {/* 開始時刻クイック選択 */}
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
              style={({ pressed }) => [styles.quickChip, pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.quickChipText}>{p.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* 公開 / 限定（合言葉）切替 */}
        <View style={styles.unlistedRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.unlistedTitle}>限定にする（合言葉が要る）</Text>
            <Text style={styles.unlistedHint}>
              オフ会など。会場/URLは合言葉を知る人だけに見える
            </Text>
          </View>
          <Pressable
            onPress={() => setIsUnlisted((v) => !v)}
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
          />
        )}

        {formError !== "" && <Text style={styles.formError}>{formError}</Text>}

        <Pressable
          onPress={handleCreate}
          disabled={createMut.isPending}
          style={({ pressed }) => [
            styles.createBtn,
            pressed && { opacity: 0.85 },
            createMut.isPending && { opacity: 0.6 },
          ]}
        >
          <Text style={styles.createBtnText}>
            {createMut.isPending ? "作成中..." : "予定を作成"}
          </Text>
        </Pressable>
      </View>

      {/* 自分のイベント一覧 */}
      <Text style={styles.sectionLabel}>あなたの集まり</Text>
      {myQuery.isLoading ? (
        <EmptyOrLoading loading />
      ) : items.length === 0 ? (
        <EmptyOrLoading message="まだありません。上から立ててみましょう" />
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
                    style={({ pressed }) => [styles.actionBtn, styles.goLiveBtn, pressed && { opacity: 0.85 }]}
                  >
                    <MaterialIcons name="sensors" size={16} color={color.textWhite} />
                    <Text style={styles.actionBtnText}>今ここにいるよ</Text>
                  </Pressable>
                )}
                {e.status === "live" && (
                  <Pressable
                    onPress={() => endMut.mutate({ eventId: e.id })}
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

function EmptyOrLoading({ loading, message }: { loading?: boolean; message?: string }) {
  return (
    <View style={styles.emptyBox}>
      <MaterialIcons
        name={loading ? "hourglass-empty" : "event-note"}
        size={32}
        color={color.textHint}
      />
      <Text style={styles.emptyText}>{loading ? "読み込み中..." : message}</Text>
    </View>
  );
}

export function EventsAuthenticatedScreen() {
  const { isDesktop } = useResponsive();
  const { isAuthenticated } = useAuth();
  const [segment, setSegment] = useState<Segment>("calendar");
  const router = useRouter();
  const tabInset = useTabBarInset();

  return (
    <ScreenContainer containerClassName="bg-background">
      <AppHeader
        title="集まり"
        showCharacters={false}
        isDesktop={isDesktop}
        showMenu={true}
        showLoginButton={!isAuthenticated}
        leftElement={
          <Pressable onPress={() => router.push("/(tabs)")} style={{ padding: 4 }}>
            <MaterialIcons name="home" size={24} color={palette.kimitoBlue} />
          </Pressable>
        }
      />

      {/* セグメント切替 */}
      <View style={styles.segmentBar}>
        {(
          [
            { key: "calendar", label: "予定", icon: "calendar-today" },
            { key: "live", label: "ライブ中", icon: "sensors" },
            { key: "host", label: "主催", icon: "add-circle-outline" },
          ] as const
        ).map((s) => (
          <Pressable
            key={s.key}
            onPress={() => setSegment(s.key)}
            style={[styles.segmentItem, segment === s.key && styles.segmentItemActive]}
          >
            <MaterialIcons
              name={s.icon}
              size={16}
              color={segment === s.key ? color.accentIndigo : color.textMuted}
            />
            <Text style={[styles.segmentText, segment === s.key && styles.segmentTextActive]}>
              {s.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: tabInset }]}
        showsVerticalScrollIndicator={false}
      >
        {!isAuthenticated && (
          <LoginPreviewBanner
            headline="ログインすると集まりを主催・ライブ表明できます"
            benefits={[
              { icon: "calendar-today", label: "予定は未ログインでも閲覧できます" },
              { icon: "sensors", label: "ライブ中の集まりをリアルタイムで見られる" },
              { icon: "add-circle-outline", label: "ログイン後に自分の集まりを作成できる" },
            ]}
          />
        )}
        {segment === "calendar" && <CalendarList />}
        {segment === "live" && <LiveList />}
        {segment === "host" &&
          (isAuthenticated ? (
            <HostPanel />
          ) : (
            <EmptyOrLoading message={"集まりを立てるにはXログインが必要です\n右上のボタンからログインしてください"} />
          ))}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  segmentBar: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  segmentItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
  },
  segmentItemActive: {
    borderColor: color.accentIndigo,
    backgroundColor: color.accentIndigo + "1A",
  },
  segmentText: {
    fontSize: 13,
    fontWeight: "600",
    color: color.textMuted,
  },
  segmentTextActive: {
    color: color.accentIndigo,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  list: {
    gap: 12,
  },
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
  // form
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
  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    gap: 10,
  },
  emptyText: {
    color: color.textHint,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
  // creator row + X link
  creatorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
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
  // join online link
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
  // reveal (unlisted)
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
  // quick start presets
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
  // unlisted toggle
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
  // X share button (public events only)
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
