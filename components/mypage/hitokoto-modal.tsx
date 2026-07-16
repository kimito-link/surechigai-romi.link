/**
 * mypage-authenticated-screen.tsx から切り出した「ひとこと」編集モーダル
 * (refactor-instructions.md Phase 7 Debt #11)。ロジック・見た目は変えていない。
 */
import { View, Text, Modal, TextInput, Pressable } from "react-native";
import { useState } from "react";
import { color } from "@/theme/tokens";
import { styles } from "@/components/mypage/mypage-screen-styles";

const MAX_HITOKOTO = 140;

/** ひとことのワンタップ定型文（手入力を減らす）。タップで入力欄に入る。 */
const HITOKOTO_PRESETS = [
  "すれ違えてうれしい！",
  "声かけてOKです",
  "Xフォローしてね",
  "また会いましょう",
  "応援してます！",
  "今日はこのへんにいます",
] as const;

export function HitokotoModal({
  visible,
  current,
  onClose,
  onSave,
}: {
  visible: boolean;
  current: string;
  onClose: () => void;
  onSave: (text: string) => void;
}) {
  const [text, setText] = useState(current);
  const [error, setError] = useState("");

  const handleSave = () => {
    if (text.length > MAX_HITOKOTO) {
      setError(`${MAX_HITOKOTO}文字以内で入力してください`);
      return;
    }
    onSave(text);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={styles.hitokotoModal}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <Text style={styles.hitokotoModalTitle}>ひとこと編集</Text>
            <Text style={styles.hitokotoHint}>
              24時間だけすれ違い相手に表示されます
            </Text>

            <TextInput
              value={text}
              onChangeText={(t) => { setText(t); setError(""); }}
              placeholder="一言どうぞ..."
              placeholderTextColor={color.textMuted}
              maxLength={MAX_HITOKOTO}
              multiline
              numberOfLines={4}
              style={styles.hitokotoInput}
              autoFocus
            />

            {/* ワンタップ定型文（手入力を減らす） */}
            <Text style={styles.presetLabel}>よく使う言葉（タップで入ります）</Text>
            <View style={styles.presetRow}>
              {HITOKOTO_PRESETS.map((p) => (
                <Pressable
                  key={p}
                  onPress={() => { setText(p); setError(""); }}
                  style={({ pressed }) => [styles.presetChip, pressed && { opacity: 0.7 }]}
                >
                  <Text style={styles.presetChipText}>{p}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.hitokotoFooter}>
              <Text style={[styles.hitokotoCount, text.length > MAX_HITOKOTO * 0.9 && { color: color.danger }]}>
                {text.length}/{MAX_HITOKOTO}
              </Text>
              {error ? <Text style={styles.hitokotoError}>{error}</Text> : null}
            </View>

            <View style={styles.hitokotoButtons}>
              <Pressable
                onPress={onClose}
                style={({ pressed }) => [styles.cancelButton, pressed && { opacity: 0.7 }]}
              >
                <Text style={styles.cancelButtonText}>キャンセル</Text>
              </Pressable>
              <Pressable
                onPress={handleSave}
                style={({ pressed }) => [styles.saveButton, pressed && { opacity: 0.8 }]}
              >
                <Text style={styles.saveButtonText}>保存</Text>
              </Pressable>
            </View>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}
