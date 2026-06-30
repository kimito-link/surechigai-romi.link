import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { trpc } from "@/lib/trpc";
import type { LocationVisibility } from "@/modules/encounter/core/location-visibility";

/** 足あとの削除・公開切り替え（軌跡/図鑑共通） */
export function useTrailLocationActions(onChanged?: () => void) {
  const [deletingLocationId, setDeletingLocationId] = useState<number | null>(null);
  const [updatingLocationId, setUpdatingLocationId] = useState<number | null>(null);

  const deleteMutation = trpc.zukan.deleteLocation.useMutation({
    onSuccess: () => {
      onChanged?.();
    },
    onError: (err) => {
      Alert.alert("エラー", err.message || "足あとの削除に失敗しました");
    },
  });

  const visibilityMutation = trpc.zukan.setLocationVisibility.useMutation({
    onSuccess: () => {
      onChanged?.();
    },
    onError: (err) => {
      Alert.alert("エラー", err.message || "公開設定の更新に失敗しました");
    },
  });

  const handleDeleteLocation = useCallback(
    (locationId: number) => {
      Alert.alert(
        "足あとを削除",
        "この記録を地図から消します。すれ違いマッチングにも使われなくなります。",
        [
          { text: "キャンセル", style: "cancel" },
          {
            text: "削除",
            style: "destructive",
            onPress: () => {
              setDeletingLocationId(locationId);
              deleteMutation.mutate(
                { locationId },
                { onSettled: () => setDeletingLocationId(null) },
              );
            },
          },
        ],
      );
    },
    [deleteMutation],
  );

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
    handleDeleteLocation,
    handleToggleVisibility,
    isManaging: deleteMutation.isPending || visibilityMutation.isPending,
  };
}
