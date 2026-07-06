# アーカイブ済みマイグレーション（2026-07-06 リベースライン）

このディレクトリのファイルは、`drizzle/migrations/meta/_journal.json` と
本番DBの実態が乖離していた問題（`docs/uxux-stability-audit-SPEC.md` §1.2）を
修復するため、`drizzle/migrations/` から退避したものです。

## 何が起きていたか

本番DB（Railway PostgreSQL）の `drizzle.__drizzle_migrations` テーブルには
`0000`〜`0002`相当の3件しか記録がなかった。しかし `0003`〜`0010` の内容は
`scripts/apply-*.cjs` による直接ALTER等で、実際には本番DBに反映済みだった。
この状態で `pnpm db:push`（`drizzle-kit generate`→`migrate`）を実行すると、
「既に存在する列を二重に追加しようとしてエラー」になる状態が続いていた。

## どう直したか

1. ここにある全ファイル（`0000`〜`0010`のSQL・スナップショット・`_journal.json`）を
   `drizzle/migrations/` から退避（履歴の証跡として保持、削除はしない）
2. 現行の `drizzle/schema/index.ts` から新規baseline
   `drizzle/migrations/0000_baseline_rebase.sql` を生成
3. 本番DBの `drizzle.__drizzle_migrations` を全削除し、baseline 1件だけを
   「適用済み」として記録し直した（テーブル・列・データ自体は無変更）
4. `drizzle-kit migrate` が差分ゼロで正常終了することを確認済み

## 注意

- `nagano_visit_reports` テーブルは本番DBに存在するが、コード側に対応する
  drizzleスキーマ定義が無い孤立テーブル（0行、旧テンプレートの残骸と推測）。
  今回のリベースラインでは意図的に対象外とした。削除するかどうかは別途判断すること。
- 今後 `drizzle/migrations/` の中身を直接いじらず、必ず
  `pnpm db:push`（`scripts/run-drizzle.cjs`経由）で生成・適用すること。
