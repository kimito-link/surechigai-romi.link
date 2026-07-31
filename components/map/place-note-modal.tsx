/**
 * components/map/place-note-modal.tsx
 *
 * 足あと1件に「その場所のメモ」を書くモーダル。
 * 設計は docs/place-info-DESIGN.md。
 *
 * 「ここのガソリンが安い」「この店が旨い」を、座標に固定して残すための入力。
 * 口コミ機能ではないので、評価・星・他人への返信は作らない。
 */
import { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { color, spacing, borderRadius, contentMaxWidth } from "@/theme/tokens";

const MAX_PLACE_NAME = 120;
const MAX_NOTE = 140;

/** ワンタップ定型文（手入力を減らす）。NGワード誤爆を避けた表現にしてある。 */
const NOTE_PRESETS = [
  "レギュラー ¥",
  "ここの飯が旨い",
  "駐車場あり",
  "景色がいい",
  "また来たい",
  "24時間営業",
] as const;

export function PlaceNoteModal({
  visible,
  currentPlaceName,
  currentNote,
  isSaving = false,
  onClose,
  onSave,
}: {
  visible: boolean;
  currentPlaceName: string | null | undefined;
  currentNote: string | null | undefined;
  isSaving?: boolean;
  onClose: () => void;
  onSave: (placeName: string, note: string) => void;
}) {
  const [placeName, setPlaceName] = useState(currentPlaceName ?? "");
  const [note, setNote] = useState(currentNote ?? "");

  // 別のピンを開いたときに前の入力が残らないようにする
  useEffect(() => {
    if (visible) {
      setPlaceName(currentPlaceName ?? "");
      setNote(currentNote ?? "");
    }
  }, [visible, currentPlaceName, currentNote]);

  const isEmpty = placeName.trim() === "" && note.trim() === "";

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.title}>この場所のメモ</Text>
          <Text style={styles.lead}>
            あとで自分がたどるための記録です。公開設定にしている足あとでは、
            見に来た人にも表示されます。
          </Text>

          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>場所の名前（任意）</Text>
            <TextInput
              value={placeName}
              onChangeText={setPlaceName}
              placeholder="例: ○○ガソリンスタンド"
              placeholderTextColor={color.textHint}
              style={styles.input}
              maxLength={MAX_PLACE_NAME}
              editable={!isSaving}
            />

            <Text style={styles.label}>メモ（任意）</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="例: レギュラー153円だった"
              placeholderTextColor={color.textHint}
              style={[styles.input, styles.inputMultiline]}
              maxLength={MAX_NOTE}
              multiline
              editable={!isSaving}
            />
            <Text
              style={[
                styles.counter,
                note.length > MAX_NOTE * 0.9 && { color: color.danger },
              ]}
            >
              {note.length} / {MAX_NOTE}
            </Text>

            <View style={styles.presetRow}>
              {NOTE_PRESETS.map((preset) => (
                <Pressable
                  key={preset}
                  onPress={() => setNote(preset)}
                  disabled={isSaving}
                  style={({ pressed }) => [
                    styles.preset,
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Text style={styles.presetText}>{preset}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.hint}>
              {isEmpty
                ? "空のまま保存すると、メモを消せます。"
                : "価格などは変わります。いつの情報かが一緒に表示されます。"}
            </Text>
          </ScrollView>

          <View style={styles.actions}>
            <Pressable
              onPress={onClose}
              disabled={isSaving}
              style={({ pressed }) => [
                styles.button,
                styles.cancelButton,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={styles.cancelText}>やめる</Text>
            </Pressable>
            <Pressable
              onPress={() => onSave(placeName, note)}
              disabled={isSaving}
              style={({ pressed }) => [
                styles.button,
                styles.saveButton,
                pressed && { opacity: 0.85 },
                isSaving && { opacity: 0.5 },
              ]}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={color.textWhite} />
              ) : (
                <Text style={styles.saveText}>{isEmpty ? "メモを消す" : "保存"}</Text>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    width: "100%",
    maxWidth: contentMaxWidth.standard,
    alignSelf: "center",
    maxHeight: "85%",
    backgroundColor: color.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: color.border,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: color.textPrimary,
    marginBottom: 6,
  },
  lead: {
    fontSize: 13,
    lineHeight: 20,
    color: color.textMuted,
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: color.textSecondary,
    marginBottom: 6,
    marginTop: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: color.textPrimary,
    backgroundColor: color.surfaceAlt,
  },
  inputMultiline: {
    minHeight: 72,
    textAlignVertical: "top",
  },
  counter: {
    fontSize: 11,
    color: color.textMuted,
    textAlign: "right",
    marginTop: 4,
  },
  presetRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: spacing.sm,
  },
  preset: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: color.surfaceEmphasis,
  },
  presetText: {
    fontSize: 13,
    color: color.accentPrimary,
    fontWeight: "600",
  },
  hint: {
    fontSize: 12,
    lineHeight: 19,
    color: color.textMuted,
    marginTop: spacing.md,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: spacing.lg,
  },
  button: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: color.surfaceEmphasis,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: "700",
    color: color.textPrimary,
  },
  saveButton: {
    backgroundColor: color.accentPrimary,
  },
  saveText: {
    fontSize: 15,
    fontWeight: "700",
    color: color.textWhite,
  },
});
