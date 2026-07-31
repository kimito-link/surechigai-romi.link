/**
 * hooks/use-warm-og-image.ts
 *
 * チェックイン完了後に、OGP画像のキャッシュをブラウザ側から温める。
 *
 * なぜクライアントからやるのか（2026-07-31 の障害を踏まえた設計）:
 * サーバー(tRPC)側でウォームを投げた実装は、Vercel の Serverless が未解決の Promise を
 * 抱えたまま関数を終了しないため、`void`/`.catch()` で投げっぱなしにしてもレスポンスを
 * 最大15秒遅らせた。シェア導線は prepareSharePopup() でクリック直後に空タブを開くので、
 * その遅延がそのまま「about:blank を見続ける」障害になった（実機確認済み）。
 * ブラウザからの fetch ならサーバー応答に一切影響しない。
 *
 * 効果の限界:
 * 画像生成は 5〜6 秒かかるため、チェックイン直後すぐにシェアされると間に合わない。
 * ユーザーが結果画面を眺めてシェア文を書く時間があれば間に合う、という確率的な改善。
 * 実測値と経緯は docs/investigation/ogp-card-latency-2026-07-30.md を参照。
 */
import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { APP_ORIGIN } from "@/lib/site-urls";

type WarmArgs = {
  /** チェックインが完了して結果が出ている状態か */
  enabled: boolean;
  lat: number | null;
  lng: number | null;
  area: string | null;
  prefecture: string | null;
  username: string | null;
};

/**
 * シェア時にクローラーが取りに来るのと同じ URL を組む。
 * lib/ogp/share-meta.ts の buildOgImageSearchParams と同じ並び・同じキーにすること
 * （1文字でも違うと別キャッシュキーになりウォームが無意味になる）。
 */
function buildWarmUrl(args: Omit<WarmArgs, "enabled">): string | null {
  if (args.lat == null || args.lng == null) return null;
  const params = new URLSearchParams();
  if (args.area) params.set("area", args.area);
  if (args.prefecture) params.set("pref", args.prefecture);
  params.set("lat", String(args.lat));
  params.set("lng", String(args.lng));
  params.set("zoom", "14");
  if (args.username) params.set("name", args.username);
  return `${APP_ORIGIN}/api/og?${params.toString()}`;
}

export function useWarmOgImage(args: WarmArgs): void {
  // 同じ地点で何度も叩かないよう、直近に温めた URL を覚えておく
  const warmedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!args.enabled) return;
    if (Platform.OS !== "web" || typeof fetch !== "function") return;

    const url = buildWarmUrl(args);
    if (!url || warmedRef.current === url) return;
    warmedRef.current = url;

    // 画像として取得する。失敗しても何もしない（クローラー側で生成されるだけ）
    void fetch(url, { mode: "no-cors", cache: "force-cache" }).catch(() => {});
  }, [
    args.enabled,
    args.lat,
    args.lng,
    args.area,
    args.prefecture,
    args.username,
    args,
  ]);
}
