# drizzle/直下の旧テンプレート残骸 整理提案（実装せず・提案のみ）

refactor-instructions.md Phase 7 の確定事項2「`drizzle/`直下の古いマイグレーション群
（`0000_*.sql`〜`0029_*.sql`）と`meta_broken/`、`migrations-archive/`は削除しない。
整理は提案のみ」に基づき、実削除はせずここに調査結果と選択肢だけをまとめる。

## 現状（2026-07-16 実測）

`drizzle.config.ts` は `out: "./drizzle/migrations"` を明記しており、
drizzle-kit が実際に読み書きするのは `drizzle/migrations/` のみ。
以下はどこからも参照されていない：

| パス | 内容 | サイズ | 由来 |
|---|---|---|---|
| `drizzle/0000_*.sql` 〜 `0029_*.sql`（30ファイル） | 旧テンプレート（どいんチャレンジ）のマイグレーションSQL | 数KB〜数十KB/ファイル | `c2da1061b`（"import doin-challenge template as baseline"）で導入されたまま |
| `drizzle/meta_broken/` | `_journal.json` + `0000`〜`0028`の`_snapshot.json` | 1.8MB | 同上。`_journal.json`の`"dialect": "mysql"` — 旧テンプレートがMySQL前提だった頃のスナップショットで、現行のPostgreSQL方言とは無関係 |
| `drizzle/migrations-archive/` | `0000`〜`0010`のSQL・スナップショット・`_journal.json`・`README.md` | 204KB | `migrations-archive/README.md`に経緯の記載あり。2026-07-06に本番DBとの乖離を修復した際、`drizzle/migrations/`から意図的に退避した証跡 |

対して正のマイグレーション（`drizzle.config.ts`が参照）：

| パス | 内容 | サイズ |
|---|---|---|
| `drizzle/migrations/` | baseline 1件（`0000_baseline_rebase.sql`）+ 現行の`meta/` | 85KB |

## `migrations-archive/` と `meta_broken/` の違い（重要）

- **`migrations-archive/`**: README.mdに明記された、正当な理由（本番DBとの乖離修復）で
  意図的に退避した履歴の証跡。**削除しない方が良い** — 将来同種の乖離調査をする際の
  参照資料になる。
- **`meta_broken/`**: 名前からしてテンプレート由来の「壊れた」スナップショット。
  MySQL方言で現行PostgreSQLとは無関係。`migrations-archive/`とは異なり、
  正当な移行の証跡ではなく単純な旧テンプレートの取り込み残骸。

## 選択肢

### 選択肢A: 現状維持（提案の範囲内で最も安全）
何もしない。リポジトリサイズが約2MB余分だが、実害はゼロ（drizzle-kitからも
アプリケーションからも参照されない）。

### 選択肢B: `drizzle/0000_*.sql`〜`0029_*.sql`と`meta_broken/`のみ削除
根拠: どちらも「どいんチャレンジ」テンプレートの残骸で、`migrations-archive/`のような
正当な退避の証跡ではない。`git log`上は`git show <commit>:<path>`で将来も復元可能。
`migrations-archive/`は削除せず残す（README.mdの通り、今後の参照資料として有用）。

### 選択肢C: 全て削除
`migrations-archive/`も含めて削除。ただし`migrations-archive/README.md`が
「削除はしない」と明記した経緯があるため、**推奨しない**。

## 推奨

選択肢B。ただし以下の理由で今回は実装せず、ユーザー判断を仰ぐ：

1. DB migration履歴に関わる領域であり、`refactor-instructions.md`が
   明示的に「確定事項として削除禁止」としている
2. `0000_*.sql`〜`0029_*.sql`のSQL内容が、万が一にも
   本番DBのどこかと関連している可能性をゼロとは断言できない
   （`nagano_visit_reports`という孤立テーブルの例もあり、
   このプロジェクトのDB履歴には過去に想定外の紐付きがあった）

## 実行する場合の手順（参考、未実施）

```bash
# 1. 削除前に最終確認: これらのファイルへの参照が本当に無いか
grep -rn "meta_broken\|0000_certain_william_stryker\|0029_users_add_prefecture" \
  --include="*.ts" --include="*.js" --include="*.json" --include="*.md" . \
  | grep -v node_modules | grep -v "\.git/"

# 2. 削除（migrations-archive/は対象外）
git rm -r drizzle/0*.sql drizzle/meta_broken/

# 3. 検証
pnpm check
pnpm db:push --dry-run  # もしdrizzle-kitにdry-runがあれば
```

## 補足: `nagano_visit_reports` 孤立テーブルについて

`migrations-archive/README.md`が言及する、本番DBに存在するがコード側にスキーマ定義の
無い孤立テーブル。これも今回の調査スコープ外（DBの実データに触れる判断が必要なため）。
別途、本番DBへの実接続確認を伴う調査として扱うべき。
