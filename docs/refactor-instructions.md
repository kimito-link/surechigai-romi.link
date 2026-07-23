# Refactor Instructions for surechigai-romi.link（2026-07-23版）

この文書は、実装担当モデル（Codex / Opus 等）に渡すリファクタリング作業指示書です。
**2026-07-23 に現行コード・テスト・CI を実測して作成した。**
**Q1〜Q4（Stop And Ask Conditions #9）は発注者確認済み。実装担当は追加確認不要で Phase 1 から着手できる。**

> **旧版との関係（最重要）**: 旧 `refactor-instructions.md`（2026-07-14版）は
> **既に実装完了済み**（コミット `cd05f749e`〜`b249c665a` の一連で Phase 2〜6 相当が消化済み）。
> 旧版の負債マップ・ベースライン数値は陳腐化している。**本文書（docs/refactor-instructions.md）が正**。
> 旧版は履歴として `docs/archive/refactor-instructions-2026-07-14.md` へ移動済み。
> 旧版に書かれた作業を再実装・再調査しないこと。

---

## Objective

既存仕様を一切壊さず、以下を小さな単位で進める。

1. dev(Express)/本番(Vercel Functions) に残る二重実装（`/api/sweep`・`/api/health`）の共通ロジック抽出。
2. 後方互換シム（`server/db.ts`・`server/routers.ts`）の参照元置換と撤去。
3. 細かい確定負債の解消（mojibake コメント1行、README の構造図陳腐化）。
4. 巨大ファイル（`checkin-authenticated-screen.tsx` 1287行、`queries.ts` 2015行 ほか）は
   **テスト先行の小さな抽出のみ実装可**。大規模分割・全面再設計は**提案文書のみ**。
5. logger/env/レートリミット統一・Express撤去・drizzle旧残骸削除は**提案のみ**（実装しない）。

見た目を整えるだけの変更、全面書き換え、証拠なき削除、新機能追加、lint warning（541件）の一括修正は目的ではない。

---

## Project Understanding

**君斗りんくのすれ違ひ通信** — DSのすれ違い通信を現代的に再現する位置情報マッチングアプリ。
Expo Router (React Native + Web) + tRPC v11 + Drizzle (Railway PostgreSQL) + Clerk (X OAuth)。
正規ドメイン: `https://surechigai.kimito.link`（`surechigai-romi.link` は全パス308リダイレクト）。

現行の重要方針（`AGENTS.md` / `CLAUDE.md` が正。古い設計書 V2-SURECHIGAI-DESIGN.md より優先）:

- `locations` に正確な `lat`/`lng`/`accuracyM` を**永続保存**（48h削除は廃止）。
  `deleteExpiredLocations` は互換スタブで常に0件（`modules/encounter/db/queries.ts:1675`）。
- マッチング用に `h3R8`/`latGrid`/`lngGrid` を併存保持。タイムシフトマッチング（過去30日同セル）。
- DM禁止・一方向リアクションのみ。交流はXへ委譲。
- `modules/event/` と events タブは**残す本体機能**（ユーザー確定済み。旧テンプレ残骸ではない）。

### 実行アーキテクチャ（二系統ある）

- **本番 = Vercel Functions**: `api/trpc/[trpc].ts` が `server/routers/index.js` と
  `server/_core/context.js` を動的importして処理。ビルドは `scripts/vercel-build.sh`（expo export の静的SPA）。
  **Express は本番で起動していない**。
- **ローカル dev = Express**: `server/_core/index.ts`（636行、`pnpm dev` で起動）。
  `/api/health`・`/api/sweep` が Express 版と Vercel 版（`api/health.ts`, `api/sweep.ts`）で並存
  （`/api/auth/sync` は 2026-07-14 の `edaa37163` で統合済み）。

### 主要エントリーポイントとデータフロー

- ルートレイアウト: `app/_layout.tsx`。認証プロバイダchunkを**手動 `import()`**でロード
  （`:53-54`。`lazy()` 禁止 — 後述の不変条件）。`const stack = <AppNavigationStack />`（`:277`）は
  全分岐で同一要素インスタンスを同じ位置に描画する。
- タブ画面 `app/(tabs)/{index,checkin,map,zukan,mypage,events}.tsx` は薄い認証ゲート。
  認証済み本体は `components/{post,checkin,mypage,zukan,map,events}/*-authenticated-screen.tsx`。
  ゲスト側は `components/organisms/one-tap-guest-shell.tsx` + `one-tap-guest-previews.tsx` +
  `zukan-guest-live.tsx` 等（2026-07-19〜21 のヒーロー構造・実データ化で新設。壊すと直近の成果が飛ぶ）。
- tRPC: 画面 → `lib/trpc.ts` → `api/trpc/[trpc].ts`（レートリミット+429エンベロープ内蔵 `:35-190`）→
  `server/routers/index.ts`（13ルーター: auth/ogp/dev/ads + encounter/zukan/safety/settings/presence/visit/dashboard +
  event/eventParticipation）→ `modules/encounter/api/*`・`modules/event/api/*`。
- DB層: ルーターが `getDb()`/`requireDb()`（`server/db/connection.ts:19,66`）を取得し
  `modules/encounter/db/queries.ts`（2015行）等へ渡す。純粋ロジックは `modules/encounter/core/*`。
- スキーマ: `drizzle/schema/*.ts` → `index.ts`（ランタイム・`.js`拡張子付き）と
  `index.drizzle-kit.ts`（drizzle-kit専用）の二重管理。**同期は安全網テスト
  `__tests__/drizzle-schema-index-sync.test.ts` が監視済み**。正マイグレーションは `drizzle/migrations/` のみ。

### 2026-07-14版指示書から解消済みの項目（再実装・再調査禁止）

| 旧負債 | 現状 |
|---|---|
| 死コード hooks 11本 / lib 9本 / server 6本 | **全て物理削除済み**（存在しないことを確認済み） |
| 未使用依存 mysql2 / @sentry/nextjs / trpc-openapi | **package.json から削除済み** |
| eslint error 4件・lintカバレッジ穴 | **解消済み**（`18120a4a6`, `24f5be8bb`）。現在 0 errors |
| vitest の死んだ exclude | **削除済み** |
| check-esm-imports の modules/ 未カバー | **カバー済み**（出力「server/・api/・modules/配下…OK」を確認） |
| ReturnUrl 正規化の三重複 | **`lib/navigation/normalize-return-url` に統合済み**（`05bf4cc3e`）+ テスト9件 |
| admin_session Cookie（旧Q1） | **本番で無効化済み**（`server/_core/context.ts:25` の NODE_ENV ガード + `__tests__/admin-session-guard.test.ts` 4件 + verify-password 本番404、`f35b8787a`） |
| /api/auth/sync の二重実装 | **統合済み**（`edaa37163`） |
| CI の旧ドメイン照合（旧Q3） | **修正済み**（gate1.yml / deploy-verify.yml とも `surechigai.kimito.link`） |
| dist/ の git 追跡（旧Q5） | **追跡解除済み**（`git ls-files dist` = 0件） |
| ワークフロー mojibake（旧Q7） | **解消済み**（残りは `server/_core/index.ts:125` の1行のみ — Debt #2） |
| 巨大画面の view 分離 | checkin/mypage/post/visit の JSX・スタイル分離済み（`d6ffe1aed`〜`476237c3b`） |
| drizzle 旧残骸の整理 | **提案文書化済み**（`docs/proposals/drizzle-legacy-cleanup-PROPOSAL.md`。削除は引き続き禁止） |
| レートリミット3系統の紛らわしさ | 役割コメント明記済み（`3acb3d135`）。統一は未実施（Debt #6） |

その後の主な追加（07-14〜07-22）: ゲスト共通シェルのヒーロー構造化・zukanゲスト実データ化・
デスクトップ地図拡大・ゲスト限定モンキーテスト（`scripts/qa/monkey-guest.mjs`）・
X認可キャンセル復帰通知（`76abdc552`）。これらは**正しい現状**であり退行ではない。

### 検証コマンド（2026-07-23 実測ベースライン）

| コマンド | 結果 |
|---|---|
| `pnpm check`（tsc + check-esm-imports） | **0エラー** |
| `pnpm test`（vitest） | **42 files / 347 tests 全パス** |
| `pnpm lint`（expo lint、対象: app components lib hooks modules features server api） | **0 errors / 541 warnings** |
| Node | ローカル v22.15.0（package.json engines は 24.x — 既知の不一致、Q4参照） |

### 作業開始時点の既存差分（混ぜるな・コミットするな・削除するな）

`git status` に以下が既に存在する。**これらはあなたの変更ではない**。ステージも復元も削除もしない:

- 変更済み: `docs/investigation/artifacts/*.json`, `docs/investigation/tab-wait-timings.md`
- 未追跡: `docs/*-DESIGN.md`・`docs/*-HANDOFF.md`・`docs/investigation/*` の各種調査文書、
  `scripts/check-db-columns.cjs`, `scripts/find-server-alias-imports.mjs`, `pagespeed-report.json`,
  `.tmp-*` 多数, `.npm-cache/`, `.pnpm-store/`, `tmp/`（いずれも他セッションの成果物・作業ごみ。Q3参照）

---

## Behaviors To Preserve（壊すと事故になる既存挙動）

### データ・API契約

- 正確な座標の永続保存方針。`deleteExpiredLocations` は**常に0件を返すスタブのまま**
  （`modules/encounter/db/queries.ts:1675`。sweep 互換）。
- `checkIn` の `saved:true` 肯定形契約（`modules/encounter/api/encounter.ts:202-203`）。
  クライアントは `saved !== true` を全て失敗扱いにする。DB未接続時は `saved:false` を明示（`:142`）。
- mutation は `requireDb()`、読み取り系は `getDb()`+空フォールバック、の規約
  （`server/db/connection.ts:59-66` のコメントが正）。
- `getMyEncounters` の返却契約 — `__tests__/get-my-encounters-contract.test.ts`（14件）が正。
- 429 は tRPC エラーエンベロープ + `Retry-After` ヘッダで返す（`api/trpc/[trpc].ts:169-190`）。
  素のJSONに戻さない。
- drizzle で**生sqlテンプレートに Date/値を直渡ししない**。必ず `lt()`/`gte()` 等の演算子経由。
- `hasAdminSession` は**本番で必ず false**（`server/_core/context.ts:25`）。このガードを外さない。
  `__tests__/admin-session-guard.test.ts` が監視している。
- tRPC の procedure 名・入出力形（13ルーターの公開契約）を変えない。

### ブート・ナビゲーション（app/_layout.tsx の不変条件 — ファイル内コメント熟読必須）

- `const stack = <AppNavigationStack />`（`:277`）は同一要素インスタンスを全分岐で同じ位置に描画。
  chunk解決待ちでアンマウントするとタブ直アクセスが "/" に落ちるバグが再発する。
- 認証プロバイダは**手動 `import()`**（`:53-54`）。`lazy()`+`Suspense` に戻さない。
- `RestoreDeepLinkAfterAuthBoot`（`:96`）は pathname 変化検知方式。タイマー方式へ戻さない。
- `TrpcReadyProvider value={false}` の注入点は `_layout.tsx`（`:303` 付近のコメント参照）と
  `components/providers/guest-web-providers.tsx` の2箇所。デフォルトは `true`
  （`lib/trpc-ready-context.tsx:12`）なので、注入漏れ = ゲスト/ブート期の即クラッシュ。
- 画面から `router.push/replace/back` を直接呼ばず `lib/navigation` のヘルパーを使う
  （ESLint local rule `no-direct-router-push` が error 指定。`eslint.config.cjs:64`）。
- ゲスト側ヒーロー構造（`one-tap-guest-shell.tsx` / `one-tap-guest-previews.tsx` / `zukan-guest-live.tsx`）は
  2026-07-19〜21 に実地検証込みで確定した直近成果。本タスクで構造変更しない。

### 運用・デプロイ

- `CDN_CACHE_EPOCH`（`theme/tokens/index.ts:48`、**現在値14**）: クライアントバンドルに実質変更を
  入れてデプロイする場合は +1 する（Metro 同名別内容チャンク × CDN immutable キャッシュ対策）。
- デプロイは AGENTS.md ディレクティブ4（push → GHA `Deploy to Vercel` success または
  `version.json` の commitSha 一致確認。反映されない時は EPOCH +1）。
- E2E を本番相手に走らせる場合は `PLAYWRIGHT_BASE_URL=https://surechigai.kimito.link`。
- `.auth/auth-state.json` の認証E2E はローカル専用（X OAuth ログインは人手必須）。CI は guest 系のみ。

---

## Non-Negotiables

- 作業開始直後に `git status --short` を確認・記録する。既存差分（上記リスト）を自分の変更と混ぜない。
- 編集前に baseline（`pnpm check` / `pnpm test` / `pnpm lint`）の結果を記録し、本文書の表と照合する。
  **ズレていたら差分を報告してから進む**。
- すべてのコード変更後に `pnpm check` 0エラーを確認。コード変更フェーズでは `pnpm test` も実行。
- 変更は小さく戻しやすい単位（1関心=1コミット）。無関係な整形・ついでのリネーム・warning の一括修正をしない。
- 既存挙動を勝手に変えない。正しさが不明なら実装を止めて質問する。
- 新規ライブラリの追加・削除は禁止。
- UI/文言/配色/余白/地図表現に触る前に `DESIGN.md` を読む（最重要コピー「会いたい君がいる現在地」を弱めない）。
- DB schema / `drizzle/migrations/` / 本番DBデータの変更は禁止。必要になったら停止して質問。
- `drizzle/` 直下の旧マイグレーション（`0000_*.sql`〜`0029_*.sql`）・`meta_broken/`・`migrations-archive/` は
  **削除しない**（ユーザー確定事項。整理は `docs/proposals/drizzle-legacy-cleanup-PROPOSAL.md` の提案止まり）。
- `.github/workflows/` のストア系（ios-*, android-*, apple-*, play-*, asc-*）に触らない。
- `docs/`（本文書と Phase 7 提案の追記を除く）, `council/`, `public/lp/`, `.tmp-*`, `dist/`, `.expo/`,
  `.vercel/`, `node_modules/`, `*.log` は読み込み・編集の対象外。
- 古いドキュメント（README の一部・旧指示書・旧設計書）より `AGENTS.md` / `CLAUDE.md` の現行方針を優先。

---

## Stop And Ask Conditions

以下に該当したら実装を止め、状況と選択肢を報告する。

1. 正確な座標保存・永続保存・Railway DB 方針と矛盾する変更が必要になった。
2. `drizzle/schema/*`、`drizzle/migrations/*`、本番DBデータに影響する変更が必要になった。
3. 認証まわり（`lib/auth-context.tsx`, `components/providers/clerk-*.tsx`,
   `server/_core/{context,oauth,sdk}.ts`, `app/_layout.tsx` のブート構造）に**動作変更**が必要になった。
4. tRPC の公開契約（procedure名・入出力形）や `saved`/エラー文言の互換を壊す可能性がある。
5. **Phase 4（health/sweep 共通化）で Express 版と Vercel 版のレスポンス形・フィールドに意図的な差分を
   発見した**（Express 版 `/api/health` は178行のインライン実装で admin 向け詳細を含む可能性が高い。
   どちらの形が正か判断できない場合は統合せず質問）。
6. `modules/event/` の削除・変更が必要になった。
7. テストと実装の期待値が矛盾した。
8. 削除・置換候補の import が「動的importや文字列参照で使われている」兆候を見つけた
   （置換前に必ずファイル名・シンボル名の文字列 grep も行うこと）。
9. Q1〜Q4 は回答済み（下記）。それでも判断がつかない新しい論点が出た場合は同様に停止して質問する。

**Q1〜Q4 回答（2026-07-23、発注者確定）**:
- Q1（drizzle旧残骸の削除可否）: **削除禁止のまま維持**。Non-Negotiables・Debt #10 の記述通り、
  `docs/proposals/drizzle-legacy-cleanup-PROPOSAL.md` の提案止まりとする。
- Q2（旧 `refactor-instructions.md` の処置）: **`docs/archive/refactor-instructions-2026-07-14.md` へ移動済み**。
  実装担当は追加対応不要。
- Q3（未追跡ファイル・`.tmp-*` の扱い）: **今回は一切触らない**。Non-Negotiables・Out-of-scope の記述通り。
- Q4（Node バージョンの正）: **今回は判断保留**。Phase 6 の Node 表記統一は実施しない（README/engines とも現状維持）。

---

## Baseline Commands

作業開始時:

```bash
git status --short
pnpm check
pnpm test
pnpm lint
```

各フェーズ後: `pnpm check`（+コード変更時 `pnpm test`）。server/・api/ に触ったら `pnpm build` も。
デプロイするターンでは AGENTS.md ディレクティブ4 の確認手順（GHA success / version.json）を実施。

---

## Debt Map（2026-07-23 実測）

| # | 負債 | 根拠(file:line) | なぜ負債か | 影響範囲 | リスク | 改善案 | 検証 | 実装可否 |
|---|---|---|---|---|---|---|---|---|
| 1 | Express/Vercel 二重実装（health/sweep） | `/api/sweep`: `server/_core/index.ts:561-598` と `api/sweep.ts`（SWEEP_SECRET照合とDB成長記録が両方に別実装）。`/api/health`: `index.ts:134-311`（178行インライン）と `api/health.ts`（`lib/health-status.ts` の `buildHealthStatus` を利用） | 片側だけ直す事故の温床。auth/sync は統合済みで残り2本 | dev/本番の乖離、sweep.yml（GHA日次） | 中 | sweep: 共通コア関数（例 `server/lib/sweep-core.ts`）を抽出し両方から呼ぶ。health: Express 版を `buildHealthStatus` ベースへ寄せる。**レスポンス形の差分を先に比較し、差異があれば S&A #5** | `pnpm dev` で `/api/health`・`/api/sweep`(secret付き) 疎通 + `pnpm build` + 既存 `__tests__/health-status.test.ts` | **実装可**（差分比較を先に） |
| 2 | mojibake コメント1行 | `server/_core/index.ts:125`（「Rate Limiter Middleware・井ｸ肴ｭ｣…」） | 可読性。リポジトリ内で唯一の残存 mojibake | なし | 低 | コメントを正しい日本語に修復（コード非変更） | `pnpm check` | **実装可** |
| 3 | 後方互換シム2本 | `server/db.ts`（`server/db/index.js` 再エクスポート。importer は server 配下7ファイル: api-usage-tracker, clerk-auth-sync, login-security, schema-check, token-store, twitter-routes, _core/oauth）。`server/routers.ts`（importer は `server/_core/index.ts:19` のみ） | 「新規コードは直接 server/db/xxx から」と自ら注記しつつシム経由が常態化。探索の遠回り | server 内部のみ（外部公開なし） | 低 | importer を直参照（`server/db/index.js` / `server/routers/index.js`）へ機械置換 → シム2ファイル削除。置換のみ・シンボル変更なし | `pnpm check` / `pnpm test` / `pnpm build` / `pnpm dev` 起動 | **実装可** |
| 4 | README の構造図・手順の陳腐化 | `README.md:172-201`（構造図が `server/routers/encounter.ts`・`drizzle/schema.ts` 前提。実体は `modules/encounter/api/` と `drizzle/schema/` ディレクトリ。events タブの記載なし）。`README.md:53`「Node.js 22.x 以上」と `package.json engines: 24.x` の不一致 | 新規参加者・AIの誤誘導 | オンボーディング | 低 | 構造図を実体に合わせて更新（README更新は過去にユーザー承認済みの方針）。Node 記述は **Q4 回答後に統一** | 目視 + 構造図のパスを `ls` で実在確認 | 構造図=**実装可** / Node表記=Q4待ち |
| 5 | 巨大ファイル: checkin ロジック | `components/checkin/checkin-authenticated-screen.tsx`（1287行。view は `checkin-screen-view.tsx` 540行に分離済みだが、状態機械・測位・429カウントダウン・シェアのロジックが単一コンポーネントに同居） | 変更影響の見通しが悪い。バグ修正がここに集中する履歴 | チェックインUX全体 | 高 | UI非依存の純粋関数（カウントダウン計算等）のみテスト先行で小さく抽出（`resolve-checkin-error-message` 方式の踏襲）。**hooks分割・状態機械の構造変更は提案のみ** | `pnpm test` + 該当画面の手動確認 | 小抽出のみ実装可 |
| 6 | 巨大ファイル: DBクエリ単一モジュール | `modules/encounter/db/queries.ts`（2015行。checkin/encounters/zukan/visit/presence 系が1ファイル） | 責務混在。コンフリクト・誤編集リスク | encounter 全機能 | 高 | ドメイン別分割の**設計提案のみ**（既存 export 名を保つ再エクスポート方式の分割案を提案書に）。当面は「新規クエリは新ファイルへ」の方針をファイル冒頭コメントに追記するだけに留める | `pnpm check` | コメント追記のみ実装可、分割は**提案のみ** |
| 7 | logger/env の不統一 | `console.*` が server/api 配下 32ファイル180箇所（requestId 非連動）。`process.env` 直参照 84箇所 vs `server/_core/env.ts` の importer 2件のみ（形骸化） | 障害調査コスト。env の網羅的把握が不能 | サーバー全域 | 高 | 統一設計（requestId連動logger・env集約）の**提案のみ**。今回は実装しない | — | **提案のみ** |
| 8 | レートリミット3系統 | `server/_core/rate-limiter.ts`（Express dev専用）/ `server/rate-limit-handler.ts`（Twitter API向け）/ `api/trpc/[trpc].ts:35-124`（本番実効） | 役割コメントは付与済み（`3acb3d135`）だが実装は3箇所のまま。本番実効版が api ハンドラにインライン | API保護 | 中 | 本番実効版の別モジュール化 + 共通化の**提案のみ**（挙動同一保証が難しく、429契約に直結するため） | — | **提案のみ** |
| 9 | 巨大 organism 群 | `components/events/events-guest-content.tsx`(799行), `components/organisms/radar-hud.tsx`(790行), `components/organisms/precision-tile-map.tsx`(625行) | 単体テスト困難・変更影響大。ただし現在安定稼働中 | ゲストUX・レーダー・地図 | 中 | 分割は**提案のみ**（直近07-19〜21の成果と隣接し、実地検証コストが高い） | — | **提案のみ** |
| 10 | drizzle 旧テンプレ残骸 | `drizzle/0000_*.sql`〜`0029_*.sql`, `meta_broken/`, `migrations-archive/`, `drizzle/schema.ts`(旧単一ファイル) | 現行の正は `drizzle/migrations/` + `drizzle/schema/`。旧物が並存し初見殺し | DB運用の理解 | 中（誤って正を消す事故） | `docs/proposals/drizzle-legacy-cleanup-PROPOSAL.md` が既にある | — | **Q1回答済み: 削除禁止のまま維持。実装しない** |
| 11 | 旧指示書・調査メモのルート散在 | 旧 `refactor-instructions.md`（実施済み・陳腐化、`docs/archive/refactor-instructions-2026-07-14.md` へ移動済み）, `thumbnail_investigation.md`, `togetter-analysis.md`（git追跡済み）。未追跡の `.tmp-*` 多数・`deploy*.log`・`tmp/` | 「どれが現行指示か」の混乱 | リポ衛生・AI探索 | 低 | 旧指示書は移動済み（対応不要）。`.tmp-*`/log の掃除は **Q3回答済み: 今回は一切触らない** | `git status` | **対応不要（Q2実施済み・Q3は不実施確定）** |
| 12 | Node バージョン表記の不一致 | `package.json engines: "24.x"` / README「Node.js 22.x 以上」「Vercel Node.js Version 22.x」/ ローカル実測 v22.15.0 | どれが正か文書から判断不能（Vercel 実設定はリポ外） | ビルド再現性 | 低 | **Q4回答済み: 今回は判断保留、修正しない** | — | **不実施確定** |

---

## Implementation Phases

### Phase 1: 現状確認と検証結果の記録

- `git status --short` を保存し、既存差分（docs/investigation/*, 未追跡 docs/scripts, `.tmp-*` ほか）を
  「触らないリスト」として宣言。
- `pnpm check` / `pnpm test` / `pnpm lint` を実行し、本文書のベースライン表
  （0エラー / 42 files・347 tests / 0 errors・541 warnings）と一致するか確認。
  **ズレていたら差分を報告してから進む**。

完了条件: baseline 報告ができ、以降の各フェーズで「自分が増減させた差分」を説明できる。

### Phase 2: 挙動変更ゼロの安全網・整地

- Debt #2: `server/_core/index.ts:125` の mojibake コメントを修復（コメントのみ。コードに触らない）。
- Debt #6（小）: `modules/encounter/db/queries.ts` 冒頭に「本ファイルは分割凍結中。新規クエリは
  ドメイン別の新ファイルへ追加し、`queries.ts` からの再エクスポートで互換を保つ」旨のコメントを追記。
- Debt #1 の準備: Express 版と Vercel 版の `/api/health`・`/api/sweep` の
  レスポンス JSON をフィールド単位で比較した表を作成し、報告に含める（まだ統合しない）。
  差異があり、どちらが正か判断できなければ **S&A #5 で停止**。
- 検証: `pnpm check` / `pnpm test`。

### Phase 3: 後方互換シムの撤去（Debt #3）

- `server/db.ts` の importer 7ファイルの import 文を `./db/index.js`（相対位置に応じて）へ機械置換。
  シンボル名・呼び出し形は1文字も変えない。
- `server/routers.ts` の importer（`server/_core/index.ts:19`）を `./routers/index.js` 相当へ置換。
- 置換完了後、シム2ファイルを削除。削除前に `grep -rn "server/db\.js\|routers\.js"`（文字列参照・動的import含む）で
  参照ゼロを最終確認。
- 検証: `pnpm check` / `pnpm test` / `pnpm build` / `pnpm dev` 起動確認（`/api/health` 200）。

### Phase 4: health/sweep 共通ロジック抽出（Debt #1、Phase 2 の比較表が前提）

- sweep: SWEEP_SECRET 照合 + SELECT 1 + `recordDbGrowthSnapshot` の一連を共通関数
  （例 `server/lib/sweep-core.ts`）へ抽出し、`server/_core/index.ts:561-598` と `api/sweep.ts` の
  両方から呼ぶ。**レスポンス JSON のキー・値・ステータスコードを双方とも現状維持**。
- health: Express 版インライン実装のうち、Vercel 版（`lib/health-status.ts`）と同一意味の部分を
  共通関数呼び出しへ置換。Express 版だけが返す追加フィールドは**そのまま残す**（削らない）。
- 検証: `pnpm check` / `pnpm test`（health-status.test.ts 含む）/ `pnpm build` /
  `pnpm dev` で `/api/health` と `/api/sweep`（`x-sweep-secret` 付き POST）の疎通・レスポンス形比較。
  デプロイした場合は本番 `/api/health` と GHA `sweep.yml` の次回実行成功も確認。

### Phase 5: 小さな責務分離（Debt #5）

- `checkin-authenticated-screen.tsx` から UI/DB 非依存の純粋関数（カウントダウン計算・表示文言組み立て等）を
  **テスト先行**で抽出（既存の `components/checkin/resolve-checkin-error-message` + そのテストが手本）。
  状態機械の構造・useEffect の順序・429 の見た目は変えない。1回の抽出は1関数まで、最大2〜3関数。
- 検証: `pnpm check` / `pnpm test` + チェックイン画面の手動確認（位置許可→チェックイン→結果表示）。

### Phase 6: ドキュメント整合（Debt #4）

- `README.md` の「プロジェクト構造」節を実体（`modules/encounter/api/`・`modules/event/`・
  `drizzle/schema/`・6タブ・`components/*-authenticated-screen.tsx` 構造）に合わせて更新。
  記載する各パスは `ls` で実在確認してから書く。
- Node バージョン表記は **Q4 で判断保留と確定**。今回は修正しない（README・package.json engines とも現状維持）。
- 検証: 目視 + 構造図パスの実在確認。

### Phase 7: 大きな設計変更は提案のみ(実装しない)

以下を `docs/refactor-phase7-proposals.md` への追記（または新セクション）としてまとめる。
リスク・必要テスト・移行手順を含め、**コードは書かない**:

- logger/env 統一（Debt #7）: requestId 連動 logger、`server/_core/env.ts` への env 集約 or 撤去。
- レートリミットの一本化（Debt #8）。
- `queries.ts` のドメイン別分割設計（Debt #6、再エクスポート互換方式）。
- 巨大 organism（events-guest-content / radar-hud / precision-tile-map）の分割設計（Debt #9）。
- Express dev サーバーの整理・撤去と dev 環境の Vercel Functions 化（vercel dev 等の実現可能性込み）。
- checkin 状態機械の hooks 分割（Debt #5 の続き）。

---

## Verification Requirements

- 各フェーズ後に `pnpm check`（0エラー必須）。コード変更フェーズは `pnpm test` も必須。
- server/・api/ に触ったフェーズは `pnpm build` と `pnpm dev` 起動確認も実施。
- lint 設定・ナビゲーションに触った場合は `pnpm lint`（0 errors 維持。warnings は増やさない）。
- UI/文言に触った場合は `DESIGN.md` のチェックリストに従い、モバイル/デスクトップ幅で確認。
- クライアントバンドルに実質変更が入った状態でデプロイする場合は `CDN_CACHE_EPOCH`（現在14）を +1。
- デプロイした場合は AGENTS.md ディレクティブ4 の完了確認（GHA success / version.json 一致）まで行う。
- 失敗したコマンドは、エラー要約・原因・対処・再実行結果を報告する。

---

## Reporting Format

完了時に報告すること:

1. 実行したフェーズと、スキップした（承認待ち）フェーズ。
2. 変更したファイル一覧（コミット単位）。
3. 既存差分と自分の差分の区別。
4. 最後に実行したコマンドと結果（check / test / lint / build）。
5. Phase 2 で作成した health/sweep レスポンス比較表。
6. 削除したファイル（シム2本）と、削除前の最終確認 grep の結果。
7. 残した警告・未解決の負債・Phase 7 の提案文書の所在。
8. Stop And Ask Conditions に該当した場合、止めた理由と質問。

---

## Out-of-scope Items

- 新機能追加、UIの見た目改善だけを目的にした変更。
- 認証フロー・`app/_layout.tsx` ブート構造の実装変更（提案のみ）。
- DB schema / migrations / 本番データの変更。drizzle 旧残骸の削除（Q1承認前）。
- `modules/event/` の削除・変更。
- ゲストヒーロー構造（one-tap-guest-shell / previews / zukan-guest-live）の構造変更。
- LP（`public/lp/` と関連アセット・app.js）への変更。
- ストア系ワークフロー（ios-*, android-*, apple-*, play-*, asc-*）への変更。
- lint warning（541件）の無差別一括修正。
- `.tmp-*`・`*.log`・`tmp/`・ルート散在調査メモの掃除（Q2/Q3承認前）。
- 新規依存ライブラリの追加・既存依存の削除。
- `dist/`, `.expo/`, `.vercel/`, `node_modules/`, `public/lp/img/`, `public/lp/sounds/` の探索・編集。
