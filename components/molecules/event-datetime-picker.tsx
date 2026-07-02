/**
 * EventDateTimePicker — 集まりの開始日時を「手入力ゼロ」で決める。
 *
 * 日付は EventCalendar（月めくりカレンダー）で1日選択、時刻は 時(0-23)＋分(00/15/30/45)
 * をタップで選ぶ。自由入力の TextInput を使わないので、書式ミスが起きない。
 */
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { useMemo, useState } from "react";
import MaterialIcons from "@/lib/icons/material-icons";
import { color } from "@/theme/tokens";
import { EventCalendar } from "./event-calendar";
import { type EventDateTimeValue } from "@/lib/events/datetime-value";

export type { EventDateTimeValue } from "@/lib/events/datetime-value";
export { toStartDate } from "@/lib/events/datetime-value";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"] as const;
const MINUTES = [0, 15, 30, 45] as const;
const pad = (n: number) => String(n).padStart(2, "0");

export function EventDateTimePicker({
  value,
  onChange,
}: {
  value: EventDateTimeValue;
  onChange: (v: EventDateTimeValue) => void;
}) {
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [monthAnchor, setMonthAnchor] = useState(() => {
    const base = value.dateKey ? new Date(value.dateKey) : new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  const dateLabel = useMemo(() => {
    if (!value.dateKey) return "日付を選ぶ";
    const [y, m, d] = value.dateKey.split("-").map(Number);
    const wd = WEEKDAYS[new Date(y, m - 1, d).getDay()];
    return `${m}月${d}日(${wd})`;
  }, [value.dateKey]);

  const timeLabel = `${pad(value.hour)}:${pad(value.minute)}`;

  return (
    <View>
      <View style={styles.row}>
        <Pressable
          onPress={() => {
            setShowDate((v) => !v);
            setShowTime(false);
          }}
          style={({ pressed }) => [styles.field, pressed && { opacity: 0.8 }]}
        >
          <MaterialIcons name="calendar-today" size={18} color={color.accentIndigo} />
          <Text style={[styles.fieldText, !value.dateKey && styles.placeholder]} numberOfLines={1}>
            {dateLabel}
          </Text>
          <MaterialIcons name="arrow-drop-down" size={22} color={color.textHint} />
        </Pressable>

        <Pressable
          onPress={() => {
            setShowTime((v) => !v);
            setShowDate(false);
          }}
          style={({ pressed }) => [styles.field, styles.timeField, pressed && { opacity: 0.8 }]}
        >
          <MaterialIcons name="schedule" size={18} color={color.accentIndigo} />
          <Text style={styles.fieldText}>{timeLabel}</Text>
          <MaterialIcons name="arrow-drop-down" size={22} color={color.textHint} />
        </Pressable>
      </View>

      {showDate && (
        <View style={styles.panel}>
          <EventCalendar
            events={[]}
            monthAnchor={monthAnchor}
            selectedKey={value.dateKey || null}
            onSelectDate={(k) => {
              onChange({ ...value, dateKey: k });
              setShowDate(false);
            }}
            onChangeMonth={(delta) =>
              setMonthAnchor((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1))
            }
          />
        </View>
      )}

      {showTime && (
        <View style={[styles.panel, styles.timePanel]}>
          <View style={styles.timeBlock}>
            <Text style={styles.timeBlockLabel}>時</Text>
            <ScrollView style={styles.hourScroll} nestedScrollEnabled>
              <View style={styles.hourGrid}>
                {Array.from({ length: 24 }, (_, h) => h).map((h) => (
                  <Pressable
                    key={h}
                    onPress={() => onChange({ ...value, hour: h })}
                    style={[styles.cell, value.hour === h && styles.cellActive]}
                  >
                    <Text style={[styles.cellText, value.hour === h && styles.cellTextActive]}>
                      {pad(h)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.timeBlock}>
            <Text style={styles.timeBlockLabel}>分</Text>
            <View style={styles.minColumn}>
              {MINUTES.map((mn) => (
                <Pressable
                  key={mn}
                  onPress={() => onChange({ ...value, minute: mn })}
                  style={[styles.minCell, value.minute === mn && styles.cellActive]}
                >
                  <Text style={[styles.cellText, value.minute === mn && styles.cellTextActive]}>
                    {pad(mn)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 8,
  },
  field: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 48,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.bg,
  },
  timeField: {
    flex: 0,
    minWidth: 120,
  },
  fieldText: {
    flex: 1,
    color: color.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  placeholder: {
    color: color.textHint,
    fontWeight: "400",
  },
  panel: {
    marginTop: 8,
  },
  timePanel: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: color.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: color.border,
    padding: 12,
  },
  timeBlock: {
    flex: 1,
    gap: 8,
  },
  timeBlockLabel: {
    color: color.textSecondary,
    fontSize: 12,
    fontWeight: "800",
  },
  hourScroll: {
    maxHeight: 168,
  },
  hourGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  cell: {
    width: 44,
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  minColumn: {
    gap: 6,
  },
  minCell: {
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.bg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  cellActive: {
    backgroundColor: color.accentIndigo,
    borderColor: color.accentIndigo,
  },
  cellText: {
    color: color.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  cellTextActive: {
    color: color.textWhite,
  },
});
