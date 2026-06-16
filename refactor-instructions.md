# Refactoring Instructions for surechigai-romi.link

## Objective
既存の仕様（ユーザー体験、位置情報プライバシー、マッチングロジックなど）を一切壊すことなく、技術的負債（依存関係の逆転、責務の混在など）を解消し、今後の機能追加やテストが容易なアーキテクチャへとコードベースをリファクタリングする。

## Project Understanding

**このプロジェクトは何をするものか:**
「すれちがいロミ」は、DSのすれちがい通信を現代に再現する位置情報マッチングアプリ。移動の副産物として「封筒（すれ違い）」が溜まり、後でまとめて開封する受動的な体験を提供する。

**主要なユーザー体験やワークフロー:**
1. X (Twitter) アカウントによるログイン (Clerk連携)
2. 「チェックイン」による位置情報送信とマッチング（リアルタイムおよびタイムシフト）
3. 「ポスト」タブでのすれ違い（封筒）の開封と、相手への一方向スタンプリアクション
4. 「図鑑」や「軌跡マップ」での実績確認

**主要なエントリーポイント:**
- フロントエンド: `app/` 以下のExpo Router画面 (`app/(tabs)/*`)
- API: `server/routers/index.ts` (tRPCルーターのエントリーポイント)
- バックエンド/インフラ: `server/_core/index.ts` (Expressサーバー)

**主要モジュールと責務:**
- `app/`: プレゼンテーション層（React Native / Expo）
- `modules/encounter/`: ドメインロジック層（マッチング、位置計算、DBアクセス）
- `server/`: インフラ層（tRPCルーター定義、Express、認証フロー、エラー監視）

**データフロー:**
フロントからのtRPC呼び出し -> `server/routers` -> `modules/encounter/api` -> `modules/encounter/core` & `modules/encounter/db` -> Supabase (PostgreSQL)

**外部依存:**
- DB: Supabase (PostgreSQL), Drizzle ORM
- 認証: Clerk + X (Twitter) OAuth 2.0
- 地図・位置情報: H3 (h3-js)
- モデレーション: Groq API / Gemini API

**現在の検証コマンド:**
- `pnpm check` (TypeScriptコンパイルチェック `tsc --noEmit`)
- `pnpm lint`
- `pnpm test` (Vitest)
- `pnpm e2e` (Playwright)

## Behaviors To Preserve (絶対に壊してはいけない既存挙動)
1. **位置情報のプライバシー保護:** 生の緯度経度は絶対にDBに保存しない。H3 res8 および 500mグリッドへの変換ロジックを維持すること。
2. **マッチングの二段構え:** オンデマンドマッチングと、過去30日間の同セル通過者とのタイムシフトマッチング。
3. **初回ボーナスマッチング:** マッチ0件時の都道府県単位での広域タイムシフト再検索ロジック。
4. **Vercel Functions/Expressのハイブリッド動作:** 開発環境(Express)と本番(Vercel Functions)の互換性。
5. **NGワードフィルタリング:** ひとこと更新時のGroq/Geminiによるモデレーション処理。

## Non-Negotiables (絶対に守るべき制約)
- `pnpm check` は常に 0 エラーであること。
- 新規に外部ライブラリを追加しないこと。
- 既存のDBスキーマ（`drizzle/schema`）を破壊的に変更しないこと。

## Stop And Ask Conditions (実装を止めて質問する条件)
- `modules/encounter/core/` 内のロジックに手を入れる際、テストが存在せず安全性が担保できない場合。
- 認証フロー（`server/_core/twitter-oauth2.ts`など）に影響する変更が必要だと判断した場合。
- `drizzle/schema.ts` の変更が必要になった場合。

## Baseline Commands
作業開始前および各フェーズの完了後に以下のコマンドを実行し、成功することを確認せよ。
```bash
git status
pnpm check
pnpm lint
pnpm test
```

## Debt Map (技術的負債マップ)

| 負債 | 根拠ファイル | なぜ負債か | 影響範囲・リスク | 改善案 | 検証方法 | 実装可否 |
|---|---|---|---|---|---|---|
| **依存方向の乱れ** | `modules/encounter/api/*.ts` | ドメイン層(`modules`)がインフラ層(`server/_core/trpc`)に依存している。 | 中〜高 (テスト困難化) | `api/*.ts`を`server/routers/`配下に移動し、`modules/`は純粋な関数群にする。 | `pnpm check` | **実装許可** |
| **責務の過剰な集中** | `modules/encounter/api/encounter.ts` | `checkIn`エンドポイント内でバリデーション、DB更新、外部API非同期呼び出し、複雑なマッチングロジックが全て直書きされている。 | 高 (ロジックの修正が極めて危険) | `modules/encounter/core/usecases.ts` を作成し、トランザクションやビジネスロジックを抽出する。 | 既存動作の再現確認 | **実装許可（小さく）** |
| **巨大な神ファイル** | `server/_core/twitter-oauth2.ts` 等 | 22KBを超えるファイルに認証とExpressルーティングが混在。 | 極大 (認証破壊リスク) | 関心の分離、細分化。 | 認証フローのE2Eテスト | **提案のみ** |
| **DBアクセスの密結合** | `modules/encounter/db/queries.ts` | `getDb()` を直接呼び出しており、DI(依存性の注入)がされていないためDB無しのユニットテストが不可能。 | 中 (テストの拡張性低下) | queries関数にDBインスタンス(db)を引数として渡すよう徹底し、ルーター側で注入する。 | ユニットテスト実行 | **実装許可** |

## Implementation Phases

**Phase 1: 現在状態と検証コマンドの確認**
- `git status`, `pnpm check`, `pnpm test` を実行し、ベースラインを記録する。

**Phase 2: 明らかに安全な整理（依存方向の修正）**
- `modules/encounter/api/*.ts` を `server/routers/` に移動する。
- パス解決（import）の修正のみを行い、ロジックは一切変更しない。
- **検証:** `pnpm check`

**Phase 3: DBアクセスのDI化（小さな責務分離）**
- `modules/encounter/db/queries.ts` の各関数が `db` インスタンスを第一引数として受け取るように統一する（一部はすでに対応済みだが徹底する）。
- **検証:** `pnpm check`

**Phase 4: ユースケースの抽出（境界の明確化）**
- `checkIn` などの肥大化したルーターロジックから、純粋なビジネスロジック部分を抽出する。
- 抽出する際は、元の振る舞い（非同期ジオコーディングのタイミングやエラーハンドリング）を1ミリも変えないこと。
- **検証:** `pnpm check` およびローカルでの動作確認。

**Phase 5: テストしやすい構造への移行（大きな設計変更は提案のみ）**
- `twitter-oauth2.ts` 等の認証系リファクタリングについては、現状のコード構造と問題点を分析した上で、どのように分割すべきかの「設計案」をMarkdownで出力し、実装は行わずに終了する。

## Verification Requirements
- 各フェーズの終わりに必ず `pnpm check` を実行し、エラーが0であることを確認する。
- 既存の未コミット変更がある場合は、自分の変更と混ぜずに作業を停止すること。

## Reporting Format
実装が完了（または停止）した際、最後に以下のフォーマットで報告すること。
1. 実行したフェーズ
2. 最後に実行したコマンドとその結果
3. （発生した場合）Stop And Ask Condition に抵触した理由と質問事項

## Out-of-scope Items
- 今回のリファクタリングでは、UX/UI（`app/` 以下のファイル）の変更は行わない。
- 認証フロー（Clerk, Twitter OAuth連携）のロジック変更は行わない（提案のみ）。
- 新機能の追加は絶対に行わない。
