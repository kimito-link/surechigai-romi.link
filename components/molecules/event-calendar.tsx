/**
 * EventCalendar — イベント「予定」を月めくりカレンダーで見せる。
 *
 * 君斗りんくのすれ違ひ通信「集まり」画面の予定タブ用。
 * - 月ヘッダー（◀ 2026年6月 ▶）で前後の月へ移動
 * - 7×6 のマスに各日を並べ、その日に予定があれば種別色のドットを最大3個＋「+N」
 * - 日をタップすると onSelectDate(dateKey) を呼び、選択日をハイライト
 *
 * イベントは startAt（ISO文字列 or Date）から「YYYY-MM-DD」のローカル日付キーで
 * グルーピングする。親（events.tsx）が選択日のイベント一覧を下に出す前提。
 */

import { View, Text, Pressable, StyleSheet } from "react-native";
import { useMemo } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { color } from "@/theme/tokens";

/** カレンダーが必要とする最小のイベント形（events.tsx の listUpcoming 行と互換）。 */
export type CalendarEvent = {
  id: number;
  startAt: string | Date;
  typeTags: string[];
  status: string;
};

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"] as const;

/** 種別タグごとのドット色。未知のタグはアクセント色。 */
const TAG_COLOR: Record<string, string> = {
  haishin: color.accentPrimary, // 配信＝ピンク
  totsumachi: color.warning, // 凸待ち＝パープル
  offkai: color.accentIndigo, // オフ会＝ティール
  sagyo: color.textMuted, // 作業通話＝グレー
  utawaku: color.success, // 歌枠＝グリーン
  other: color.textMuted,
};

/** Date / ISO文字列 → ローカル時間の "YYYY-MM-DD" キー。 */
export function toDateKey(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** イベント1件の代表ドット色（先頭タグ基準）。タグ無しはアクセント。 */
function dotColorFor(e: CalendarEvent): string {
  const t = e.typeTags[0];
  return (t && TAG_COLOR[t]) || color.accentIndigo;
}

export function EventCalendar({
  events,
  /** 表示中の月の任意の日（1日でよい）。 */
  monthAnchor,
  selectedKey,
  onSelectDate,
  onChangeMonth,
}: {
  events: CalendarEvent[];
  monthAnchor: Date;
  selectedKey: string | null;
  onSelectDate: (dateKey: string) => void;
  onChangeMonth: (delta: number) => void;
}) {
  const year = monthAnchor.getFullYear();
  const month = monthAnchor.getMonth(); // 0-11

  // 日付キー → その日のイベント配列
  const byDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      if (e.status === "canceled") continue;
      const key = toDateKey(e.startAt);
      const arr = map.get(key);
      if (arr) arr.push(e);
      else map.set(key, [e]);
    }
    return map;
  }, [events]);

  // カレンダーのマス（前月の余白 + 当月日 + 翌月の余白で 6週=42マス）
  const cells = useMemo(() => {
    const first = new Date(year, month, 1);
    const startWeekday = first.getDay(); // 0=日
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const out: { day: number | null; key: string | null }[] = [];
    for (let i = 0; i < startWeekday; i++) out.push({ day: null, key: null });
    const pad = (n: number) => String(n).padStart(2, "0");
    for (let d = 1; d <= daysInMonth; d++) {
      out.push({ day: d, key: `${year}-${pad(month + 1)}-${pad(d)}` });
    }
    while (out.length % 7 !== 0) out.push({ day: null, key: null });
    return out;
  }, [year, month]);

  const todayKey = useMemo(() => toDateKey(new Date()), []);

  return (
    <View style={styles.wrap}>
      {/* 月ヘッダー */}
      <View style={styles.header}>
        <Pressable
          onPress={() => onChangeMonth(-1)}
          hitSlop={10}
          style={({ pressed }) => [styles.navBtn, pressed && { opacity: 0.6 }]}
        >
          <MaterialIcons name="chevron-left" size={24} color={color.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>
          {year}年{month + 1}月
        </Text>
        <Pressable
          onPress={() => onChangeMonth(1)}
          hitSlop={10}
          style={({ pressed }) => [styles.navBtn, pressed && { opacity: 0.6 }]}
        >
          <MaterialIcons name="chevron-right" size={24} color={color.textPrimary} />
        </Pressable>
      </View>

      {/* 曜日 */}
      <View style={styles.weekRow}>
        {WEEKDAYS.map((w, i) => (
          <View key={w} style={styles.weekCell}>
            <Text
              style={[
                styles.weekText,
                i === 0 && { color: color.danger },
                i === 6 && { color: color.accentIndigo },
              ]}
            >
              {w}
            </Text>
          </View>
        ))}
      </View>

      {/* 日マス */}
      <View style={styles.grid}>
        {cells.map((c, idx) => {
          if (c.day === null) return <View key={`e${idx}`} style={styles.dayCell} />;
          const dayEvents = (c.key && byDay.get(c.key)) || [];
          const isSelected = c.key === selectedKey;
          const isToday = c.key === todayKey;
          const weekday = idx % 7;
          const hasLive = dayEvents.some((e) => e.status === "live");
          return (
            <Pressable
              key={c.key}
              onPress={() => c.key && onSelectDate(c.key)}
              style={({ pressed }) => [styles.dayCell, pressed && { opacity: 0.7 }]}
            >
              <View
                style={[
                  styles.dayInner,
                  isSelected && styles.dayInnerSelected,
                  isToday && !isSelected && styles.dayInnerToday,
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    weekday === 0 && { color: color.danger },
                    weekday === 6 && { color: color.accentIndigo },
                    isSelected && { color: color.textWhite, fontWeight: "800" },
                  ]}
                >
                  {c.day}
                </Text>
                {/* ドット（最大3個 + 余りは +N） */}
                {dayEvents.length > 0 && (
                  <View style={styles.dotRow}>
                    {dayEvents.slice(0, 3).map((e, i) => (
                      <View
                        key={`${e.id}-${i}`}
                        style={[
                          styles.dot,
                          {
                            backgroundColor:
                              e.status === "live" ? color.danger : dotColorFor(e),
                          },
                        ]}
                      />
                    ))}
                    {dayEvents.length > 3 && (
                      <Text style={styles.moreText}>+{dayEvents.length - 3}</Text>
                    )}
                  </View>
                )}
                {/* ライブ中の日は枠を強調 */}
                {hasLive && !isSelected && <View style={styles.liveRing} pointerEvents="none" />}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const CELL = 14.2857; // 100/7 (%) — flexBasis で7等分

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: color.surface,
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: color.border,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  navBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: color.textPrimary,
  },
  weekRow: {
    flexDirection: "row",
  },
  weekCell: {
    flexBasis: `${CELL}%`,
    alignItems: "center",
    paddingVertical: 4,
  },
  weekText: {
    fontSize: 11,
    fontWeight: "700",
    color: color.textMuted,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    flexBasis: `${CELL}%`,
    aspectRatio: 1,
    padding: 2,
  },
  dayInner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 5,
    borderRadius: 10,
    position: "relative",
  },
  dayInnerSelected: {
    backgroundColor: color.accentPrimary,
  },
  dayInnerToday: {
    borderWidth: 1,
    borderColor: color.accentIndigo,
  },
  dayText: {
    fontSize: 13,
    fontWeight: "600",
    color: color.textPrimary,
  },
  dotRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginTop: 3,
    minHeight: 6,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  moreText: {
    fontSize: 8,
    color: color.textMuted,
    fontWeight: "700",
    marginLeft: 1,
  },
  liveRing: {
    position: "absolute",
    top: 1,
    left: 1,
    right: 1,
    bottom: 1,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: color.danger,
  },
});
