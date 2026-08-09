import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Threads の Web Intent の仕様を固定する。
 *
 * なぜ追加したか（2026-08-09）:
 *   実地でユーザーに聞いたところ「Instagram と Threads しかやっていない」層が相当数いた。
 *   X だけでは届かない。Threads は X と同じく**アプリ登録も認証も不要**の公式 Web Intent
 *   （https://developers.facebook.com/docs/threads/threads-web-intents/）があるため、
 *   実質ゼロコストで届く範囲を広げられる。
 *
 * なぜソース検査なのか:
 *   buildThreadsIntentUrl は非公開関数で、lib/share.ts は expo-haptics /
 *   react-native に依存し vitest では読み込めない（既存の share 系テストと同じ制約）。
 *   ここで守りたいのは「公式仕様どおりのURLを組んでいるか」なので、
 *   組み立て部分の文字列を検査すれば足りる。
 *
 * X との差分（間違えやすいので明記）:
 *   - ハッシュタグは `hashtags` ではなく **`tag`（1つだけ）**
 *   - ドメインは threads.com（threads.net から移行済み）
 *   - パスは /intent/post（X は /intent/tweet）
 */
describe("Threads Web Intent", () => {
  const src = readFileSync(join(__dirname, "..", "lib", "share.ts"), "utf8");
  const builder = src.slice(
    src.indexOf("function buildThreadsIntentUrl"),
    src.indexOf("/**\n * 新しいタブで開く"),
  );

  it("組み立て関数が存在する", () => {
    expect(builder.length).toBeGreaterThan(0);
  });

  it("公式のエンドポイントを使う", () => {
    // 公式ドキュメントの記載どおり。threads.net ではなく threads.com。
    expect(builder).toContain("https://www.threads.com/intent/post");
  });

  it("text と url を渡す", () => {
    expect(builder).toContain('params.set("text"');
    expect(builder).toContain('params.set("url"');
  });

  it("ハッシュタグは tag（X の hashtags ではない）", () => {
    // Threads は `tag` パラメータで、しかも**1つだけ**。
    // X の癖で hashtags を渡すと単に無視される（silent failure）。
    expect(builder).toContain('params.set("tag"');
    expect(builder).not.toContain('params.set("hashtags"');
  });

  it("tag に使えない文字を含むものは渡さない", () => {
    // 公式仕様: 改行・タブ・ピリオド・アンパサンドは不可（50文字以内）。
    // 弾かずに渡すと intent 全体が壊れるおそれがある。
    expect(builder).toMatch(/\[\\n\\t\.&\]/);
  });

  it("URLSearchParams で組む（percent-encoding が必須のため）", () => {
    expect(builder).toContain("URLSearchParams");
  });
});

/**
 * Instagram は**意図的に対応しない**。その判断をコードのコメントに残してあることを固定する。
 *
 * 理由（調べた結果・2026-08-09）:
 *   - Instagram には intent 相当が存在せず、Meta が意図的に塞いでいる
 *   - フィード投稿のキャプション事前入力は公式に提供されていない
 *   - Stories 共有はネイティブ限定（Web 不可）＋ Facebook App ID 必須 ＋ 9:16 画像の別途生成が必要で、
 *     しかも**本文にリンクを埋められない**（このアプリは OGP 付き URL を配る設計なので噛み合わない）
 *   - Graph API は個人アカウント非対応（ビジネス/クリエイター必須・審査2〜4週間）
 *   - Buffer ですら個人 Instagram には自動投稿できず「通知して手動完了」方式にしている
 *
 * 「なぜ Instagram が無いのか」を後から来た人が調べ直さずに済むよう、記録を消さない。
 */
describe("Instagram を対応しない判断の記録", () => {
  const src = readFileSync(join(__dirname, "..", "lib", "share.ts"), "utf8");

  it("理由がコードに残っている", () => {
    expect(src).toContain("Instagram");
    expect(src).toMatch(/Stories|Graph API/);
  });
});
