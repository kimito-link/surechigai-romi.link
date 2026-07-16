/**
 * post-authenticated-screen.tsx から切り出した通報モーダル
 * (refactor-instructions.md Phase 7 Debt #11)。ロジック・見た目は変えていない。
 */
import { View, Text, Modal, Pressable } from "react-native";
import MaterialIcons from "@/lib/icons/material-icons";
import { color } from "@/theme/tokens";
import { type EncounterItem, reasonLabel } from "@/lib/post/encounter-shared";
import { styles } from "@/components/post/post-screen-styles";

export function ReportModal({
  item,
  visible,
  onClose,
  onBlock,
  onReport,
}: {
  item: EncounterItem | null;
  visible: boolean;
  onClose: () => void;
  onBlock: (userId: number) => void;
  onReport: (targetUserId: number, encounterId: number, reason: string) => void;
}) {
  if (!item) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={styles.reportCard}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <Text style={styles.reportTitle}>対応を選んでください</Text>

            <Pressable
              onPress={() => { onBlock(item.partnerId); onClose(); }}
              style={({ pressed }) => [styles.reportItem, pressed && { opacity: 0.7 }]}
            >
              <MaterialIcons name="block" size={20} color={color.danger} style={{ marginRight: 12 }} />
              <Text style={[styles.reportItemText, { color: color.danger }]}>ブロックする</Text>
            </Pressable>

            {["inappropriate_hitokoto", "spam", "harassment", "other"].map((reason) => (
              <Pressable
                key={reason}
                onPress={() => { onReport(item.partnerId, item.id, reason); onClose(); }}
                style={({ pressed }) => [styles.reportItem, pressed && { opacity: 0.7 }]}
              >
                <MaterialIcons name="flag" size={20} color={color.textMuted} style={{ marginRight: 12 }} />
                <Text style={styles.reportItemText}>{reasonLabel(reason)}</Text>
              </Pressable>
            ))}

            <Pressable onPress={onClose} style={({ pressed }) => [styles.reportCancelButton, pressed && { opacity: 0.7 }]}>
              <Text style={styles.reportCancelText}>キャンセル</Text>
            </Pressable>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}
