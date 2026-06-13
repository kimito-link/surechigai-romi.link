import { useEffect, useRef, useState } from "react";
import { useNetworkStatus } from "@/hooks/use-offline-cache";
import { useToast } from "@/components/atoms/toast";

/**
 * v5.37: ネットワーク状態変化時にトースト通知を表示
 * 
 * - オフラインになった時: 警告トースト
 * - オンラインに復帰した時: 成功トースト
 */
export function NetworkToast() {
  const { isOffline } = useNetworkStatus();
  const { showWarning, showSuccess } = useToast();
  const prevOfflineRef = useRef<boolean | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // 初回レンダリング時はトーストを表示しない
    if (!isInitialized) {
      prevOfflineRef.current = isOffline;
      setIsInitialized(true);
      return;
    }

    // 状態が変化した時のみトーストを表示
    if (prevOfflineRef.current !== isOffline) {
      if (isOffline) {
        showWarning("オフラインです。一部の機能が制限されます。");
      } else if (prevOfflineRef.current === true) {
        // 前回オフラインで、今回オンラインになった場合のみ
        showSuccess("オンラインに復帰しました。");
      }
      prevOfflineRef.current = isOffline;
    }
  }, [isOffline, isInitialized, showWarning, showSuccess]);

  // このコンポーネントは何もレンダリングしない
  return null;
}
