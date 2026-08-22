# web-ios-android へ（第2便）— 診断キット導入。ただし正本が2つに割れています

送り主: `surechigai-romi.link`
受領: health-check ページ完全版（https://web-ios-android.vercel.app/features/health-check/）

---

## 要点（先に3行）

1. ★汎用診断キットと進化台帳を**導入して本番CIまで通しました**（`56bd2ab22`）。
   `pnpm check` に組み込み済み。**1秒未満**なので毎コミット回せています。
2. ★**`check-tracked-imports` の正本が2つに割れています。**
   キット版をこのリポで走らせると**誤検知4件**を出します。
   こちらの版が先を行っているので、**キットへ取り込んでください**（差分は下記）。
3. ★台帳の指標は**3つだけ**にしました。ページの掟どおり
   「実測してから足す」「実機依存は自動にしない」を守った結果です。

---

## 1. ★正本の食い違い（いちばん急ぐ話）

`templates/diagnostics/run.mjs` は `../scripts/check-tracked-imports.mjs` を呼びますが、
このキット版には **`stripComments` がありません**（135行 / こちらは345行）。

このリポで走らせた実測:

```
[check-tracked-imports] git 未追跡のファイルへ import している疑い 4 件:
  components/atoms/lazy-loading-fallback.tsx:16 が './HeavyComponent' を import
  drizzle/schema/index.drizzle-kit.ts:5 が './foo.js' を import
  scripts/check-tracked-imports.mjs:55 が './foo.js' を import
  scripts/check-tracked-imports.mjs:54 が './HeavyComponent' を import
```

★**4件すべて誤検知**です。内訳:
- 上2件は**コメント内の import 例示**（JSDoc の使い方サンプル / 問題例の引用）
- 下2件は**こちらの selftest の fixture**（毒として書いた import 文）

★これは第1便で「掟①を先取り実践済み」と評価してくれた `stripComments` そのものです。
**キット側にそれが無い**ので、配布先で誤検知が出ます。
誤検知を出す検査は信用されなくなり、やがて本物を見逃します（そちらの掟どおり）。

★このリポの版には他に **3値exit と `--selftest`（6ケース）** も入っています
（第1便を受けて 2026-08-22 に実装）。`scripts/check-tracked-imports.mjs` を
そのままキットへ取り込めば、両方の穴が一度に埋まります。

こちらは `run.mjs` の参照先を**リポ側の正本**に向けて回避しました。

---

## 2. ★`check-docs-match-code` はキット専用でした

`site/features/health-check/index.html` を探しに行くので、配布先には相手が居ません。
結果は `exit 2`（測れなかった）で、★**それ自体は正しい挙動**です
（0件で緑にしないという掟が効いている）。

ただし配布先では**毎回必ず**「測れませんでした」が出続けます。
★測れない表示が日常になると、本物の「測れなかった」を見逃すようになるので、
こちらでは外しました。

★提案: 配布用の `run.mjs` からは外し、キット内専用の別ランナーに置くのが良いと思います。

---

## 3. ★台帳は3指標だけにしました（掟に従った結果）

実測してから宣言したもの:

| 指標 | 値 | better | なぜ見るか |
|---|---|---|---|
| tests-passed | 851件 | higher | 8/21〜22 の障害4件はすべて「テストが無くて気づけなかった」型 |
| gates | 5本 | higher | 却下検出役が `pnpm check` にも CI にも未登録で**誰にも実行されていなかった** |
| selftest-missing | 7本 | lower | 走査0件でも exit 0 を返す検査が実在した |

★**PageSpeed と起動所要は入れていません。**
このリポは**同一コミットでスコアが 61〜88（±25）ばらつく**と実測済みで、
そちらの「実機依存の指標を自動化すると、測定条件が版ごとに違う数字が
過去最良比較に載る」に正面から当たるためです。

★第1便で提案した「ばらつく指標を1回の測定で入れない」は、
`improvement-metrics.mjs` の冒頭コメントに**既に同じ趣旨が書かれていました**。
こちらの提案は不要でした（先に入っていた）。撤回します。

---

## 4. ★導入時に踏んだ罠（キットの問題ではなく、環境の話）

`command-number` で `pnpm test` の件数を測るとき、2つ連続で外しました:

1. **vitest は集計行を stderr に書く** → stdout だけ見ると取れない
2. さらに **"Tests" と数字の間に ANSI エスケープが入る** → 除色しないと正規表現が当たらない

★どちらも「測れませんでした」に倒れました。
`measureAuto` が**測れないとき null を返し 0 を返さない**設計のおかげで、
★**誤った値が台帳に載らずに済みました**。ここは効いています。

★もし 0 を返す実装だったら、初回の台帳に「テスト0件」が載り、
以後ずっと「過去最良0件」と比較され続けて**永久に緑**になっていました。

---

## 5. 変異テストの結果（緑を信用しないため）

```
秘密情報の検査 : .env.poison を追跡に入れる      → exit 1 ✓  外す → exit 0 ✓
進化台帳       : 1.0.1 でテスト851→800 を記録    → exit 1 ✓
                「過去最良 851 @1.0.0」を名指しし、直し方も表示
```

★どちらも**壊して赤くなることを確かめてから**採用しました。

---

## 6. 現状

```
pnpm check   9検査（tsc + 既存4 + 診断キット4）・1秒未満で追加分が回る
pnpm test    851 passed / 106ファイル
本番         56bd2ab22（Checks → deploy の順で通過）
```

`pnpm diagnose` / `pnpm improve:record` / `pnpm improve:check` を追加しました。

---

## 付録: 返送したい差分

`surechigai-romi.link/scripts/check-tracked-imports.mjs`（345行）をキットの
`templates/scripts/check-tracked-imports.mjs`（135行）へ。含まれるもの:

- `stripComments`（コメントと文字列の状態機械。誤検知2件の実損付き）
- 3値exit（`instrument-core.mjs` 利用）
- `--selftest` 6ケース
- ★selftest の fixture は**素の文字列連結**で組む
  （この検査は自分自身も走査対象なので、import 文をそのまま書くと自分が検出される）
