/**
 * 地図タブの統計カード（すれ違った人 / 図鑑 / 市区町村）が押せるかの判定を守る。
 *
 * このテストが守る事故（2026-08-15 ユーザー報告）:
 * 3枚とも素の <View> で onPress が無く、カード状で押せそうに見えるのに反応しなかった
 * （web-trail-map.tsx:172-191）。2026-07-06 の統計カード修正（commit 8004c4aec）は
 * このファイルを対象にしておらず、リグレッションではなく取りこぼしだった。
 *
 * ★同時に守るべき制約:
 * この部品は自分の地図タブと **公開ページ /u/<slug>（他人のページ）の両方**で使われる
 * （app/u/[slug].tsx:168）。他人のページで押せてしまうと、閲覧者本人の図鑑へ飛んで
 * 文脈が壊れる。よって「ハンドラを渡されたときだけ押せる」opt-in にし、
 * 着地ページ側はハンドラを渡さない＝非対話のまま、という非対称で解決する。
 *
 * isLoading 中（表示が「—」）に押せてはいけない理由: 値が確定していない状態で
 * 遷移させても、ユーザーが押した数字の意味する先が定まらないため。
 */
import { describe, expect, it } from "vitest";

import { isStatCardInteractive } from "@/components/organisms/web-trail-map-stats";

describe("isStatCardInteractive（統計カードが押せるか）", () => {
  it("ハンドラ未指定なら押せない（公開ページ /u/<slug> は非対話のまま）", () => {
    expect(isStatCardInteractive(undefined, false)).toBe(false);
  });

  it("isLoading 中はハンドラがあっても押せない", () => {
    expect(isStatCardInteractive(() => {}, true)).toBe(false);
  });

  it("ハンドラあり・ロード済みなら押せる", () => {
    expect(isStatCardInteractive(() => {}, false)).toBe(true);
  });

  it("ハンドラ未指定なら isLoading に関わらず押せない", () => {
    expect(isStatCardInteractive(undefined, true)).toBe(false);
  });
});
