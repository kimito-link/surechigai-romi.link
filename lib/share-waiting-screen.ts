/**
 * Xシェアの準備中に、開いた新規タブへ書き込む待機画面。
 *
 * なぜ必要か:
 *   シェアは「先に空タブを開く → 共有リンクを発行 → そのタブを X へ差し替える」
 *   という順序で動く(ポップアップブロックを避けるため、ユーザー操作と同じ
 *   ティックで window.open する必要がある)。この間タブは about:blank のままで、
 *   ユーザーには真っ白な画面が数秒見える。リンク発行は最大 8 秒待つ
 *   (SHARE_SLUG_TIMEOUT_MS)ので、白画面のまま放置すると「壊れた」と受け取られる。
 *
 * 設計上の制約(ここを外すと白画面に戻る):
 *   1. **外部リソースを一切参照しない。** 書き込み先は about:blank であり、
 *      画像・フォント・CSS を外部から読むと CSP や読み込み遅延で崩れる。
 *      絵柄は絵文字と CSS、および data URI で埋め込んだロゴだけで作る
 *      （ロゴは lib/share-waiting-logo.ts。画像URLを書いてはいけない）。
 *   2. **document.write を使わず innerHTML で入れる。** about:blank に対する
 *      document.write は一部ブラウザで後続の location 差し替えを妨げる。
 *   3. **JS を埋め込まない。** インラインスクリプトはポップアップの CSP で
 *      弾かれることがある。動きは CSS アニメーションだけで作る。
 *   4. `prefers-reduced-motion` を尊重する(CharacterHere が useReducedMotion を
 *      見ているのと同じ配慮)。
 */

import { SHARE_WAITING_LOGO_DATA_URI } from "./share-waiting-logo.js";

/** 待機画面に出す文言。テストから参照するので export する。 */
export const SHARE_WAITING_TITLE = "Xでシェア";
export const SHARE_WAITING_MESSAGE = "りんくがみんなに位置を知らせる準備をしているよ";
export const SHARE_WAITING_SUBTEXT = "もうすぐXの投稿画面がひらきます";

/**
 * 待機画面の HTML を返す。
 *
 * 色は theme/tokens と DESIGN.md に合わせる(ネイビー #00427B / オレンジ #DD6500 /
 * 地 #F0F4F8)。トークンを import せず直値なのは、about:blank に流し込む
 * 独立した文字列であり、バンドラの解決を経由しないため。
 */
export function buildShareWaitingHtml(): string {
  return `
<div class="wrap">
  <div class="card">
    <img class="logo" src="${SHARE_WAITING_LOGO_DATA_URI}" alt="君斗りんく" />
    <div class="trail" aria-hidden="true">
      <span class="step s1">🐾</span>
      <span class="step s2">🐾</span>
      <span class="step s3">🐾</span>
      <span class="pin">📍</span>
    </div>
    <p class="msg">${SHARE_WAITING_MESSAGE}</p>
    <p class="sub">${SHARE_WAITING_SUBTEXT}</p>
  </div>
</div>
<style>
  :root { color-scheme: light dark; }
  body {
    margin: 0;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #F0F4F8;
    color: #0F172A;
    font-family: -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Noto Sans JP", sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .wrap { padding: 24px; width: 100%; box-sizing: border-box; }
  .card {
    max-width: 440px;
    margin: 0 auto;
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    border-radius: 20px;
    padding: 32px 24px 30px;
    text-align: center;
    box-shadow: 0 6px 24px rgba(0, 66, 123, 0.08);
  }
  /* ロゴは data URI（外部参照禁止の制約のため）。
     幅で決めて高さは auto。読み込み失敗しても alt が出るだけで崩れない。 */
  .logo {
    display: block;
    width: min(132px, 42vw);
    height: auto;
    margin: 0 auto 18px;
  }
  .trail {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    font-size: clamp(26px, 7vw, 32px);
    line-height: 1;
    margin-bottom: 20px;
  }
  /* 足あとが順に濃くなり、最後にピンが跳ねる = 「位置を知らせに向かっている」 */
  .step { opacity: 0.25; animation: paw 1.5s ease-in-out infinite; }
  .s1 { animation-delay: 0s; }
  .s2 { animation-delay: 0.25s; }
  .s3 { animation-delay: 0.5s; }
  .pin { animation: bounce 1.5s ease-in-out infinite; animation-delay: 0.75s; }
  @keyframes paw {
    0%, 60%, 100% { opacity: 0.25; }
    30% { opacity: 1; }
  }
  @keyframes bounce {
    0%, 60%, 100% { transform: translateY(0); }
    30% { transform: translateY(-5px); }
  }
  /* ★文字は大きく（2026-08-14）。
     この画面はスマホで数秒だけ見えるもので、以前は 15px / 13px と小さく
     「何が起きているのか読み取れない」状態だった。
     視距離の近いスマホで一目で読める大きさに上げ、上限も付けて
     デスクトップで間延びしないようにする。 */
  .msg {
    margin: 0 0 10px;
    font-size: clamp(20px, 5.4vw, 26px);
    font-weight: 800;
    line-height: 1.5;
    letter-spacing: 0.01em;
    color: #00427B;
  }
  .sub {
    margin: 0;
    font-size: clamp(15px, 3.9vw, 18px);
    line-height: 1.6;
    color: #475569;
  }
  @media (prefers-reduced-motion: reduce) {
    .step, .pin { animation: none; opacity: 1; }
  }
  @media (prefers-color-scheme: dark) {
    body { background: #0B1220; color: #E8EEF6; }
    .card { background: #131C2B; border-color: #24304A; box-shadow: none; }
    .msg { color: #7FB3E0; }
    .sub { color: #A8B6CA; }
  }
</style>`.trim();
}

/**
 * 開いた準備タブへ待機画面を描画する。
 *
 * 失敗しても呼び出し側は続行する(URL 差し替え自体は別経路で可能)。
 * about:blank への書き込みは、クロスオリジンでない限り許可される。
 */
export function renderShareWaitingScreen(popup: Window): void {
  const doc = popup.document;
  doc.title = SHARE_WAITING_TITLE;
  // lang を入れておくと日本語のフォント選択とスクリーンリーダーの読みが安定する。
  doc.documentElement.setAttribute("lang", "ja");
  doc.body.innerHTML = buildShareWaitingHtml();
}
