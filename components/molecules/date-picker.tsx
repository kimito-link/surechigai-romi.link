/**
 * Web対応の日付ピッカーコンポーネント
 * Web/ネイティブ共通でカスタムカレンダーモーダルを使用
 */

import { Platform, View, Text, Pressable, Modal, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { color, palette } from "@/theme/tokens";
import { useState, useEffect } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

interface DatePickerProps {
  value: string; // YYYY-MM-DD format
  onChange: (date: string) => void;
  placeholder?: string;
  minDate?: string;
  maxDate?: string;
}

// 月の日数を取得
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

// 月の最初の曜日を取得（0=日曜日）
function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

// 日付をYYYY-MM-DD形式にフォーマット
function formatDate(year: number, month: number, day: number): string {
  const m = (month + 1).toString().padStart(2, "0");
  const d = day.toString().padStart(2, "0");
  return `${year}-${m}-${d}`;
}

// YYYY-MM-DD形式の日付をパース
function parseDate(dateStr: string): { year: number; month: number; day: number } | null {
  if (!dateStr) return null;
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return {
    year: parseInt(match[1], 10),
    month: parseInt(match[2], 10) - 1, // 0-indexed
    day: parseInt(match[3], 10),
  };
}

// 日付を表示用にフォーマット
function formatDisplayDate(dateStr: string): string {
  const parsed = parseDate(dateStr);
  if (!parsed) return "";
  return `${parsed.year}年${parsed.month + 1}月${parsed.day}日`;
}

const MONTHS = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

const triggerHaptic = () => {
  if (Platform.OS !== "web") {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
};

export function DatePicker({ value, onChange, placeholder = "日付を選択", minDate, maxDate }: DatePickerProps) {
  const [showCalendar, setShowCalendar] = useState(false);
  
  // カレンダー表示用の年月
  const today = new Date();
  const parsed = parseDate(value);
  const [viewYear, setViewYear] = useState(parsed?.year || today.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed?.month ?? today.getMonth());

  // 値が変更されたらカレンダーの表示月も更新
  useEffect(() => {
    const p = parseDate(value);
    if (p) {
      setViewYear(p.year);
      setViewMonth(p.month);
    }
  }, [value]);

  // カレンダーの日付配列を作成
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  const handlePrevMonth = () => {
    triggerHaptic();
    if (viewMonth === 0) {
      setViewYear(viewYear - 1);
      setViewMonth(11);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    triggerHaptic();
    if (viewMonth === 11) {
      setViewYear(viewYear + 1);
      setViewMonth(0);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleSelectDate = (day: number) => {
    triggerHaptic();
    const dateStr = formatDate(viewYear, viewMonth, day);
    onChange(dateStr);
    setShowCalendar(false);
  };

  const isSelected = (day: number): boolean => {
    if (!value) return false;
    const selected = parseDate(value);
    if (!selected) return false;
    return selected.year === viewYear && selected.month === viewMonth && selected.day === day;
  };

  const isToday = (day: number): boolean => {
    return today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;
  };

  // 日付が選択可能かチェック
  const isDateDisabled = (day: number): boolean => {
    const dateStr = formatDate(viewYear, viewMonth, day);
    if (minDate && dateStr < minDate) return true;
    if (maxDate && dateStr > maxDate) return true;
    return false;
  };

  // カレンダーコンテンツ
  const CalendarContent = () => (
    <View style={styles.calendarContainer}>
      {/* ヘッダー */}
      <View style={styles.calendarHeader}>
        <Pressable 
          onPress={handlePrevMonth} 
          style={({ pressed }) => [
            styles.navButton,
            pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] },
          ]}
          accessibilityLabel="前の月"
        >
          <MaterialIcons name="chevron-left" size={24} color={color.textWhite} />
        </Pressable>
        <Text style={styles.monthYearText}>
          {viewYear}年 {MONTHS[viewMonth]}
        </Text>
        <Pressable 
          onPress={handleNextMonth} 
          style={({ pressed }) => [
            styles.navButton,
            pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] },
          ]}
          accessibilityLabel="次の月"
        >
          <MaterialIcons name="chevron-right" size={24} color={color.textWhite} />
        </Pressable>
      </View>

      {/* 曜日ヘッダー */}
      <View style={styles.weekdayHeader}>
        {WEEKDAYS.map((day, index) => (
          <View key={day} style={styles.weekdayCell}>
            <Text style={[
              styles.weekdayText,
              index === 0 && styles.sundayText,
              index === 6 && styles.saturdayText,
            ]}>
              {day}
            </Text>
          </View>
        ))}
      </View>

      {/* カレンダーグリッド */}
      <View style={styles.calendarGrid}>
        {calendarDays.map((day, index) => (
          <View key={index} style={styles.dayCell}>
            {day !== null && (
              <Pressable
                onPress={() => !isDateDisabled(day) && handleSelectDate(day)}
                disabled={isDateDisabled(day)}
                style={({ pressed }) => [
                  styles.dayButton,
                  isSelected(day) && styles.selectedDay,
                  isToday(day) && !isSelected(day) && styles.todayDay,
                  isDateDisabled(day) && styles.disabledDay,
                  pressed && !isDateDisabled(day) && { opacity: 0.7 },
                ]}
                accessibilityLabel={`${viewYear}年${viewMonth + 1}月${day}日`}
              >
                <Text style={[
                  styles.dayText,
                  isSelected(day) && styles.selectedDayText,
                  isToday(day) && !isSelected(day) && styles.todayDayText,
                ]}>
                  {day}
                </Text>
              </Pressable>
            )}
          </View>
        ))}
      </View>

      {/* 今日ボタン */}
      <Pressable
        onPress={() => {
          triggerHaptic();
          setViewYear(today.getFullYear());
          setViewMonth(today.getMonth());
        }}
        style={({ pressed }) => [
          styles.todayButton,
          pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] },
        ]}
        accessibilityLabel="今日の日付に移動"
      >
        <Text style={styles.todayButtonText}>今日</Text>
      </Pressable>

      {/* 閉じるボタン */}
      <Pressable
        onPress={() => setShowCalendar(false)}
        style={({ pressed }) => [
          styles.closeButton,
          pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] },
        ]}
        accessibilityLabel="カレンダーを閉じる"
      >
        <Text style={styles.closeButtonText}>閉じる</Text>
      </Pressable>
    </View>
  );

  // 表示テキスト
  const displayText = value ? formatDisplayDate(value) : placeholder;

  return (
    <>
      <Pressable
        onPress={() => {
          triggerHaptic();
          setShowCalendar(true);
        }}
        style={({ pressed }) => [
          styles.inputContainer,
          pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] },
        ]}
        accessibilityLabel={value ? `開催日: ${formatDisplayDate(value)}` : "開催日を選択"}
        accessibilityHint="タップしてカレンダーを開く"
      >
        <Text style={[styles.inputText, !value && styles.placeholderText]}>
          {displayText}
        </Text>
        <MaterialIcons name="calendar-today" size={20} color={color.textMuted} />
      </Pressable>

      {/* カレンダーモーダル */}
      <Modal
        visible={showCalendar}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCalendar(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowCalendar(false)}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <CalendarContent />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    backgroundColor: color.bg,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: color.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 48,
  },
  inputText: {
    color: color.textWhite,
    fontSize: 14,
  },
  placeholderText: {
    color: color.textSubtle,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: palette.black + "B3",
    justifyContent: "center",
    alignItems: "center",
  },
  calendarContainer: {
    backgroundColor: color.surface,
    borderRadius: 16,
    padding: 16,
    width: 320,
    maxWidth: "90%",
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  navButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  monthYearText: {
    color: color.textWhite,
    fontSize: 18,
    fontWeight: "bold",
  },
  weekdayHeader: {
    flexDirection: "row",
    marginBottom: 8,
  },
  weekdayCell: {
    flex: 1,
    alignItems: "center",
  },
  weekdayText: {
    color: color.textMuted,
    fontSize: 12,
    fontWeight: "500",
  },
  sundayText: {
    color: color.danger,
  },
  saturdayText: {
    color: color.info,
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: "14.28%",
    aspectRatio: 1,
    padding: 2,
  },
  dayButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  selectedDay: {
    backgroundColor: color.accentPrimary,
  },
  todayDay: {
    backgroundColor: color.border,
  },
  disabledDay: {
    opacity: 0.3,
  },
  dayText: {
    color: color.textWhite,
    fontSize: 14,
  },
  selectedDayText: {
    fontWeight: "bold",
  },
  todayDayText: {
    color: color.accentPrimary,
    fontWeight: "bold",
  },
  todayButton: {
    marginTop: 12,
    padding: 8,
    alignItems: "center",
  },
  todayButtonText: {
    color: color.accentPrimary,
    fontWeight: "500",
  },
  closeButton: {
    marginTop: 8,
    padding: 12,
    backgroundColor: color.border,
    borderRadius: 8,
    alignItems: "center",
  },
  closeButtonText: {
    color: color.textWhite,
    fontWeight: "500",
  },
});
