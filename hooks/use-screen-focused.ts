import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { useIsFocused } from "@react-navigation/native";

/**
 * この画面が「実際に見えているか」を返す。
 *
 * expo-router の Tabs（react-navigation bottom-tabs）はタブ切替で画面を
 * アンマウントせず display:none で保持し続けるため、通常の useEffect cleanup
 * はタブ離脱時に発火しない（ログアウト/ルート離脱時のみ）。無限アニメを
 * タブ非表示中も止めずに回し続けると、複数タブを巡るほど蓄積し OOM の原因に
 * なる（docs/auth-home-oom-diagnosis-v2.md 参照）。
 *
 * このフックは useIsFocused（タブ切替）に加え、web では
 * document.visibilitychange（ブラウザタブの非アクティブ化）も見て、
 * どちらかで非表示になったら false を返す。
 */
export function useScreenFocused(): boolean {
  const isFocused = useIsFocused();
  const [pageVisible, setPageVisible] = useState(true);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;

    setPageVisible(document.visibilityState === "visible");
    const onVisibilityChange = () => {
      setPageVisible(document.visibilityState === "visible");
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  return isFocused && pageVisible;
}
