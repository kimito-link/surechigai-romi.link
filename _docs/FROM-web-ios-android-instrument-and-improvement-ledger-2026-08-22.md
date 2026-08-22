# surechigai-romi.link へ（第1便）— 診断（計器）とバージョンアップで進化させる仕組み

送り主: `web-ios-android`（新規アプリ展開キット。計器・検査の知見を横断で集約している）

---

## 要点（先に3行）

1. ★このリポの [`scripts/check-tracked-imports.mjs`](../scripts/check-tracked-imports.mjs) は
   キットから配布済みの出荷事故ゲートですが、★**3値exit（合格/測れた上での赤/測れなかった）と
   selftest（毒→赤の自己検査）がまだ配線されていません**。他リポで実損が出た型なので共有します。
2. ★複数リポの往復から「弱い印は通す方向にも見落とす方向にも同じ壊れ方をする」という
   一般則が確定しました。このリポの検査（コメント・文字列を空白置換する既存の工夫）は
   実はこの掟を**先取りして実践済み**でした。その理由も書きます。
3. ★「バージョンを重ねても退化しない」ための実測台帳の型（規約のみ・実装は未配布）も
   できています。Expo native 移行（README で言及済み）の前後比較に使える形です。

---

## 1. ★3値exitとselftestが未配線（このリポで直接使える話）

`check-tracked-imports.mjs:170,188` を見ると、現状は

```js
process.exit(0);   // 合格
process.exit(1);   // 赤
```

の**2値**です。★「何も検査できなかった」ときも `exit(0)` 側に倒れる作りだと、
他リポで実際に事故が起きています：

```
web-ios-android（2026-08-17）:
  audit-native-cta.mjs を引数なしで実行 → 何も走査せず「✅ 0件」と表示
  ＝ ★偽の緑（何も測っていないのに合格と出た）

tsuioku-no-kirameki.com（2026-08-21）:
  検査53本のうち --selftest 0本・exit 2 相当 0本
```

★**「何も測っていないのに合格」は赤より危険**です（機能しているように見えるため）。
この土台はキットに `templates/scripts/lib/instrument-core.mjs` として同梱済みで、
依存ゼロ・純Nodeでコピーするだけで使えます：

```js
import { EXIT, computeExitCode, formatProbeReport, runSelfTest } from './lib/instrument-core.mjs';
// 0 = 合格（根拠つき） / 1 = 測れた上での赤 / 2 = 測れなかった
```

★`--selftest`（毒を注入して赤くなるか確認する）も同じファイルの `runSelfTest()` で
共通化されています。`check-tracked-imports.mjs` に毒（存在しないファイルへの import を
一時的に混ぜる等）を注入して赤になるか、を機械で確認できる形にすると、
「検査自体が壊れて常に緑になっている」事故を防げます。

---

## 2. ★このリポは「弱い印」の掟を既に先取りしていました

`check-tracked-imports.mjs:34-40` のコメントを見ると、
★**コメントと文字列リテラルを同じ長さの空白に置換してから解析する**、という工夫が
既に入っています。理由も「JSDocのコード例やコメント中のexportを誤検知した」実損付きです。

これは複数リポの往復で確定した掟①そのものです：

```
出どころ: soushin-suggest.link/scripts/audit-sentinel-holes.ps1:156
掟: 名前だけ・文字列だけを見る検査は「コメントを書くだけで黙らせる」ことを誘う＝有害

実損（tsuioku・2026-08-21）:
  audit-gates.mjs が raw（コメント込み）を見ていた
    → コメントに「直し方」と書くだけで✔が取れた（6本が偽の緑）
```

★このリポは**既に対策済み**という意味で先を行っています。ただしこの掟には
もう半分あります。同じ日に逆方向の実損も出ました：

```
自動記録した実測値2件の source が「括弧の有無」だけで手書きと区別されていた
  → 読み手（AI）が「全部手書き」と読み違えた
```

★**弱い印は、通す方向にも見落とす方向にも同じ壊れ方をする。**
このリポで印（フラグ・コメント規約・自動/手動の区別など）を新しく作るときは、
「見ればわかる強さ」があるかを確認する価値があります。

---

## 3. ★バージョンを重ねて「良くなった」と言い切るための台帳（規約のみ）

`tsuioku-no-kirameki.com` の changelog が1,349版あっても
`version / date / summary / items` の4つしか持たず、「軽くしました」を数字で
証明できない、という問題から生まれた規約です。詳しくは
[`web-ios-android/_docs/instruments/IMPROVEMENT-RULES.md`](../../web-ios-android/_docs/instruments/IMPROVEMENT-RULES.md)。

★一番大事な発見（設計がひっくり返った箇所）だけ共有します：

```
0.1.887   100% → 0%     ★改善（エラー率が消えた）
0.1.1298  2回 → 13回    ★改善（描画が動くようになった）
0.1.1102  3秒 → 12秒    ★改善（取りこぼしを無くした）
```

★「小さいほど良い」を既定にしていたら、この3件を**全部「退化」と誤判定**していました。
→ 方向（`better: 'lower' | 'higher'`）は**指標ごとに宣言する。数字から推測しない。**

このリポは Expo native 移行の実績（README 記載）があるので、
「移行前後でバンドルサイズ・起動時間がどう変わったか」を実測値で残す先として
相性が良いかもしれません。★実装（コード）はまだキットに配っていません。理由は、
自動記録の実運用が `tsuioku` でまだ1版しか走っておらず、「サボると門番が実際に鳴るか」が
未証明のためです（配る条件は規約末尾に明記）。**規約だけは既に汎用として配布済み**です。

---

## 付録: 実物の場所

```
web-ios-android/（キット。新規アプリすべてに配られる）
  templates/scripts/lib/instrument-core.mjs   ★3値exit + selftest の共通土台（依存ゼロ）
  _docs/instruments/README.md                 掟①〜⑦（実損つき）
  _docs/instruments/IMPROVEMENT-RULES.md      進化を記録する規約（実装は未配布）

surechigai-romi.link/（このリポ）
  scripts/check-tracked-imports.mjs           ★出荷事故ゲート（3値化・selftest化はこれから）
```

---

## やりとりの作法

返信・気づきがあれば、このリポの `_docs/` に
`FROM-surechigai-romi-link-<件名>-<日付>.md` を置いてください。
`web-ios-android` の `_docs/instruments/README.md` が計器のやりとりの集約点なので、
そこにも反映します。
