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

import { View, Text, ScrollView, StyleSheet, Pressable } from "react-native";
import { lazy, Suspense, useState, useCallback, useMemo } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ChunkFallback } from "@/lib/chunk-fallback";
import { EventCard } from "@/components/events/events-event-card";
import { EventsEmptyState } from "@/components/events/events-empty-state";

const LazyEventsHostPanel = lazy(() =>
  import("@/components/events/events-host-panel").then((m) => ({
    default: m.EventsHostPanel,
  })),
);
import { ScreenContainer } from "@/components/organisms/screen-container";
import { TabScreenHeader } from "@/components/organisms/tab-screen-header";
import { toDateKey } from "@/lib/events/date-key";
import { LazyEventCalendar } from "@/lib/lazy-heavy-components";
import { LoginPreviewBanner } from "@/components/molecules/login-preview-banner";
import { useTabBarInset } from "@/hooks/use-tab-bar-inset";
import { useResponsive } from "@/hooks/use-responsive";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { color, palette } from "@/theme/tokens";
import { useRouter } from "expo-router";

type Segment = "calendar" | "live" | "host";

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

  if (q.isLoading) return <EventsEmptyState loading />;

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
        <EventsEmptyState message={"この日の予定はありません\nカレンダーの色つきの日をタップしてみてください"} />
      ) : (
        selectedEvents.map((e) => <EventCard key={e.id} {...e} />)
      )}
    </View>
  );
}

/** ライブ中（在席）タブ。 */
function LiveList() {
  const q = trpc.event.listLive.useQuery(undefined, { refetchInterval: 30_000 });
  if (q.isLoading) return <EventsEmptyState loading />;
  const items = q.data ?? [];
  if (items.length === 0)
    return <EventsEmptyState message={"今ライブ中の人はいません\n「主催」タブから自分の集まりをライブ表明できます"} />;
  return (
    <View style={styles.list}>
      {items.map((e) => (
        <EventCard key={e.id} {...e} />
      ))}
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
      <TabScreenHeader
        title="集まり"
        contextKey="events"
        showCharacters={false}
        isDesktop={isDesktop}
        showMenu={true}
        showLoginButton={!isAuthenticated}
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
            accessibilityRole="tab"
            accessibilityState={{ selected: segment === s.key }}
            accessibilityLabel={s.label}
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
            <Suspense fallback={<ChunkFallback minHeight={280} />}>
              <LazyEventsHostPanel />
            </Suspense>
          ) : (
            <EventsEmptyState message={"集まりを立てるにはXログインが必要です\n右上のボタンからログインしてください"} />
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
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: color.textSecondary,
    marginTop: 8,
    marginBottom: 2,
  },
});
