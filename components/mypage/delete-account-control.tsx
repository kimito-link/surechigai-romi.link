/**
 * components/mypage/delete-account-control.tsx
 *
 * アカウント削除（退会）の導線。App Store Guideline 5.1.1(v) が
 * 「アプリ内にアカウント削除の導線」を必須としているため設置している。
 *
 * 不可逆な操作なので:
 * - 何が消えるかを実行前に明示する
 * - 確認フレーズの入力を要求する（サーバー側でも同じ文字列を検証する）
 * - 実行後はサインアウトしてトップへ戻す
 */
import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, TextInput, Modal, ActivityIndicator } from "react-native";
import { color } from "@/theme/tokens";
import MaterialIcons from "@/lib/icons/material-icons";
import { trpc } from "@/lib/trpc";
import { ACCOUNT_DELETION_CONFIRM_PHRASE } from "@/modules/encounter/core/account-deletion-confirm";
import { useToast } from "@/components/atoms/toast";

export function DeleteAccountControl({ onDeleted }: { onDeleted: () => void | Promise<void> }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [phrase, setPhrase] = useState("");
  const { showSuccess, showError } = useToast();

  const deleteAccount = trpc.settings.deleteAccount.useMutation();
  const canSubmit = phrase.trim() === ACCOUNT_DELETION_CONFIRM_PHRASE && !deleteAccount.isPending;

  const close = () => {
    if (deleteAccount.isPending) return;
    setModalVisible(false);
    setPhrase("");
  };

  const handleDelete = async () => {
    if (!canSubmit) return;
    try {
      const result = await deleteAccount.mutateAsync({
        confirm: ACCOUNT_DELETION_CONFIRM_PHRASE,
      });
      setModalVisible(false);
      setPhrase("");
      showSuccess(
        result.deletedLocations > 0
          ? `アカウントを削除しました（足あと${result.deletedLocations}件）`
          : "アカウントを削除しました",
      );
      await onDeleted();
    } catch (err) {
      showError(err instanceof Error ? err.message : "アカウントの削除に失敗しました");
    }
  };

  return (
    <>
      <Pressable
        onPress={() => setModalVisible(true)}
        style={({ pressed }) => [styles.menuItem, pressed && { opacity: 0.7 }]}
        accessibilityRole="button"
        accessibilityLabel="アカウントを削除"
      >
        <MaterialIcons name="delete-forever" size={20} color={color.danger} style={{ marginRight: 12 }} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.menuItemText, { color: color.danger }]}>アカウントを削除</Text>
          <Text style={styles.menuItemSub}>足あと・すれ違いの記録がすべて消えます</Text>
        </View>
      </Pressable>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={close}
      >
        <View style={styles.backdrop}>
          <View style={styles.card}>
            <Text style={styles.title}>アカウントを削除しますか？</Text>

            <Text style={styles.lead}>この操作は取り消せません。次のデータが削除されます。</Text>
            <Text style={styles.item}>・記録したすべての足あと（正確な位置を含む）</Text>
            <Text style={styles.item}>・すれ違いの記録と、送ったリアクション</Text>
            <Text style={styles.item}>・訪れた市区町村の記録（図鑑）</Text>
            <Text style={styles.item}>・主催した集まりと、参加の表明</Text>
            <Text style={styles.item}>・「ひとこと」や各種設定</Text>

            <Text style={styles.note}>
              共有リンクも開けなくなります。同じXアカウントで登録し直すことはできますが、
              これまでの記録は戻りません。
            </Text>

            <Text style={styles.confirmLabel}>
              削除するには「{ACCOUNT_DELETION_CONFIRM_PHRASE}」と入力してください
            </Text>
            <TextInput
              value={phrase}
              onChangeText={setPhrase}
              placeholder={ACCOUNT_DELETION_CONFIRM_PHRASE}
              placeholderTextColor={color.textHint}
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!deleteAccount.isPending}
            />

            <View style={styles.actions}>
              <Pressable
                onPress={close}
                disabled={deleteAccount.isPending}
                style={({ pressed }) => [
                  styles.button,
                  styles.cancelButton,
                  pressed && { opacity: 0.7 },
                  deleteAccount.isPending && { opacity: 0.5 },
                ]}
              >
                <Text style={styles.cancelText}>やめる</Text>
              </Pressable>
              <Pressable
                onPress={() => void handleDelete()}
                disabled={!canSubmit}
                style={({ pressed }) => [
                  styles.button,
                  styles.deleteButton,
                  pressed && { opacity: 0.85 },
                  !canSubmit && styles.deleteButtonDisabled,
                ]}
              >
                {deleteAccount.isPending ? (
                  <ActivityIndicator size="small" color={color.textWhite} />
                ) : (
                  <Text style={styles.deleteText}>削除する</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: "600",
  },
  menuItemSub: {
    color: color.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: color.surface,
    borderRadius: 16,
    padding: 22,
  },
  title: {
    fontSize: 19,
    fontWeight: "800",
    color: color.textPrimary,
    marginBottom: 12,
  },
  lead: {
    fontSize: 14,
    lineHeight: 22,
    color: color.textPrimary,
    marginBottom: 8,
  },
  item: {
    fontSize: 14,
    lineHeight: 22,
    color: color.textSecondary,
  },
  note: {
    fontSize: 13,
    lineHeight: 21,
    color: color.textMuted,
    marginTop: 12,
  },
  confirmLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: color.textPrimary,
    marginTop: 18,
    marginBottom: 8,
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
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
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
  deleteButton: {
    backgroundColor: color.danger,
  },
  deleteButtonDisabled: {
    opacity: 0.4,
  },
  deleteText: {
    fontSize: 15,
    fontWeight: "700",
    color: color.textWhite,
  },
});
