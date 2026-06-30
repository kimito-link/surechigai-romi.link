import { useCallback, useState } from "react";
import { showAlert } from "@/lib/web-alert";
import { trpc } from "@/lib/trpc";
import type { LocationVisibility } from "@/modules/encounter/core/location-visibility";

/** 足あとの削除・公開切り替え（軌跡/図鑑共通） */
export function useTrailLocationActions(onChanged?: () => void) {
  const utils = trpc.useUtils();
  const [deletingLocationId, setDeletingLocationId] = useState<number | null>(null);
  const [updatingLocationId, setUpdatingLocationId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const deleteMutation = trpc.zukan.deleteLocation.useMutation({
    onSuccess: () => {
      void utils.zukan.myTrail.invalidate();
      onChanged?.();
    },
    onError: (err) => {
      showAlert("エラー", err.message || "足あとの削除に失敗しました");
    },
  });

  const visibilityMutation = trpc.zukan.setLocationVisibility.useMutation({
    onSuccess: () => {
      void utils.zukan.myTrail.invalidate();
      onChanged?.();
    },
    onError: (err) => {
      showAlert("エラー", err.message || "公開設定の更新に失敗しました");
    },
  });

  const handleDeleteLocation = useCallback((locationId: number) => {
    setConfirmDeleteId(locationId);
  }, []);

  const cancelDelete = useCallback(() => {
    setConfirmDeleteId(null);
  }, []);

  const executeDelete = useCallback(() => {
    if (confirmDeleteId == null) return;
    const locationId = confirmDeleteId;
    setConfirmDeleteId(null);
    setDeletingLocationId(locationId);
    deleteMutation.mutate(
      { locationId },
      { onSettled: () => setDeletingLocationId(null) },
    );
  }, [confirmDeleteId, deleteMutation]);

  const handleToggleVisibility = useCallback(
    (locationId: number, next: LocationVisibility) => {
      setUpdatingLocationId(locationId);
      visibilityMutation.mutate(
        { locationId, visibility: next },
        { onSettled: () => setUpdatingLocationId(null) },
      );
    },
    [visibilityMutation],
  );

  return {
    deletingLocationId,
    updatingLocationId,
    confirmDeleteId,
    handleDeleteLocation,
    handleToggleVisibility,
    executeDelete,
    cancelDelete,
    isManaging: deleteMutation.isPending || visibilityMutation.isPending,
  };
}
