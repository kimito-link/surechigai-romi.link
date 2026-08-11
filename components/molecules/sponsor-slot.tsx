/**
 * 協賛カードの差し込み口。置くだけで「取得 → 頻度制御 → 表示 → クリック計測」まで面倒を見る。
 *
 * これを作った理由:
 * サーバー(server/routers/ads.ts)は checkin_complete / zukan_feed / mypage_stats の
 * 3スロットに対応済みで、sponsor_config.slotFlags にもフラグがあったのに、
 * 呼び出す側が checkin にしか無かった。残り2つは**フラグだけあって表示UIが無い**
 * 実質デッドコード状態だった（2026-08-11 に実測して判明）。
 *
 * 表示しない条件（静かに null を返す）:
 * - 未ログイン
 * - 今日の表示上限に達している（全スロット合計。lib/sponsor-frequency.ts）
 * - サーバーがカードを返さない（在庫なし / slotFlags が false / dailyCap 超過）
 *
 * 既存の checkin 実装は props で受け取る作りなのでそのまま。
 * こちらは自己完結型で、画面側は <SponsorSlot slot="..." /> を置くだけでよい。
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { SponsorCard, type SponsorCardData } from "@/components/molecules/sponsor-card";
import {
  canRequestSponsorCard,
  rememberSponsorCardDisplay,
} from "@/lib/sponsor-frequency";

type SponsorSlotProps = {
  /** サーバーの SPONSOR_SLOTS と対応。checkin_complete は既存実装が持つ */
  slot: "zukan_feed" | "mypage_stats";
  /** 地域ターゲティング用。無ければ全国配信のカードだけが返る */
  prefecture?: string | null;
  municipality?: string | null;
  testID?: string;
};

export function SponsorSlot({
  slot,
  prefecture = null,
  municipality = null,
  testID,
}: SponsorSlotProps) {
  const { isAuthenticated } = useAuth();

  // 初回マウント時点の枠残量で判断する。描画中に増減させない
  const [canRequest, setCanRequest] = useState(canRequestSponsorCard);
  const countedRef = useRef<number | null>(null);

  const trackSponsor = trpc.ads.track.useMutation();

  const sponsorQuery = trpc.ads.getCards.useQuery(
    { slot, prefecture, municipality },
    {
      enabled: isAuthenticated && canRequest,
      retry: false,
      refetchOnWindowFocus: false,
    },
  );

  const card = sponsorQuery.data?.cards[0] ?? null;

  // 同じカードを二重に数えない（再レンダリングで増えると上限がすぐ尽きる）
  useEffect(() => {
    if (!card) return;
    if (countedRef.current === card.id) return;
    countedRef.current = card.id;
    setCanRequest(rememberSponsorCardDisplay());
  }, [card]);

  const handlePress = useCallback(
    (pressed: SponsorCardData) => {
      trackSponsor.mutate({ cardId: pressed.id, event: "click" });
    },
    [trackSponsor],
  );

  if (!card) return null;

  return <SponsorCard card={card} onPress={handlePress} testID={testID} />;
}
