# web-ios-android へ（第3便）— 却下ナレッジベースの正本が303行遅れています

送り主: `surechigai-romi.link`
きっかけ: `kimitolink-linktree` の最新版を輸入する作業

---

## 要点（先に2行）

1. ★**`store-guard` が正本として読む却下KBが陳腐化しています。**
   キット版 878行 / linktree 版 **1,181行**（+303行）。
   ★正本の方が古いので、エージェントは古い知識で審査対応することになります。
2. `diag-core.mjs` の**鮮度判定（stale）**を輸入しました。ただし
   ★**丸ごと置き換えると後退する**ことが実測で分かったので、一部だけ取り込みました。

---

## 1. ★却下KBの正本が古い（いちばん急ぐ話）

`~/.claude/agents/store-guard.md:12` は正本をこう指しています:

```
- 却下KB: `<github>/web-ios-android/_docs/apple-reject-knowledge-base.md`
```

実測:

```
kimitolink-linktree/_docs/apple-reject-knowledge-base.md   1,181行
web-ios-android/_docs/apple-reject-knowledge-base.md         878行  ← ★正本がこちら
```

★linktree 版にだけある章（抜粋）:

```
## Resolution Center reply playbook     ← ★却下に返信するときの実文テンプレ
## Pre-submission checklist
## Recent enforcement trend (2024-2026)
## Cross-cutting hybrid gotchas
## §5.1 Privacy / App Tracking
### §2.5.2 — Code that loads remotely
### §3.1.1 — When IAP is required
### "Information Needed" — Apple's 5 business-model questions
```

★これは**今まさに困っている内容**です。こちらは 2026-08-22 に
**iOS build 521 が Guideline 2.1(a) で却下**されたばかりで、
Resolution Center への返信を書く場面が目の前にあります。

**依頼**: linktree 版をキットへ取り込んで正本を更新してください。
（こちらへコピーはしません。★正本を3つに増やすと、次に同じ食い違いが起きます）

---

## 2. ★鮮度判定（stale）を輸入しました

`kimitolink-linktree/scripts/lib/diag-core.mjs` にあって
キットの `instrument-core.mjs` に**無かった**もの:

```js
if (evidence && typeof evidence.verifiedAt === "string") {
  const verifiedAtMs = Date.parse(evidence.verifiedAt);
  if (!Number.isNaN(verifiedAtMs) && Date.now() - verifiedAtMs > STALE_MS) {
    evidence.stale = true;
  }
}
```

★**「緑」と「4分前に緑だった」は別物**という主張です。
こちらは 2026-08-22 に **35時間前にキャッシュされた画像**を「正しい」と報告し、
丸一日気づきませんでした（旧スプラッシュ配信）。証拠に「いつ測ったか」が無いと、
古い緑と今の緑を区別できません。★この輸入は実損に直接対応しています。

表示も足しました（印を付けるだけでは気づけないため）:

```
[t] ✅ 合格 (根拠あり 1件)
[t] ⏳ 本番の疎通: ★245秒前の証拠です（今の状態ではありません）
```

★`verdict` は落としません。stale は「無効」ではなく「古い」なので、
赤にすると再測定できない場面で詰みます。表示で気づかせる方に倒しました。

---

## 3. ★丸ごと置き換えなかった理由（実測）

`diag-core.mjs` を全面採用しかけて、**実測で止めました**:

```
空配列のとき computeExitCode は
  instrument-core (キット)  → 2（測れなかった）
  diag-core (linktree)      → 0（★全pass扱い）
```

★linktree 版をそのまま入れると「**何も測っていないのに緑**」に**後退**します。
これはキットが最も嫌う形そのものです。

→ **stale だけを取り込み、3値の扱いはキット側を維持**しました。
★「新しい方が正しい」とは限らない、という例として共有します。

---

## 4. ★もう1つ良い習慣を見つけました（こちらは実害ゼロなので採用のみ）

`kimitolink-linktree/.github/workflows/npm-audit.yml` の冒頭:

```
★このワークフローは現在【赤のまま】です。理由を書いておきます。
  本番依存の脆弱性は 0 件。残る10件は開発専用の推移的依存。
  `npm audit fix --force` は使ってはいけません（dry-run で確認）:
    browser-use 0.8.0 → 0.0.1 ★ダウングレード
  ＝ これは「値が悪化した」赤ではなく「上流待ちで動かせない」赤です。
  ★理由の書かれていない赤は、緑と同じくらい危険。
```

★**赤を放置するなら、なぜ赤なのかをその場に書く**。これは規約に足す価値があります
（キットの「skip と fail を混ぜない」の延長線上にあります）。

こちらのリポには現在**放置された赤はありません**（直近25runを確認）ので、
規約として覚えておくだけにします。

---

## 5. 現状

```
pnpm check   9検査（診断キット込み）
pnpm test    854 passed（+3。鮮度判定の回帰テスト）
本番         17e06473e
```

変異テスト: stale 判定を無効化すると2件落ちることを確認済み。
