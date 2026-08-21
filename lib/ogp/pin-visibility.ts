/**
 * lib/ogp/pin-visibility.ts
 *
 * OGP画像に「現在地ピン」を出してよいかを決める。
 *
 * ★なぜ切り出すか（2026-08-21）:
 *   この判断は api/og.tsx の描画コードの中にあり、テストで守れなかった。
 *   実際そのせいで「**場所が分からないのにピンを打つ**」状態が本番で出ていた。
 *   「日本のどこか」と書いてあるのに現在地マーカーが特定の一点を指す、
 *   という矛盾した絵になり、見る人には嘘に見える。
 *   （resolve-place-context.ts / live-stream-pick.ts と同じ「判断は純粋関数へ」の型）
 *
 * ★方針: このプロダクトの中心価値は「正確な場所を残して後でたどれる」こと。
 *   場所が分からないなら**分からないと正直に見せる**。
 *   偽の一点を指すより誠実で、ブランドの主張とも一致する。
 */

export type PinContext = {
  /** 夜景フォールバック（地図タイルが取れなかった）か */
  isNightScene: boolean;
  /** 夜景で県の位置が特定できたか（都道府県名から座標を引けたか） */
  hasPrefPosition: boolean;
  /** MapTiler Static Map が取れたか（＝実座標が中心に描かれている） */
  hasStaticMap: boolean;
  /** OSM タイル合成が取れたか（＝実座標が中心に描かれている） */
  hasTiles: boolean;
};

/**
 * ピンを出してよいか。
 *
 * true になるのは「その点が本当にその人の居場所だと言える」ときだけ:
 *   - 夜景で県が特定できた（県の位置に灯をともす）
 *   - 地図が描けている（中心＝実座標）
 *
 * false のときは呼び出し側でピンを描かず、ラベルだけを中央に置く。
 */
export function shouldShowLocationPin(ctx: PinContext): boolean {
  const usePrefAnchor = ctx.isNightScene && ctx.hasPrefPosition;
  return usePrefAnchor || ctx.hasStaticMap || ctx.hasTiles;
}
