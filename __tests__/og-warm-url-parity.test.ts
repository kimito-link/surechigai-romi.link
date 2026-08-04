/**
 * 「ブラウザが実際に温めるURL」と「クローラーが実際に取りに来るURL」の一致を固定する。
 *
 * 背景(2026-08-04 本番実測): OGP画像が「生成されないことが多い」というユーザー報告の真因は、
 * hooks/use-warm-og-image.ts が自前でクエリを組み立てており、クローラー側(api/u/[slug].ts)の
 * URLと一致していなかったこと。v= が丸ごと欠落し、zoom も "14" 決め打ちだったため、
 * CDN のキャッシュキー(クエリ完全一致)が分裂し、ウォームのヒット率は構造的にゼロだった。
 *
 * 本番で実証:
 *   [1] ウォーム側URL 1回目 → x-vercel-cache: MISS
 *   [2] ウォーム側URL 2回目 → x-vercel-cache: HIT   (温まった)
 *   [3] クローラー側URL     → x-vercel-cache: MISS  (別キー。ウォーム無効)
 *
 * 既存の ogp-share-meta.test.ts にも同種のテストがあるが、あちらが検証しているのは
 * サーバー側ヘルパー buildWarmTargetUrl であり、ブラウザが実際に叩く経路は
 * 対象外だった。テストが守っていない場所でバグが起きたので、ここで実経路を固定する。
 */
import { describe, it, expect } from "vitest";
import { buildOgRedirectImageTarget, type ShareLocationInfo } from "@/lib/ogp/share-meta";

const APP_ORIGIN = "https://surechigai.kimito.link";

/** api/u/[slug].ts が og:image に出すURL（クローラーが取りに来る実URL）と同じ組み立て */
function crawlerOgImageUrl(location: ShareLocationInfo): string {
  return buildOgRedirectImageTarget({
    origin: APP_ORIGIN,
    location,
    username: null,
    version: location.recordedAt?.getTime() ?? 0,
  });
}

/**
 * server/routers/ogp.ts の getOrCreateShareSlug が返す warmImageUrl と同じ組み立て。
 * クライアントはこの文字列をそのまま fetch するだけにする（自前で組み直さない）。
 */
function serverWarmImageUrl(location: ShareLocationInfo): string {
  return buildOgRedirectImageTarget({
    origin: APP_ORIGIN,
    location,
    username: null,
    version: location.recordedAt?.getTime() ?? 0,
  });
}

describe("OGPウォームURLとクローラーURLの一致", () => {
  const base: ShareLocationInfo = {
    area: "岡谷市",
    prefecture: "長野県",
    lat: 36.065296,
    lng: 138.05211,
    hasLocation: true,
    zoom: 13,
    recordedAt: new Date("2026-07-30T05:45:11.187Z"),
  };

  it("ブラウザが実際に温めるURLはクローラーのog:imageと完全一致する", () => {
    // ここが本丸。hooks/use-warm-og-image.ts が「サーバーから渡されたURLをそのまま叩く」
    // 実装になっていれば一致する。クライアントが自前でクエリを組み直すと必ず壊れる
    // (v= 欠落・zoom 決め打ち・座標ズレの3点が実際に起きていた)。
    const warmUrlFromServer = serverWarmImageUrl(base);
    expect(warmUrlFromServer).toBe(crawlerOgImageUrl(base));
  });

  it("クライアントが自前でクエリを組むとキー分裂する（退行の番人）", () => {
    // 修正前の hooks/use-warm-og-image.ts:39-46 が組んでいたURLを再現する。
    // これが og:image と一致しないことを固定し、この方式へ戻す変更を検出する。
    const params = new URLSearchParams();
    params.set("area", base.area!);
    params.set("pref", base.prefecture!);
    params.set("lat", String(base.lat));
    params.set("lng", String(base.lng));
    params.set("zoom", "14"); // 決め打ちだった
    const legacyClientBuilt = `${APP_ORIGIN}/api/og?${params.toString()}`;
    expect(legacyClientBuilt).not.toBe(crawlerOgImageUrl(base));
  });

  it("v= が必ず含まれる（欠落するとキャッシュキーが分裂して必ずMISSになる）", () => {
    const url = crawlerOgImageUrl(base);
    expect(url).toContain(`v=${base.recordedAt!.getTime()}`);
  });

  it("zoom は設定由来の値をそのまま使う（決め打ちにしない）", () => {
    // sharePrecise ON のユーザーは zoom=16。ここを "14" 固定にすると再びキー分裂する。
    const precise: ShareLocationInfo = { ...base, zoom: 16 };
    expect(crawlerOgImageUrl(precise)).toContain("zoom=16");
    expect(crawlerOgImageUrl(base)).toContain("zoom=13");
  });

  it("記録時刻が変われば別URLになる（新しいチェックインは別キャッシュ）", () => {
    const later: ShareLocationInfo = {
      ...base,
      recordedAt: new Date("2026-07-30T06:00:00.000Z"),
    };
    expect(crawlerOgImageUrl(later)).not.toBe(crawlerOgImageUrl(base));
  });

  it("name= を含めない（キャッシュキーを分裂させる側の害が大きい）", () => {
    // getOrCreateShareSlug は skipUsernameLookup:true(空タブ固まり対策)のため username を
    // 解決しない。og:image 側からも name を落として両側を揃える。
    expect(crawlerOgImageUrl(base)).not.toContain("name=");
  });
});
