/**
 * hooks/use-warm-og-image.ts
 *
 * OGP画像のキャッシュをブラウザ側から温める。
 *
 * なぜクライアントからやるのか（2026-07-31 の障害を踏まえた設計）:
 * サーバー(tRPC)側でウォームを投げた実装は、Vercel の Serverless が未解決の Promise を
 * 抱えたまま関数を終了しないため、`void`/`.catch()` で投げっぱなしにしてもレスポンスを
 * 最大15秒遅らせた。シェア導線は prepareSharePopup() でクリック直後に空タブを開くので、
 * その遅延がそのまま「about:blank を見続ける」障害になった（実機確認済み）。
 * ブラウザからの fetch ならサーバー応答に一切影響しない。
 *
 * なぜURLを自前で組まないのか（2026-08-04 に修正した真因）:
 * 以前はこのフックが area/pref/lat/lng/zoom を自分で組み立てていたが、クローラーが
 * 実際に取りに来るURL（api/u/[slug].ts の og:image）と一致していなかった。
 * `v=`(記録時刻)が丸ごと欠落し、zoom も "14" 決め打ちで、座標も homeMaskCell が
 * 効く人ではDB側と別地点になっていた。CDNのキャッシュキーはクエリ完全一致なので、
 * **ウォームのヒット率は構造的にゼロ**だった（本番で x-vercel-cache を実測して確認）。
 * これが「OGP画像が生成されないことが多い」の正体。
 *
 * 今はサーバー(ogp.getOrCreateShareSlug の warmImageUrl)が og:image と同じ組み立てで
 * URLを返すので、ここは受け取った文字列をそのまま叩くだけにする。見た目で組み直さない。
 *
 * 効果の限界:
 * 画像生成は 1.7〜3.1 秒かかり X のクローラーは ~2 秒で諦める。シェアタップ後に
 * 投稿文を書く時間があれば間に合う、という確率的な改善。
 * 実測値と経緯は docs/investigation/ogp-card-latency-2026-07-30.md を参照。
 */
import { useEffect, useRef } from "react";
import { Platform } from "react-native";

type WarmArgs = {
  /** ウォームしてよい状態か（チェックイン完了・シェアリンク取得済みなど） */
  enabled: boolean;
  /**
   * 温める画像URL。サーバーが og:image と同じ組み立てで返したものを渡すこと。
   * ここで文字列を加工してはいけない（1文字違うと別キャッシュキーになる）。
   */
  url: string | null | undefined;
};

export function useWarmOgImage({ enabled, url }: WarmArgs): void {
  // 同じURLを何度も叩かないよう、直近に温めたURLを覚えておく
  const warmedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !url) return;
    if (Platform.OS !== "web" || typeof fetch !== "function") return;
    if (warmedRef.current === url) return;
    warmedRef.current = url;

    // 画像として取得する。失敗しても何もしない（クローラー側で生成されるだけ）
    void fetch(url, { mode: "no-cors", cache: "force-cache" }).catch(() => {});
  }, [enabled, url]);
}
