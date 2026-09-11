/**
 * 属性カテゴリを選ぶモーダル。
 *
 * ★HitokotoModal と同じ型・同じスタイル集（mypage-screen-styles）に揃える。
 *   新しい見た目を作ると、利用者が「別の機能」だと誤解する。
 *
 * ★自由入力欄は置かない。固定語彙をタップで選ぶだけ。
 *   これが「投稿を持たない＝モデレーション不要」を守る具体的な形。
 */
import { View, Text, Modal, Pressable } from "react-native";
import { useState } from "react";
import {
  CATEGORY_IDS,
  CATEGORY_LABELS,
  MAX_PROFILE_CATEGORIES,
  type CategoryId,
} from "@/modules/encounter/core/category";
import { styles } from "@/components/mypage/mypage-screen-styles";

export function CategoryPickerModal({
  visible,
  current,
  onClose,
  onSave,
}: {
  visible: boolean;
  current: readonly string[];
  onClose: () => void;
  onSave: (categories: CategoryId[]) => void;
}) {
  const [selected, setSelected] = useState<CategoryId[]>(
    CATEGORY_IDS.filter((id) => current.includes(id)),
  );

  const toggle = (id: CategoryId) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_PROFILE_CATEGORIES) return prev;
      return [...prev, id];
    });
  };

  const atLimit = selected.length >= MAX_PROFILE_CATEGORIES;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={styles.hitokotoModal}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <Text style={styles.hitokotoModalTitle}>属性を選ぶ</Text>
            <Text style={styles.hitokotoHint}>
              同じ属性の人が見つけやすくなります（最大{MAX_PROFILE_CATEGORIES}つ）
            </Text>

            <View style={styles.presetRow}>
              {CATEGORY_IDS.map((id) => {
                const on = selected.includes(id);
                // ★上限に達したら未選択のものは押せなくする。
                //   押せるのに何も起きない状態を作らない（無言の無反応は最悪の体験）。
                const disabled = !on && atLimit;
                return (
                  <Pressable
                    key={id}
                    onPress={() => toggle(id)}
                    disabled={disabled}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: on, disabled }}
                    accessibilityLabel={CATEGORY_LABELS[id]}
                    style={({ pressed }) => [
                      styles.presetChip,
                      on && styles.categoryChipOn,
                      disabled && { opacity: 0.4 },
                      pressed && !disabled && { opacity: 0.7 },
                    ]}
                  >
                    <Text
                      style={[
                        styles.presetChipText,
                        on && styles.categoryChipTextOn,
                      ]}
                    >
                      {CATEGORY_LABELS[id]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.hitokotoFooter}>
              <Text style={styles.hitokotoCount}>
                {selected.length}/{MAX_PROFILE_CATEGORIES}
              </Text>
            </View>

            <View style={styles.hitokotoButtons}>
              <Pressable
                onPress={onClose}
                style={({ pressed }) => [styles.cancelButton, pressed && { opacity: 0.7 }]}
              >
                <Text style={styles.cancelButtonText}>キャンセル</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  onSave(selected);
                  onClose();
                }}
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
