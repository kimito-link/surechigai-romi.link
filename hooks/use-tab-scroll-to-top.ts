import { useEffect, useRef } from "react";
import type { ScrollView } from "react-native";
import { useScrollToTop } from "@react-navigation/native";
import { subscribeHomeScroll } from "@/lib/home-scroll";

/** タブ再タップ＋ヘッダーホームリンクで ScrollView を先頭へ */
export function useTabScrollToTop() {
  const ref = useRef<ScrollView>(null);
  useScrollToTop(ref);

  useEffect(
    () =>
      subscribeHomeScroll(() => {
        ref.current?.scrollTo({ y: 0, animated: true });
      }),
    [],
  );

  return ref;
}
