import { describe, expect, it, vi } from "vitest";

import {
  SHARE_WAITING_MESSAGE,
  SHARE_WAITING_SUBTEXT,
  SHARE_WAITING_TITLE,
  buildShareWaitingHtml,
  renderShareWaitingScreen,
} from "../lib/share-waiting-screen";

/**
 * Xシェアの準備タブに出す待機画面。
 *
 * この画面の唯一の目的は「about:blank の白画面を見せない」こと。
 * シェアは「先に空タブを開く → 共有リンクを発行 → X へ差し替える」順で動き、
 * リンク発行を最大 8 秒待つ(SHARE_SLUG_TIMEOUT_MS)。その間タブは about:blank
 * のままなので、何も描かないと数秒間まっさらな画面が見える。
 *
 * ここで固定するのは「白画面に戻る変更」を弾くための不変条件。
 * 見た目の良し悪しはテストできないが、**外部リソースに依存し始めた**ことは
 * 検出できる ＝ それが about:blank で画面が出なくなる最大の原因なので固定する。
 */
describe("シェア待機画面", () => {
  const html = buildShareWaitingHtml();

  it("ユーザーに見える文言が入っている(空タブに戻っていない)", () => {
    expect(html).toContain(SHARE_WAITING_MESSAGE);
    expect(html).toContain(SHARE_WAITING_SUBTEXT);
    // 「りんくが知らせに行く」という主体を必ず名乗る。単なる "Loading..." に
    // 差し替わったら、この画面の意図(待ち時間を世界観で埋める)が失われる。
    expect(SHARE_WAITING_MESSAGE).toContain("りんく");
  });

  describe("about:blank で確実に描画されるための制約", () => {
    // 以下はどれも「破ると白画面/崩れた画面に戻る」もの。
    // 理由は lib/share-waiting-screen.ts の冒頭コメントに対応する。

    it("外部リソースを一切参照しない", () => {
      // 画像・CSS・フォントを外部から読むと、about:blank では CSP や
      // 読み込み遅延で「何も出ないまま X へ飛ぶ」ことになる。
      //
      // ★<img> 自体は禁止していない（2026-08-14）。ロゴを data URI で
      //   埋め込むのは「外部から取りに行かない」ので制約に反しない。
      //   禁じたいのは *ネットワークを叩くこと* であって img タグではない。
      //   そのため src は data: 以外を許さない、という形で縛る。
      expect(html).not.toMatch(/<link\b/i);
      expect(html).not.toMatch(/url\(\s*['"]?https?:/i);
      expect(html).not.toMatch(/@import/i);
      expect(html).not.toMatch(/https?:\/\//);

      // img があるなら、その src はすべて data: であること
      const srcs = [...html.matchAll(/<img\b[^>]*\bsrc\s*=\s*"([^"]*)"/gi)].map((m) => m[1]);
      for (const src of srcs) {
        expect(src.startsWith("data:image/")).toBe(true);
      }
    });

    it("ロゴを data URI で埋め込んでいる（ブランドを見せる）", () => {
      // 待機画面は数秒とはいえユーザーが必ず見る面。
      // 以前は絵文字だけで、誰のアプリか分からなかった。
      expect(html).toMatch(/<img\b[^>]*class="logo"/i);
      expect(html).toMatch(/src="data:image\/png;base64,/);
    });

    it("文字がスマホで読める大きさである", () => {
      // 以前は 15px / 13px で「小さくて読めない」状態だった（実機で指摘）。
      // clamp の下限＝スマホでの実効値が十分大きいことを固定する。
      const msg = html.match(/\.msg\s*\{[^}]*font-size:\s*clamp\(\s*([\d.]+)px/);
      const sub = html.match(/\.sub\s*\{[^}]*font-size:\s*clamp\(\s*([\d.]+)px/);
      expect(msg).not.toBeNull();
      expect(sub).not.toBeNull();
      expect(Number(msg![1])).toBeGreaterThanOrEqual(20);
      expect(Number(sub![1])).toBeGreaterThanOrEqual(15);
    });

    it("スクリプトを埋め込まない", () => {
      // インラインスクリプトはポップアップの CSP で弾かれることがある。
      // 動きは CSS アニメーションだけで作る。
      expect(html).not.toMatch(/<script\b/i);
      expect(html).not.toMatch(/\bon[a-z]+\s*=/i);
    });

    it("スタイルが同梱されている(素のテキストではない)", () => {
      // 以前は popup.document.body.textContent に一行入れるだけで、
      // 実質白画面に見えていた。style を持つことが最低条件。
      expect(html).toMatch(/<style>/);
      expect(html).toContain("background");
    });
  });

  describe("見た目の前提", () => {
    it("DESIGN.md のトークン色を使う", () => {
      // 地 #F0F4F8 / primary #00427B。ここが変わるならブランド判断を伴う変更。
      expect(html).toContain("#F0F4F8");
      expect(html).toContain("#00427B");
    });

    it("ライト・ダーク両方と reduced-motion に対応する", () => {
      // CharacterHere が useReducedMotion を見ているのと同じ配慮。
      expect(html).toContain("prefers-color-scheme: dark");
      expect(html).toContain("prefers-reduced-motion: reduce");
    });

    it("横スクロールを生む固定幅を持たない", () => {
      // カードは max-width で絞る。width 固定にするとスマホで見切れる
      // (このリポは日本地図の見切れを3度踏んでいる)。
      expect(html).toContain("max-width");
      // `max-width` にマッチさせないため直前が `-` でないことを要求する。
      // (最初 /\bwidth:\s*\d{3,}px/ と書いて max-width: 380px を誤検出した)
      expect(html).not.toMatch(/(^|[^-\w])width:\s*\d{3,}px/);
    });
  });

  describe("renderShareWaitingScreen", () => {
    it("タイトルと lang と本文を書き込む", () => {
      const setAttribute = vi.fn();
      const popup = {
        document: {
          title: "",
          documentElement: { setAttribute },
          body: { innerHTML: "" },
        },
      } as unknown as Window;

      renderShareWaitingScreen(popup);

      expect(popup.document.title).toBe(SHARE_WAITING_TITLE);
      expect(setAttribute).toHaveBeenCalledWith("lang", "ja");
      expect(popup.document.body.innerHTML).toContain(SHARE_WAITING_MESSAGE);
    });

    it("document.write を使わない(後続の location 差し替えを妨げる)", () => {
      // about:blank への document.write は一部ブラウザで location.href の
      // 差し替えを妨げ、空タブが残る原因になる。innerHTML で入れること。
      const write = vi.fn();
      const popup = {
        document: {
          title: "",
          write,
          documentElement: { setAttribute: vi.fn() },
          body: { innerHTML: "" },
        },
      } as unknown as Window;

      renderShareWaitingScreen(popup);

      expect(write).not.toHaveBeenCalled();
    });
  });
});
