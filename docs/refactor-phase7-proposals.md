# Phase 7 提案ドキュメント — 大きな設計変更（実装せず提案のみ）

このドキュメントは `refactor-instructions.md` の Phase 7「大きな設計変更は提案のみ」に基づき作成した。
Non-Negotiables / Stop And Ask Conditions に該当するため、以下はいずれも**実装していない**。

対象:

1. `getMyEncounters` の N+1 最適化（本実装）
2. 認証フローの分割
3. `drizzle/` の migration 整理
4. DB schema 変更

---

## 1. `getMyEncounters` の N+1 最適化

### 現状

`modules/encounter/db/queries.ts` の `getMyEncounters`（562行目〜）は、`encounters` を最大20件取得した後、
行ごとにループしながら以下を都度クエリしている。

- `users` テーブルからパートナー1名を取得（`WHERE id = partnerId LIMIT 1`）
- `twitterUserCache` からTwitterキャッシュを取得（`WHERE twitterUsername = ... LIMIT 1`）
- `encounters` からパートナーの累計すれ違い数を取得（`WHERE userAId = partnerId OR userBId = partnerId`）

最大20件のループなので、最悪ケースで `1 (blocks) + 1 (encounters一覧) + 20 × 3 = 62` クエリになる。

### 契約テストで固定済みの前提（Phase 6で完了）

`__tests__/get-my-encounters-contract.test.ts` に以下の返却契約をテスト済み:

- 返却順は DB が返した順序をそのまま維持する
- 件数は DB が返した行数分
- ブロック関係（双方向）にあるパートナーは除外
- 停止ユーザー（`isSuspended`）は除外
- パートナーのユーザー行が存在しない場合は除外
- `partnerHitokoto` / `partnerHitokotoUpdatedAt` は素通し（24hフィルタは `list` プロシージャ側の責務）
- Twitterキャッシュがあればユーザー名・表示名・画像・フォロワー数はキャッシュ優先
- `partnerId` は `userAId === self` かどうかで向きを判定

### 最適化案

1. **パートナー情報のバッチ取得**: `rows` から `partnerId` の集合を作り、`inArray(users.id, partnerIds)` で一括取得して `Map<number, User>` に変換。ループ内の `users` 個別クエリを廃止。
2. **Twitterキャッシュのバッチ取得**: 手順1で得た `usernameCandidate` の集合を `inArray(twitterUserCache.twitterUsername, usernames)` で一括取得し `Map<string, Cache>` に変換。
3. **累計すれ違い数のバッチ取得**: `partnerId` ごとに `encounters` を `GROUP BY` して集計する1クエリに置き換える。Drizzle では `sql` テンプレートで `CASE WHEN userAId = ANY(...) THEN userBId ELSE userAId END` のような相手ID算出式をSELECTしつつ `GROUP BY` する必要があり、既存の `getEncounterPrefectures`（750行目付近）が類似パターンを持つので参考にできる。
4. 上記3つを `Promise.all` で並行取得してから、既存のループでは「取得済みMapからの組み立てのみ」にする。

### なぜ Phase 6 で実装しなかったか

- 現在の契約テスト（`createMockDb`）は「テーブル名ごとに呼び出し順で消費するキュー」という単純な設計で、`WHERE id = X LIMIT 1` のような単発クエリ列を模倣するには十分だが、`inArray` によるバッチクエリ（1回の呼び出しで複数IDの結果をまとめて返す）を正しく検証するには、モックのシグネチャ自体を「引数の値に応じて結果を返す」方式に作り替える必要がある。
- ループ構造自体を「先にバッチ取得 → 後で組み立て」の2段階に変えるのは、`checkIn` のような単純な純粋関数抽出と違い、クエリ発行のタイミング・エラーハンドリング（現状は行ごとに `continue` で早期スキップ）の設計変更を伴う。
- Non-Negotiables に「無関係な整形をしない」「返却契約を変えない」とあり、リスクを最小化するには、バッチ化後も1行ずつ確認できる形でテストを拡張してから着手すべきと判断した。

### 移行手順（提案）

1. `createMockDb` に「`where` に渡された値を検査して結果を返す」モードを追加する（例: `inArray` の第2引数配列を見て、含まれるIDに対応するfixtureを返す）。
2. バッチ版の契約テストを追加し、既存の `__tests__/get-my-encounters-contract.test.ts` の12テストと同じ結果になることを確認する（返却契約は変えない）。
3. `getMyEncounters` を段階的に書き換える: まずパートナー情報のバッチ化のみ実施 → `pnpm test` → Twitterキャッシュのバッチ化 → `pnpm test` → 累計カウントのバッチ化 → `pnpm test`。
4. 可能であれば、実DB（Railway、ステージング環境推奨）に対して `pnpm dev` 経由で `encounter.list` を手動確認し、レスポンス内容が変わらないことを目視確認する。
5. 本番相当データでのクエリ件数削減（N+1 → 定数回）をログまたはAPMで確認する。

---

## 2. 認証フローの分割

### 現状の高結合箇所

- `hooks/use-auth.ts`
- `app/auth/kimito-link.tsx`（今回 Phase 3 で `navigateReplace` 呼び出しに変更したが、認証ロジック自体は未変更）
- `server/_core/index.ts`（Express側の認証関連処理）
- `server/_core/oauth.ts`, `server/twitter-routes.ts`
- Clerk Satellite 設定、kimito.link 経由の1タップ導線

### なぜ実装しないか

- `refactor-instructions.md` の確定事項3に明記の通り「認証フローの分割は今回提案のみ。手動E2E確認は今回計画しないため、認証実装には触らない」。
- Stop And Ask Conditions に「`hooks/use-auth.ts`、`server/_core/oauth.ts`、`server/twitter-routes.ts`、Clerk Satellite の挙動に影響する」変更は該当。
- 既存メモリ（`surechigai-qa-auth-save.md` 等）にある通り、認証まわりは過去に「QAツールの誤認」等のデリケートな経緯があり、手動E2E計画なしでの変更はリスクが高い。

### 提案する分割方針（実装しない、設計案のみ）

1. **`use-auth.ts` の責務分離**: 現状「Clerkセッション監視」「Web/Native分岐」「バックエンド同期」が1フックに同居していると推測される（今回のリファクタでは中身を読み込んでいない）。まず読み取り専用で現状の責務一覧を作ることを次のステップとして推奨。
2. **`kimito-link.tsx` の1タップ導線とサーバー側 OAuth コールバックの境界を明文化**: `buildSignInAutoXHref` のような「Clerkの自動クリック」導線がどこまでクライアント側の関心事で、どこからサーバー側（`server/twitter-routes.ts`）の関心事かを図示するドキュメントを先に作る。
3. **必要なテスト/手動確認手順（実装前に必須）**:
   - X ログイン→初回チェックイン→ログアウト→再ログインの一連を実ブラウザで手動確認（Playwright推奨、既存の `playwright-headless-recording` スキルパターンを流用可能）。
   - Clerk Satellite ドメイン（`surechigai-romi.link` と `surechigai.kimito.link` など）の両方でセッション引き継ぎを確認。
   - 変更後に `.auth/auth-state.json` を使った `e2e:auth-save` の再検証（既存メモリに「auth-saveがauto=xなしでアクセスしていた誤認」の経緯があるため、二重チェックが必要）。
4. 上記の手動確認計画がユーザーから明示的に承認された後にのみ着手する。

---

## 3. `drizzle/` の migration 整理

### 現状

`drizzle/` 直下に古いマイグレーションSQLファイル群と `drizzle/meta_broken/` ディレクトリが存在する（確定事項5により削除しない）。`drizzle/migrations/` が正規のマイグレーション置き場と推測されるが、直下の古いファイルとの関係が一見して分かりにくい。

### なぜ実装しないか

- 確定事項5「`drizzle/` 直下の古いマイグレーション群と `meta_broken/` は削除しない。整理は提案のみ」に明記。
- Stop And Ask Conditions「`drizzle/schema/*`、`drizzle/migrations/*`、本番DBデータに影響する変更が必要になった」に該当しうる。

### 提案する整理方針（実装しない）

1. まず `drizzle/` 直下のSQLファイルと `drizzle/migrations/` の中身を突き合わせ、「どちらが現在Railway本番に適用済みか」を `pnpm db:push` や Drizzle の migration journal（`drizzle/migrations/meta/_journal.json` 等）から確認する。
2. 突き合わせ結果を元に、README.md または CLAUDE.md に「`drizzle/migrations/` が正規。直下の `*.sql` と `meta_broken/` は過去の移行残骸で削除しないが参照しない」という一文を追記する（コメントのみ、ファイル移動はしない）。
3. 将来的にファイル整理をする場合は、本番DBのスキーマ実態（`\d` や `information_schema` での確認）と `drizzle/migrations/` の journal が一致していることを検証してから、別タスクとして実施する。

---

## 4. DB schema 変更

今回のリファクタでは DB schema（テーブル定義・カラム）そのものの変更は一切行っていない。
`drizzle/schema/*.ts` に加えた変更はコメント（Supabase→Railway、48h削除→永続保存の記述整合）のみで、
`pgTable(...)` の列定義・型・制約は変更していない。`pnpm db:push` も実行していない。

DB schema 変更が必要になった場合は、本ドキュメントではなく都度ユーザーに確認すること
（`refactor-instructions.md` の Stop And Ask Conditions に明記）。
