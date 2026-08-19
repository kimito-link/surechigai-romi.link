/**
 * PWA（standalone 起動）で X シェアが about:blank のまま止まらないことを守る。
 *
 * ★2026-08-17 実機report:
 * ホーム画能から起動した PWA で X シェアを押すと、アプリ内ブラウザが
 * **about:blank のまま固まる**（待機画面すら出ない）。
 *
 * 原因: standalone では `window.open("about:blank")` が別プロセスのアプリ内ブラウザを
 * 開くため、あとから `popup.location.href` を差し替えても反映されない。
 * 通常のブラウザタブ前提の「空タブを先に確保しておく」方式が成立しない。
 *
 * 対策: PWA では空タブを用意せず（popup: null）、遷移時に目的URLで一度だけ開く。
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const SRC = readFileSync(resolve(__dirname, "../lib/share.ts"), "utf8");

describe("PWA でのシェア", () => {
  it("iOS では空タブ方式を使わない（PWA判定だけでは足りなかった）", () => {
    /* ★2026-08-19 実機report: about:blank の待機画面が出たまま固まった＝
       isStandalonePwa() が false を返す経路が実在する（アプリ内ブラウザ経由など）。
       iOS は「非同期のあとの window.open」自体を塞ぐので、方式ごと使わない。 */
    expect(SRC).toContain("function cannotUseBlankTab");
    expect(SRC).toMatch(/detectMobileOs\([\s\S]{0,40}===\s*"ios"/);
  });

  it("standalone 判定を持っている", () => {
    expect(SRC).toContain("function isStandalonePwa");
    // display-mode と navigator.standalone の両方を見る（iOS は後者）
    expect(SRC).toContain("(display-mode: standalone)");
    expect(SRC).toMatch(/navigator[\s\S]{0,60}standalone/);
  });

  it("PWA では about:blank の空タブを開かない", () => {
    const start = SRC.indexOf("export function prepareSharePopup");
    const body = SRC.slice(start, SRC.indexOf("\n}", start));
    const guard = body.indexOf("cannotUseBlankTab()");
    const open = body.indexOf('window.open("about:blank"');
    expect(guard).toBeGreaterThan(-1);
    expect(open).toBeGreaterThan(-1);
    // 空タブを開くより前で PWA を弾いていること
    expect(guard).toBeLessThan(open);
    expect(body).toMatch(/cannotUseBlankTab\(\)\)\s*return\s*\{\s*popup:\s*null[\s\S]{0,40}\}/);
  });

  it("PWA では同じウィンドウで遷移する（別タブは開けない）", () => {
    /* ★2026-08-19 実機report: X も Threads も
       「投稿画面を開けませんでした。ポップアップ許可を確認してください。」で失敗。
       iOS の standalone PWA は window.open("_blank") が null を返す。とくに
       API通信や OGP ウォームを挟んだ**非同期のあと**はユーザー操作起点が切れて
       確実に塞がれる。8/17 に空タブ方式をやめた結果、open の呼び出しが
       非同期の後ろにずれてこれを踏んだ。
       PWA に限っては現在のウィンドウで遷移させる（X から戻れば PWA も復帰する）。 */
    const start = SRC.indexOf("function openWebShareUrl");
    const body = SRC.slice(start, SRC.indexOf(String.fromCharCode(10) + "}", start));
    expect(body).toMatch(/isPwa[\s\S]{0,120}window\.location\.assign/);
  });

  it("PWA 以外では現在タブを奪わず新規タブを開く", () => {
    const start = SRC.indexOf("function openWebShareUrl");
    const body = SRC.slice(start, SRC.indexOf(String.fromCharCode(10) + "}", start));
    expect(body).toContain("openInNewTab(twitterUrl)");
    /* 通常ブラウザで現在のタブを差し替えるとアプリの画面が失われる
       （2026-08-04 の実障害）。location.assign は PWA 分岐の中だけに限る。 */
    const code = body
      .split(String.fromCharCode(10))
      .filter((l) => !/^\s*(\/\/|\/\*|\*)/.test(l))
      .join(String.fromCharCode(10));
    const assigns = code.match(/window\.location\.assign/g) ?? [];
    expect(assigns.length).toBe(1);
    expect(code).not.toMatch(/window\.location\.href\s*=/);
  });

  it("リンク発行には必ず上限がある（空タブが残り続けない）", () => {
    expect(SRC).toContain("SHARE_SLUG_TIMEOUT_MS");
    expect(SRC).toContain("ShareTimeoutError");
  });
});
