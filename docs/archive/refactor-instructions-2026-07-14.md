# Refactoring Instructions for surechigai-romi.link

このファイルは、実装担当モデルに渡す作業指示書です。**2026-07-14 に現行コードの実測にもとづいて全面改訂した**。
07-04版の旧指示書の記述は本文書で全て置き換える(旧版の数値・負債マップは陳腐化済み)。

## 改訂の背景 — 旧指示書(07-04版)から状況が変わった点

実装担当は以下を「既に完了済み」として扱い、**再実装・再調査しないこと**。

| 旧指示書の項目 | 現状(2026-07-14 実測) |
|---|---|
| getMyEncounters の N+1 | **解消済み**。バッチ取得+GROUP BY合算に書き換え済み(`modules/encounter/db/queries.ts:562-733`)。契約テスト `__tests__/get-my-encounters-contract.test.ts`(14件)が返却順・cursor・ブロック除外・停止除外・24hひとことを固定 |
| README の Supabase/sweeper.yml 記述 | **更新済み**。README は Railway/sweep.yml 前提(`README.md:36`) |
| `get-current-location.test.ts` の Rollup パース失敗 | **解消済み**。現在は 4 tests パス |
| checkIn の偽成功 | **解消済み**。`saved:true` 肯定形契約+`requireDb()` 規約(`server/db/connection.ts:66-76`)+一時停止中の明示エラー(`modules/encounter/api/encounter.ts:94-101`) |
| encounter.list 常時500 | **解消済み**。生sqlへのDate直渡し→`lt()`演算子へ(`queries.ts:599-602` にコメント) |
| mojibake コメント(server/_core/index.ts) | **解消済み**。残るのはワークフロー2ファイルのみ(後述) |

その後の主な追加(07-06〜07-14、83コミット): ダッシュボード再設計Step0-6(`components/dashboard/` 新設)、
タブ直アクセス消失バグ対策(`app/_layout.tsx` のディープリンク自己復元)、チェックイン429のRetry-Afterカウントダウン、
LP増補、E2E安定化。これらは**正しい現状**であり退行ではない。

## ユーザー確認済みの確定事項(引き続き有効)

1. **`modules/event/` と `app/(tabs)/events.tsx` は残す本体機能**。削除調査不要。触らない。
2. `drizzle/` 直下の古いマイグレーション群(`0000_*.sql`〜`0029_*.sql`)と `meta_broken/`、`migrations-archive/` は**削除しない**。整理は提案のみ。
3. 認証フロー(Clerk/OAuth/ブート構造)の実装変更は**提案のみ**。

## Objective

既存仕様を壊さず、以下を小さな単位で進める。

- 未参照が実証された死コードの段階的削除(ユーザー承認 Q2 が出た範囲のみ)。
- 検証の穴(lint カバレッジ、ESM import チェック範囲、CI の旧ドメイン照合)を塞ぐ。
- 二重管理箇所(drizzle schema index)に安全網テストを張る。
- 小さな重複(ReturnUrl 正規化)の統合。
- 大きな設計変更(Express撤去、admin認証再設計、巨大画面分割、logger統一)は**提案文書のみ**。

見た目を整えるだけの変更、全面書き換え、証拠なき削除、新機能追加は目的ではない。

## Project Understanding

**君斗りんくのすれ違ひ通信** — DSのすれ違い通信を現代的に再現する位置情報マッチングアプリ。
Expo Router (React Native + Web) + tRPC v11 + Drizzle (Railway PostgreSQL) + Clerk (X OAuth)。
正規ドメイン: `https://surechigai.kimito.link`(`surechigai-romi.link` は全パス308リダイレクト)。

現行の重要方針(AGENTS.md / CLAUDE.md が正):
- `locations` に正確な `lat`/`lng`/`accuracyM` を**永続保存**(48h削除は廃止。`deleteExpiredLocations` は互換スタブで常に0件 — `modules/encounter/db/queries.ts:1669-1678`)。
- マッチング用に `h3R8`/`latGrid`/`lngGrid` を併存保持。タイムシフトは過去30日同セル+直近48hアクティブ窓(`queries.ts:349`)。
- DM禁止・一方向リアクションのみ。交流はXへ。

### 実行アーキテクチャ(重要: 二系統ある)

- **本番 = Vercel Functions**。`api/trpc/[trpc].ts` が `server/routers/index.js` と `server/_core/context.js` を動的importして直接処理。ビルドは `scripts/vercel-build.sh`(expo export の静的SPA)。**Express は本番で起動していない**。
- **ローカル dev = Express**(`server/_core/index.ts`、`pnpm dev` で起動)。`/api/auth/sync`・`/api/sweep`・`/api/health` が Express 版(`index.ts:509-571, 585-621, 135-318`)と Vercel 版(`api/auth/sync.ts`, `api/sweep.ts`, `api/health.ts`)で**別実装として並存**している(乖離リスク)。
- `server/routers.ts` は `server/routers/index.ts` への再エクスポート互換シム(二重実装ではない)。

### 主要エントリーポイントとデータフロー

- ルートレイアウト: `app/_layout.tsx`(331行)。認証プロバイダchunkを**手動 `import()`**でロードし(`lazy()`禁止 — 後述の不変条件)、
  プレースホルダ期間は `TrpcReadyProvider value={false}` + `AUTH_LOADING_PLACEHOLDER` を配る(`_layout.tsx:305-309`)。
- タブ画面 `app/(tabs)/{index,checkin,map,zukan,mypage,events}.tsx` は薄い認証ゲート。認証済み本体は
  `components/tabs/authenticated-screen-funnel.tsx` 経由で `components/{post,checkin,mypage,zukan,map,events}/*-authenticated-screen.tsx` へ委譲。
- 認証状態の決定源: `components/providers/clerk-auth-bridge.tsx:171-317`(Clerk→`AuthUser`組立→`lib/auth-context.tsx` の Context に注入)。
  `hooks/use-auth.ts` は re-export 1行。
- tRPC: 画面→`lib/trpc.ts`(httpBatchLink+superjson、transformerはlink内)→`api/trpc/[trpc].ts`→`server/routers/index.ts`→
  `modules/encounter/api/*`(7ルーター)+`modules/event/api/*`(2ルーター)+`server/routers/{auth,ogp,dev,ads}.ts`。
- DB層: ルーターが `getDb()`/`requireDb()`(`server/db/connection.ts`)を取得し `modules/encounter/db/queries.ts`(2015行)等へ渡す。
  純粋ロジックは `modules/encounter/core/*`(geo/matching/tiers/moderation/checkin-guards 等)。
- スキーマ: `drizzle/schema/*.ts` → `drizzle/schema/index.ts`(ランタイム用・`.js`拡張子付き) と
  `index.drizzle-kit.ts`(drizzle-kit専用・拡張子なし)の**二重管理**(`drizzle.config.ts:19-23` 参照)。正マイグレーションは `drizzle/migrations/`(baseline 1件)のみ。

### 検証コマンド(2026-07-14 実測ベースライン)

| コマンド | 結果 |
|---|---|
| `pnpm check` (tsc + check-esm-imports) | **0エラー** |
| `pnpm test` (vitest) | **36 files / 319 tests 全パス** |
| `pnpm lint` (expo lint) | **0 errors / 345 warnings** — ただし後述のカバレッジ穴あり |
| `npx eslint app components lib hooks modules features server api` | **4 errors / 571 warnings**(穴の実態) |
| Node | ローカル v22.15.0(engines は 24.x、`.nvmrc`=24。engine warning は既知) |

### 作業開始時点の既存差分(混ぜるな・コミットするな)

`git status` に以下が既に存在する。**これらはあなたの変更ではない。ステージも復元もしない**:
- 変更済み: `dist/favicon.png`, `dist/manifest.json`, `dist/offline.html`, `dist/sw.js`, `docs/investigation/*`, `public/version.json`
- 未追跡: `.tmp-*` 約88個、`.npm-cache/`, `.pnpm-store/` ほか
- 別worktree: `.claude/worktrees/distracted-morse-2ff5e1`(触らない)、`C:/tmp/surechigai-deploy-*`(触らない)

## Behaviors To Preserve(壊すと事故になる既存挙動)

### データ・API契約
- 正確な座標の永続保存方針。`deleteExpiredLocations` は**常に0件を返すスタブのまま**(sweep互換)。
- `encounters` の UNIQUE(userAId<userBId, dayKey) 正規化と同日ペア重複抑止。
- `getMyEncounters` の返却契約(契約テスト14件が正)。ブロック除外・停止ユーザー除外・24hひとこと。
- `checkIn` の `saved:true` 肯定形契約 — クライアントは `saved !== true` を全て失敗扱いにする(`encounter.ts:203`)。
- mutation は `requireDb()`、読み取り系は `getDb()`+空フォールバック、の規約(`connection.ts:59-65` コメント)。
- "Database not available" は `toUserFriendlyError` が既知文言として写す。**文言を変えない**。
- 429 は tRPC エラーエンベロープ+`Retry-After` ヘッダで返す(`api/trpc/[trpc].ts:164-190`)。素のJSONに戻さない。
- drizzle で**生sqlテンプレートに Date/値を直渡ししない**。必ず `lt()`/`gte()` 等の演算子経由(`queries.ts:599-602`)。

### ブート・ナビゲーション(app/_layout.tsx の不変条件 — コメント熟読必須)
- `const stack = <AppNavigationStack />`(`:277`)は**同一要素インスタンスを全分岐で同じ位置に描画**。chunk解決待ちでアンマウントするとタブ直アクセスが "/" に落ちるバグが再発する。
- 認証プロバイダは**手動 `import()`**(`:50,:63`)。`lazy()`+`Suspense` に戻さない。
- `RestoreDeepLinkAfterAuthBoot`(`:96-139`)は**pathname変化検知**方式。タイマー方式へ戻さない。ユーザー操作検知(`userInteractedRef`)と15秒での関与終了も維持。
- `TrpcReadyProvider value={false}` の注入点は **`_layout.tsx:306` と `components/providers/guest-web-providers.tsx:30` の2箇所**。デフォルトは `true`(`lib/trpc-ready-context.tsx:12`)なので、注入漏れ=ゲスト/ブート期の即クラッシュ。
- 画面から `router.push/replace/back` を直接呼ばず `lib/navigation` のヘルパーを使う(`local-rules/no-direct-router-push`)。

### 運用・デプロイ
- `CDN_CACHE_EPOCH`(`theme/tokens/index.ts:48`、**現在値14**): クライアントバンドルに実質変更を入れたら+1する。theme/tokens は151ファイルからimportされており、この仕組みで全チャンクが改名される。
- デプロイは AGENTS.md ディレクティブ4 に従う(push→GHA success or version.json 一致確認)。
- E2E を本番相手に走らせる場合は `PLAYWRIGHT_BASE_URL=https://surechigai.kimito.link`(ローカルExpoは起動120秒TOで詰まる)。
- `.auth/auth-state.json` の認証E2E(trail-auth-smoke, audit-auth-*)はローカル専用。CIはguest系のみ。

## Non-Negotiables

- 作業開始直後に `git status --short` を確認・記録する。既存差分(上記リスト)を自分の変更と混ぜない。
- 編集前に baseline(`pnpm check` / `pnpm test` / `pnpm lint`)の結果を記録する。
- すべてのコード変更後に `pnpm check` 0エラーを確認。コード変更フェーズでは `pnpm test` も実行。
- 変更は小さく戻しやすい単位(1関心=1コミット)。無関係な整形・ついでのリネーム・warning の一括修正をしない。
- 既存挙動を勝手に変えない。正しさが不明なら実装を止めて質問する。
- 新規ライブラリ追加は禁止。依存の**削除**は Q2 承認後のみ、1つずつ `pnpm install` → `pnpm check`/`pnpm test`/`pnpm build` で確認。
- UI/文言/配色/余白/地図表現に触る前に `DESIGN.md` を読む(最重要コピー「会いたい君がいる現在地」を弱めない)。
- DB schema / `drizzle/migrations/` の変更は禁止。必要になったら停止して質問。
- `.github/workflows/` のストア系(ios-*, android-*, apple-*, play-*, asc-*)は Q7 承認範囲外では触らない。
- `docs/`, `council/`, `public/lp/`, `.tmp-*`, `dist/`, `.expo/`, `.vercel/`, `node_modules/`, `.claude/worktrees/` は読み込み・編集の対象外。
- 古いドキュメントより `AGENTS.md` / `CLAUDE.md` の現行方針を優先。

## Stop And Ask Conditions

以下に該当したら実装を止め、状況と選択肢を報告する。

1. 正確な座標保存・永続保存・Railway DB 方針と矛盾する変更が必要になった。
2. `drizzle/schema/*`、`drizzle/migrations/*`、本番DBデータに影響する変更が必要になった。
3. 認証まわり(`hooks/use-auth.ts`, `lib/auth-context.tsx`, `components/providers/clerk-*.tsx`, `server/_core/{context,oauth,sdk}.ts`, `app/_layout.tsx` のブート構造)に**動作変更**が必要になった(死コード削除で参照が消えるだけの場合を除く)。
4. `admin_session` Cookie の扱い(Q1)に触れる必要が生じた(回答前は現状維持)。
5. tRPC の公開契約(procedure名・入出力形)や `saved`/エラー文言の互換を壊す可能性がある。
6. `modules/event/` の削除・変更が必要になった。
7. テストと実装の期待値が矛盾した。
8. 削除候補ファイルに「実は動的importや文字列参照で使われている」兆候を見つけた(削除前に `grep` で文字列参照も確認すること)。
9. Q1〜Q7 の未回答項目に依存する作業に到達した。

## Baseline Commands

作業開始時:

```bash
git status --short
pnpm check
pnpm test
pnpm lint
```

各フェーズ後: `pnpm check`(+コード変更時 `pnpm test`)。依存削除・server/api 変更時は `pnpm build` も。
デプロイするターンでは AGENTS.md ディレクティブ4 の確認手順(GHA success / version.json)を実施。

## Debt Map

| # | 負債 | 根拠(file:line) | なぜ負債か | 影響範囲 | リスク | 改善案 | 検証 | 実装可否 |
|---|---|---|---|---|---|---|---|---|
| 1 | 死コード: hooks 11本 | `hooks/use-offline-challenge.ts`, `use-optimized-challenges.ts`, `use-favorites.ts`, `use-offline-participation.ts`, `use-offline-sync.ts`, `use-prefetch.ts`, `use-loading-state.ts`, `use-notification-triggers.ts`, `use-follow-status.ts`, `use-accounts.ts`, `use-auto-login.ts` — いずれも外部参照ゼロ(バレル経由含め確認済) | 旧テンプレ残骸。探索ノイズ・誤importの温床 | なし(未参照) | 低 | 物理削除 | `pnpm check`/`test`/`build` | **Q2承認後に実装可** |
| 2 | 死コード: lib 9本 | `lib/demo-challenge.ts`, `challenge-colors.ts`, `export-stats.ts`, `admin-session.ts`, `premium-features.ts`(死hook経由のみ), `websocket-client.ts`, `sync-handlers.ts`, `offline-sync.ts`, `auto-login-provider.tsx`(参照ゼロの孤児Provider) | 同上。auto-login-provider は現行 AuthState と責務重複 | なし | 低 | 物理削除(offline-**cache**.ts は**使用中**なので消さない) | 同上 | **Q2承認後に実装可** |
| 3 | 死コード: server 6本 | `server/ai-summary.ts`, `_core/voiceTranscription.ts`, `_core/imageGeneration.ts`, `storage.ts`(imageGeneration経由のみ), `twitter-auth.ts`(OAuth1.0a旧実装), `admin-config.ts` — 外部参照ゼロ | 同上。twitter-auth は現行 OAuth2.0(`twitter-oauth2.ts`)と紛らわしい | なし | 低 | 物理削除 | 同上+`pnpm dev` でExpress起動確認 | **Q2承認後に実装可** |
| 4 | 未使用依存 | `mysql2`(唯一の使用 `scripts/inspect-db.ts:1` はMySQL前提で動作不能), `@sentry/nextjs`(+未参照の `sentry.{server,client,edge}.config.ts` 3ファイル), `trpc-openapi`(import ゼロ) | インストール時間・監査ノイズ・誤解 | lockfile | 中(ビルド確認要) | 1つずつ削除→フルビルド | `pnpm install`/`check`/`test`/`build` | **Q2/Q6承認後に実装可** |
| 5 | CIが旧ドメインを照合 | `gate1.yml:145`, `deploy-verify.yml:25` → `doin-challenge.com/api/health` | 本プロダクトのヘルスを見ておらず、検証が実質死んでいる | CI信頼性 | 低〜中 | `surechigai.kimito.link` へ修正 or deploy-verify 廃止 | 手動 `gh workflow run` で確認 | **Q3承認後に実装可** |
| 6 | lint カバレッジ穴+error 4件 | `pnpm lint`(expo lint)は 0 errors だが、`npx eslint` 直叩きで `features/onboarding/components/OnboardingScreen.tsx:38`(no-direct-router-push), `hooks/use-screen-context-bar.tsx:68,98`(同), `server/db-growth-alert.ts:59`(no-dynamic-env-var) の4 error | 規約違反が検出されずすり抜けている(use-screen-context-bar は**使用中**のコード) | ナビ規約・環境変数規約 | 低 | ①4件を `lib/navigation` ヘルパー/静的env参照へ修正 ②lint スクリプトのカバレッジを実測し、穴があれば対象dirを明示 | `npx eslint <対象>` が 0 errors | **実装可**(①→②の順) |
| 7 | check-esm-imports の対象外領域 | `scripts/check-esm-imports.mjs:13` は `server/`・`api/` のみ。`modules/`+`drizzle/` に拡張子なし相対importが11箇所残存(実測。うち `modules/encounter/core/prefecture-creator.ts:8,16` は type-only、`drizzle/schema/index.drizzle-kit.ts` は意図的、`drizzle/relations.ts:1` は空import) | modules/ はランタイムで server から import される。将来の実import追加が2026-07-06型の本番障害を再発させ得る | Vercel Functions 実行時 | 低 | prefecture-creator の2箇所に拡張子付与→ checker の TARGET_DIRS に `modules` を追加(drizzle は `index.drizzle-kit.ts` を除外設計にできる場合のみ) | `pnpm check` | **実装可** |
| 8 | drizzle schema index の二重管理 | `drizzle/schema/index.ts`(`.js`付き) と `index.drizzle-kit.ts`(拡張子なし)は**手動同期**(`drizzle.config.ts:19-23`) | 片方だけ更新すると drizzle-kit と実行時でスキーマ乖離 | DB運用 | 低(テスト追加のみ) | 両者の export キー集合が一致することを確認する vitest を追加 | `pnpm test` | **実装可**(安全網のみ。統合は提案) |
| 9 | admin_session 固定文字列 Cookie | `server/_core/context.ts:21-24,44-65`。本番 `api/trpc/[trpc].ts:196-204` も同じ createContext を使用 | Cookie値 `authenticated` を知る誰でも id:0 疑似ユーザーとして protectedProcedure を通過し得る | セキュリティ境界 | 高 | Q1 の回答に従う(署名付き化/本番無効化/撤去) | 認証E2E+管理画面手動確認 | **提案のみ(Q1回答待ち)** |
| 10 | Express/Vercel 二重実装 | `/api/auth/sync`: `server/_core/index.ts:509-571` と `api/auth/sync.ts` / `/api/sweep`: `index.ts:585-621` と `api/sweep.ts` / `/api/health`: `index.ts:135-318`(183行インライン) と `api/health.ts` | 片側だけ直す事故の温床。Express側は本番未使用なのに保守対象 | dev/本番の乖離 | 中〜高 | 小: debug/admin エンドポイントの NODE_ENV ガード(Q4)。大: 共通ロジック抽出 or Express簡素化は**提案のみ** | `pnpm dev` 起動+主要ルート疎通 | 小=Q4承認後、大=**提案のみ** |
| 11 | 巨大画面コンポーネント | `components/checkin/checkin-authenticated-screen.tsx`(1503行、useState約18個+状態機械+429カウントダウン+測位+地図+シェア), `mypage-authenticated-screen.tsx`(1108行), `post-authenticated-screen.tsx`(819行), `app/visit.tsx`(972行) | 変更影響の見通しが悪い。直近も複数バグ修正がここに集中 | 主要UX全部 | 高 | まず純粋ロジック(例: `resolveCheckinErrorMessage` :122-132、カウントダウン計算)の単体テスト→DBやUIに依存しない部分だけ小さく抽出。**大規模分割は提案のみ** | `pnpm test`+該当画面の手動確認 | 小抽出のみ実装可 |
| 12 | ReturnUrl 正規化の三重複 | `lib/auth-context.tsx:46`, `components/providers/clerk-auth-bridge.tsx:26,46` — `/(tabs)/`→`/` 置換が3箇所に散在 | ログイン後の着地パスが微妙にズレるリスク | 認証導線 | 中 | 先に3実装の入出力を固定するテストを書き、挙動同一を確認してから1関数に統合 | `pnpm test`+ログイン手動確認1回 | テスト先行なら実装可 |
| 13 | vitest の死んだ exclude | `vitest.config.ts:19-20` が実体のない `features/event-detail/`, `features/home/` のテストパスを除外(features/ に現存するのは onboarding/ のみ) | 設定の嘘。将来の誤解 | テスト設定 | 低 | 2行削除(`components/ui/__tests__/checkbox.test.tsx` :21 は実体確認してから判断) | `pnpm test` | **実装可** |
| 14 | ドキュメント陳腐化 | `README.md:198`「sweep.yml # 15分スイープ」(実体は日次cron `0 3 * * *`)。AGENTS.md:127/CLAUDE.md:116 のロードマップに未消化の「Supabase接続」行 | 現行運用と矛盾 | オンボーディング | 低 | README の頻度記述修正。AGENTS/CLAUDE はユーザーの正本のため**修正文面の提案のみ** | 目視 | README=実装可 / AGENTS・CLAUDE=提案のみ |
| 15 | mojibake ワークフロー2本 | `.github/workflows/ios-appstore-release.yml`(630-633行付近ほか), `asc-review-poll.yml` | コメント可読性 | ストアCI | 中(審査系) | コメントのみ修復 | YAML lint+dry run | **Q7承認後・コメントのみ** |
| 16 | ログ・env・レートリミットの不統一 | console.* が server 配下30ファイル178箇所(requestId 非連動)。`process.env` 直参照69箇所 vs 形骸の `server/_core/env.ts`。レートリミット3系統(`_core/rate-limiter.ts`=Express専用 / `rate-limit-handler.ts`=Twitter向け / `api/trpc/[trpc].ts:19-124`=本番実効) | 障害調査コスト・誤解(名前が紛らわしい) | サーバー全域 | 高 | 現状マップの文書化+統一設計の**提案のみ**(今回は実装しない) | — | **提案のみ** |
| 17 | dist/ の git 追跡 | `dist/favicon.png` 等が追跡済みで常時ダーティ | 生成物のコミット事故リスク | リポ衛生 | 中 | Q5 の回答に従う | `git status` | **提案のみ(Q5回答待ち)** |
| 18 | `connection.ts` の supabase 残骸 | `server/db/connection.ts:36` の `databaseUrl.includes("supabase.co")` | 廃止済み接続先の条件が残る(無害だが誤解を招く) | なし | 低(SSL条件に触るため慎重に) | コメント追記 or 条件簡素化(DATABASE_URL の実値で `sslmode` を確認してから) | `pnpm dev` でDB接続ログ確認 | コメント追記のみ実装可 |

## Implementation Phases

### Phase 1: 現状確認と検証結果の記録
- `git status --short` を保存し、既存差分(dist/・docs/investigation/・public/version.json・.tmp-*)を「触らないリスト」として宣言。
- `pnpm check` / `pnpm test` / `pnpm lint` を実行し、本指示書のベースライン表と一致するか確認。**ズレていたら差分を報告してから進む**。
- `npx eslint app components lib hooks modules features server api` で error 4件を再確認。

完了条件: baseline 報告ができ、以降の各フェーズで「自分が増減させた差分」を説明できる。

### Phase 2: 安全網の追加(挙動変更ゼロ)
- drizzle 二重 schema index の同期テストを追加(Debt #8): `Object.keys(import(index)) ⊇/＝ Object.keys(import(index.drizzle-kit))` を比較する vitest。**注意**: index.drizzle-kit.ts 側は拡張子なし import のため vitest の resolve で読めるはず。読めない場合は静的パース(export行の突き合わせ)方式に切り替える。
- ReturnUrl 正規化3実装(Debt #12)の現挙動を固定するテストを追加(統合はまだしない)。
- 検証: `pnpm check` / `pnpm test`。

### Phase 3: 明らかに安全な整理
- eslint error 4件の修正(Debt #6①): `features/onboarding/components/OnboardingScreen.tsx:38` と `hooks/use-screen-context-bar.tsx:68,98` を `lib/navigation` の `navigate.*` へ、`server/db-growth-alert.ts:59` を静的 env 参照へ。**画面遷移先は1文字も変えない**。
- lint カバレッジの実測(Debt #6②): `pnpm lint` がどの dir を対象にしているか確認し、hooks/・features/ 等が漏れているなら lint スクリプトに対象を明示(例: `expo lint` の引数 or eslint 直叩き併用)。error が新たに出た場合はこのフェーズでは**修正せず報告のみ**。
- `vitest.config.ts:19-20` の死んだ exclude 2行を削除(Debt #13)。
- `scripts/check-esm-imports.mjs` の対象に `modules` を追加+`modules/encounter/core/prefecture-creator.ts:8,16` に拡張子付与(Debt #7)。
- `README.md:198` の sweep 頻度記述を日次に修正(Debt #14)。
- 検証: `pnpm check` / `pnpm test` / `pnpm lint`(+eslint 直叩きで error 0)。

### Phase 4: 死コードの段階的削除(**Q2 承認後のみ**)
- 削除前に各ファイルへ最終確認 grep(シンボル名+ファイル名文字列。動的import・文字列参照も含む)。
- 順序: hooks(Debt #1)→ lib(Debt #2)→ server(Debt #3)→ 依存(Debt #4、1つずつ)。各ステップでコミットを分け、`pnpm check`/`test`、server 系は `pnpm build`+`pnpm dev` 起動確認。
- `lib/offline-cache.ts`・`lib/account-manager.ts`・`lib/token-manager.ts`・`lib/auth-token.ts`・`server/websocket.ts`・`server/twitter-oauth2.ts`・`server/token-store.ts`・`server/admin-password-auth.ts`・`server/login-security.ts`・`server/ai-error-analyzer.ts` は**使用中なので消さない**。
- 検証: 各コミット後 `pnpm check`/`pnpm test`。依存削除後は `pnpm build`。

### Phase 5: 小さな責務分離
- ReturnUrl 正規化の統合(Debt #12): Phase 2 のテストを緑に保ったまま1関数へ集約。ログイン→着地の手動確認を1回行う。
- `checkin-authenticated-screen.tsx` から UI/DB 非依存の純粋関数(エラー文言解決・カウントダウン計算等)のみをテスト先行で抽出(Debt #11)。**状態機械の構造・useEffect の順序・429の見た目は変えない**。
- 検証: `pnpm check` / `pnpm test`+該当画面の手動確認。

### Phase 6: 境界の明確化(承認済み範囲のみ)
- Q3 承認時: CI 旧ドメイン照合の修正(Debt #5)。
- Q4 承認時: Express の `/api/debug/env`・未認証 admin API への NODE_ENV ガード(Debt #10 小)。
- Q7 承認時: ワークフロー2本のコメント修復(Debt #15)。
- 検証: 該当 workflow の手動実行 or `pnpm dev` 疎通。

### Phase 7: 大きな設計変更は提案のみ(実装しない)
以下は具体的なリスク・必要テスト・移行手順を Markdown 提案としてまとめる:
- admin_session Cookie の再設計(Debt #9、Q1)。
- Express サーバーの整理/撤去と dev 環境の Vercel Functions 化(Debt #10 大)。
- 巨大画面(checkin/mypage/post/visit)の分割設計(Debt #11)。
- logger/env/レートリミットの統一(Debt #16)。
- drizzle 直下の旧 *.sql・meta/・meta_broken/ の整理(確定事項2により削除禁止→提案のみ)。
- dist/ の git 追跡解除(Debt #17、Q5)。
- 本番DBの孤立テーブル `nagano_visit_reports`(`drizzle/migrations-archive/README.md` 記載)の扱い。

## Verification Requirements

- 各フェーズ後に `pnpm check`(0エラー必須)。コード変更フェーズは `pnpm test` も必須。
- ナビゲーション・lint 設定に触ったフェーズは `pnpm lint`+`npx eslint`(対象dir明示)を実行。
- 依存・server/・api/ に触ったら `pnpm build` を実行。
- UI/文言に触った場合は `DESIGN.md` のチェックリストに従い、モバイル/デスクトップ幅で確認。
- クライアントバンドルに実質変更が入った状態でデプロイする場合は `CDN_CACHE_EPOCH`(現在14)を+1。
- デプロイした場合は AGENTS.md ディレクティブ4 の完了確認(GHA success / version.json 一致)まで行う。
- 失敗したコマンドは、エラー要約・原因・対処・再実行結果を報告する。

## Reporting Format

完了時に報告すること:
1. 実行したフェーズと、スキップした(承認待ち)フェーズ。
2. 変更したファイル一覧(コミット単位)。
3. 既存差分と自分の差分の区別。
4. 最後に実行したコマンドと結果(check/test/lint/build)。
5. 削除したファイル・依存の一覧と、削除前の最終確認 grep の結果。
6. 残した警告・未解決の負債・Phase 7 の提案文書の所在。
7. Stop And Ask Conditions に該当した場合、止めた理由と質問。

## Out-of-scope Items

- 新機能追加、UIの見た目改善だけを目的にした変更。
- 認証フロー・app/_layout.tsx ブート構造の実装変更(提案のみ)。
- DB schema / migrations / 本番データの変更。`nagano_visit_reports` の削除。
- `modules/event/` の削除・変更。
- LP(`public/lp/` と関連アセット・app.js)への変更。
- ストア系ワークフローの動作変更(Q7 のコメント修復を除く)。
- lint warning(345件)の無差別一括修正。
- `docs/` 配下の整理、`.tmp-*` の掃除、`council/`、`.claude/worktrees/`。
- 新規依存ライブラリの追加。
- `dist/`, `.expo/`, `.vercel/`, `node_modules/`, `public/lp/img/`, `public/lp/sounds/`, `*.log` の探索・編集。
