/**
 * 「はじめる」が押しても無反応にならないことを守る。
 *
 * 背景（2026-08-21・iOS build 520 却下）:
 *   審査コメントは "the はじめる and Login with X buttons were unresponsive"。
 *   押しても**本当に何も起きなかった**。
 *
 * ★真因: 認証プロバイダ chunk の解決待ちの間、app/_layout.tsx は
 *   AUTH_LOADING_PLACEHOLDER を配る。その login は `async () => {}` ＝
 *   何もしない関数。この間もゲスト画面は描かれるので、
 *   **見た目は完全に押せるボタンなのに押すと無反応**になる。
 *   app/(tabs)/index.tsx は未ログイン時 isAuthReadyForUI を待たずに
 *   PostGuestScreen を即描画するため、初回起動＝審査員の状態で入りやすい。
 *
 * ★なぜ呼び出し側で直さないか:
 *   one-tap-guest-shell と app-header は isAuthReadyForUI で出し分けていたが、
 *   inline-login-prompt と post-guest-screen には無かった。呼び出し側に足す方式は
 *   **また足し忘れる**（実際2箇所で忘れていた）。ボタン自身が知る形にする。
 *
 * ここではソースを読んで構造を固定する。RN コンポーネントの描画テスト基盤が
 * 無いため、「壊れたら気づける最低限」を実コードの形で押さえる。
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(__dirname, "..");
const read = (p: string) => readFileSync(resolve(ROOT, p), "utf8");

const CTA = read("components/molecules/kimito-login-cta.tsx");
const LAYOUT = read("app/_layout.tsx");

describe("KimitoLoginCta が認証の準備状態を見る", () => {
  it("useAuth から isAuthReadyForUI を読む", () => {
    // これが無いと、準備前でも押せる見た目のまま無反応になる
    expect(CTA).toMatch(/isAuthReadyForUI/);
    expect(CTA).toMatch(/useAuth\(\)/);
  });

  it("準備前は busy 扱いにする", () => {
    expect(CTA).toMatch(/isPreparing\s*=\s*!isAuthReadyForUI/);
    expect(CTA).toMatch(/busy\s*=\s*isStarting\s*\|\|\s*isPreparing/);
  });

  it("ネイティブの Pressable は busy の間 disabled になる", () => {
    // ネイティブは href が無く onPress が唯一の経路。
    // 押せる見た目のまま無反応にするのが却下の原因だった。
    expect(CTA).toMatch(/disabled=\{busy\}/);
  });

  it("busy を支援技術にも伝える（見た目だけで済ませない）", () => {
    expect(CTA).toMatch(/accessibilityState=\{\{\s*disabled:\s*busy,\s*busy\s*\}\}/);
  });

  it("busy の間は「接続中…」を出す（無言で固まらせない）", () => {
    expect(CTA).toMatch(/busy\s*\?\s*"接続中…"/);
  });

  it("Web は href があるので準備中でも殺さない（無反応にならない経路）", () => {
    // <Link href> はブラウザが遷移させるため、isPreparing で無効化すると
    // 逆に押せていたものを押せなくしてしまう。
    const webBranch = CTA.slice(
      CTA.indexOf('if (Platform.OS === "web")'),
      CTA.indexOf("</Link>"),
    );
    expect(webBranch).not.toMatch(/disabled=\{busy\}/);
    expect(webBranch).toMatch(/isStarting && \{ opacity: 0\.65 \}/);
  });
});

describe("永久に固まらないこと（修正が新しい詰みを作らない）", () => {
  /* ★検証で発覚（2026-08-21）: disabled にするだけだと、認証プロバイダの
     読み込みが失敗したとき isAuthReadyForUI が永久に false になり、
     ボタンが**永久に押せなくなる**。却下された「無反応」より悪い。
     待ちに上限を設け、超えたら押せる状態へ戻す。 */
  it("待ち時間に上限がある", () => {
    expect(CTA).toMatch(/AUTH_WAIT_TIMEOUT_MS\s*=\s*\d+/);
    expect(CTA).toMatch(/setTimeout\(\s*\(\)\s*=>\s*setWaitedTooLong\(true\)/);
  });

  it("上限を超えたら準備中扱いをやめる（押せる状態に戻す）", () => {
    expect(CTA).toMatch(/isPreparing\s*=\s*!isAuthReadyForUI\s*&&\s*!waitedTooLong/);
  });

  it("認証が準備できたらタイマーは張らない（正常時に無駄を出さない）", () => {
    expect(CTA).toMatch(/if\s*\(isAuthReadyForUI\)\s*return;/);
  });

  it("loadAuthProviders は失敗を記憶しない（再試行できる）", () => {
    // reject 済み Promise をメモに残すと、再マウントしても
    // `if (!authProvidersPromise)` のガードで再生成されず永久に復帰しない。
    const idx = LAYOUT.indexOf("function loadAuthProviders");
    const block = LAYOUT.slice(idx, idx + 900);

    expect(block).toMatch(/\.catch\(/);
    expect(block).toMatch(/authProvidersPromise\s*=\s*null/);
  });
});

describe("無反応の原因になった配線が残っていること（前提の固定）", () => {
  it("_layout は解決待ちに login が no-op のプレースホルダを配る", () => {
    // この前提が変わったら、上のガードの理由も見直す必要がある。
    const idx = LAYOUT.indexOf("AUTH_LOADING_PLACEHOLDER: AuthState");
    expect(idx).toBeGreaterThan(-1);
    const block = LAYOUT.slice(idx, idx + 400);

    expect(block).toMatch(/login:\s*async\s*\(\)\s*=>\s*\{\}/);
    expect(block).toMatch(/isAuthReadyForUI:\s*false/);
  });

  it("プレースホルダ分岐でも AuthProvider は配られる（useAuth が投げない）", () => {
    // CTA が useAuth を呼ぶようになったので、Provider 不在だと画面ごと落ちる。
    // 過去に /sign-in で2度踏んだ型なので明示的に固定する。
    expect(LAYOUT).toMatch(
      /<AuthContextProvider value=\{AUTH_LOADING_PLACEHOLDER\}>/,
    );
  });
});
