import { ConfirmModal } from "@/components/ui/modal";

interface DeleteTrailConfirmModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** 足あと削除の確認ダイアログ（Web/Native 共通） */
export function DeleteTrailConfirmModal({
  visible,
  onConfirm,
  onCancel,
}: DeleteTrailConfirmModalProps) {
  return (
    <ConfirmModal
      visible={visible}
      title="足あとを削除"
      message="この記録を地図から消します。すれ違いマッチングにも使われなくなります。"
      confirmText="削除"
      cancelText="キャンセル"
      confirmStyle="destructive"
      icon="delete-outline"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
