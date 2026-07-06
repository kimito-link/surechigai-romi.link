# Refactoring Instructions for surechigai-romi.link

このファイルは、実装担当モデルに `/goal refactor-instructions.md に書かれたことを完遂しろ` と渡すための作業指示書です。

## 2026-07-04 以降の変更（この指示書の前提を更新）

> この指示書は 2026-07-04 に作成された。その後 07-06 までに以下が進んだ。**実装担当モデルは
> これらを「謎のファイル/退行」と誤認せず、既存の正しい状態として扱うこと。リファクタの対象外**。

- **Capacitor ネイティブ化の下地を追加済み**（本体機能。リファクタで消さない・触らない）:
  `capacitor.config.json`（server.url = `https://surechigai.kimito.link` の連動型）、
  `scripts/generate-capacitor-splash.mjs`, `scripts/generate-brand-radar-art.mjs`,
  `scripts/patch-ios-launch-dark.mjs`, `scripts/verify-ios-splash-not-default.mjs`,
  `store-assets/appstore/app-icon-1024.png`, `assets/splash*.png`,
  `.github/workflows/ios-appstore-release.yml` 他。詳細は `docs/handoff-2026-07-06.md`。
- **ドメインは `https://surechigai.kimito.link` が正規**（実体）。`surechigai-romi.link` は
  全パスが 308 で正規へリダイレクトされる旧ドメイン。`lib/site-urls.ts` の `APP_ORIGIN`、
  `lib/share.ts` の `getAppUrl()`（正規化済み）、`vercel.json` の redirects がこれを前提にしている。
  **シェアURL・og:url・OAuthコールバックのドメインを勝手に変えない**（07-06に統一済み）。
- **アプリ不具合の総点検 SPEC がある**: `docs/app-audit-2026-07-06-SPEC.md`。シェアの
  ポップアップブロック回避パターン（クリック直後に同期で `window.open` → slug取得後にURL差し替え）、
  統計カードの Pressable 化などは **07-06 に実装済み**。この SPEC の §5「却下」項目
  （twitter.com→x.com を主因とする説、checkin の意図的 disabled ボタン等）は**直さない**。
- **`pnpm test` の現状（2026-07-06 実測）**: **34 files passed / 304 tests passed、1 file failed**。
  失敗は `__tests__/get-current-location.test.ts`（Rollup パースエラー・0 test）。これは
  **セッション跨ぎで存在する他者の未コミット差分（Flow構文でパース不能）**であり、**既知・baseline
  由来・触らない**。実装担当が自分の変更で壊したと誤解しないこと（下記「確定事項」も同旨）。
  ※この指示書本文の「pnpm test: 成功、2 files / 81 tests」は 07-04 時点の古い数値。上記が現状。

## ユーザー確認済みの確定事項（2026-07-04）

以下はユーザーに確認済み。実装担当モデルはこれを前提として作業し、再質問しないこと。

1. **`modules/event/` と `app/(tabs)/events.tsx` は残す本体機能**（「予定×ライブ表明」。doin-challenge にも移植する共通機能）。旧テンプレート由来の削除候補ではない。削除調査は不要。触らないこと。
2. **`README.md` の Supabase / `sweeper.yml` 記述は Railway / `sweep.yml` へ更新してよい**（Phase 2 で実施）。
3. 認証フローの分割は今回**提案のみ**。手動E2E確認は今回計画しないため、認証実装には触らない。
4. `getMyEncounters` の返却契約は**モックDBの単体テストで固定する**: 返却順・件数・cursor・ブロック除外・停止ユーザー除外・24hひとこと表示を対象とする。契約テストが通ってから N+1 最適化を小さく行う。
5. `drizzle/` 直下の古いマイグレーション群と `meta_broken/` は**削除しない**。整理は提案のみ。

## Objective

既存仕様を壊さず、今後のMVP実装を安全に進めるために、現在のコードベースに残る技術的負債を小さな単位で減らす。

最優先は以下。

- 現行方針と矛盾する古い設計記述を整理する。
- `pnpm check` 0エラーを維持する。
- ルーター、DBクエリ、純粋ドメインロジックの境界を少しずつ明確にする。
- 既存挙動に安全網がない箇所は、先にテストまたは再現手順を作る。

見た目を整えるだけの変更、全面書き換え、大量削除、新機能追加は目的ではない。

## Project Understanding

このプロジェクトは「君斗りんくのすれ違ひ通信 (surechigai-romi.link)」。DSのすれ違い通信を現代的に再現する位置情報マッチングアプリである。

主要体験:

- X / Clerk によるログイン。
- チェックインで位置を記録し、即時マッチングと過去30日のタイムシフトマッチングを行う。
- ポスト画面で封筒としてすれ違いを開封する。
- 一方向スタンプリアクションのみ提供し、DMはアプリ内に持たない。
- 図鑑・軌跡マップで訪問やすれ違いの蓄積を見る。

現行の重要方針:

- `locations` には正確な `lat` / `lng` / `accuracyM` を保存し、削除しない。
- マッチング用に `h3R8`、`latGrid`、`lngGrid` も保持する。
- DB は Railway PostgreSQL。`DATABASE_URL` は Railway 外部URL `*.proxy.rlwy.net` を使う。
- Vercel Functions に API を同居する方針。ローカル開発では Express サーバーも使う。

主要エントリーポイント:

- Expo Router: `app/`
- タブ画面: `app/(tabs)/index.tsx`, `checkin.tsx`, `map.tsx`, `zukan.tsx`, `mypage.tsx`
- 認証案内: `app/auth/kimito-link.tsx`, `hooks/use-auth.ts`
- tRPC統合: `server/routers/index.ts`
- Express/API: `server/_core/index.ts`
- encounter API: `modules/encounter/api/*.ts`
- encounter純粋ロジック: `modules/encounter/core/*.ts`
- encounter DBクエリ: `modules/encounter/db/queries.ts`
- DB schema: `drizzle/schema/*.ts`, `drizzle/schema/index.ts`
- テスト: `__tests__/encounter-core.test.ts`, `lib/navigation/__tests__/navigation.test.ts`
- スイープ workflow: `.github/workflows/sweep.yml`

データフロー:

1. 画面から `trpc.encounter.*` を呼ぶ。
2. `server/routers/index.ts` が `modules/encounter/api/*` のルーターを統合する。
3. ルーターが `getDb()` でDBを取得し、`modules/encounter/db/queries.ts` の関数へ渡す。
4. 位置・H3・ティア判定・マッチングは `modules/encounter/core/*` の純粋関数で処理する。
5. Drizzle schema は `drizzle/schema/index.ts` から再エクスポートされる。

外部依存:

- Clerk / X OAuth
- Railway PostgreSQL
- Drizzle ORM
- h3-js
- Groq / Gemini moderation
- Expo Router / React Native Web
- Vercel / GitHub Actions

現在確認済みの検証結果:

- `pnpm check`: 成功
- `pnpm test`: 成功、2 files / 81 tests
- `pnpm lint`: 成功、0 errors / 多数 warnings
- 実行環境では Node v22.15.0 のため、`package.json` の `node: 24.x` に対する engine warning が出る。

## Behaviors To Preserve

- 正確な `lat` / `lng` / `accuracyM` を保存する現在方針。
- `locations` を48時間で削除しない永続保存方針。
- `h3R8` と500mグリッド値を使うマッチング互換性。
- 過去30日の同セル訪問者とのタイムシフトマッチング。
- 同日同ペアの重複 encounter 抑止。
- ブロック済みペアと停止ユーザーの除外。
- ひとことは24時間以内だけ相手に返す挙動。
- ひとこと更新時のNGワード / moderation 境界。
- X / Clerk ログイン、Clerk Satellite、kimito.link 経由の認証導線。
- アプリ内DMを追加しない方針。
- `/api/sweep` は `SWEEP_SECRET` を要求し、`deleteExpiredLocations` は互換維持のため呼べるが削除しない。
- Expo Router の直接 `router.push/replace/back` を画面から使わず、`lib/navigation` のヘルパーを使う規約。

## Non-Negotiables

- 作業開始直後に `git status --short` を確認する。
- 既存の未コミット変更はユーザーまたは他モデルの作業として扱い、戻さない。
- 自分の変更と既存差分を混ぜて説明しない。触ったファイルを明確に報告する。
- 編集前に baseline の `pnpm check` 結果を記録する。
- すべてのコード変更後に `pnpm check` を実行し、0エラーを確認する。
- 可能なら `pnpm test` と `pnpm lint` も実行する。lint warning は既存分を一括修正しない。
- 新規ライブラリ追加は禁止。必要なら提案だけに留める。
- UI/UX、画面文言、地図表現に触る場合は、作業前に `DESIGN.md` を読み、`会いたい君がいる現在地` と正確な場所をたどれる体験を弱めない。
- DB schema / migration の破壊的変更は禁止。必要なら停止して質問する。
- 認証、OAuth、セッション、Cookie、外部API、保存済みデータに影響する変更は小さく分け、テストまたは手動確認手順を先に作る。
- 無関係な整形、全体フォーマット、ついでのリネームをしない。
- 古い設計書や古いREADMEより、`AGENTS.md` / `CLAUDE.md` の現行方針を優先する。

## Stop And Ask Conditions

以下に該当したら実装を止め、質問を報告する。

- 正確な座標保存、永続保存、Railway DB方針と矛盾する変更が必要になった。
- `drizzle/schema/*`、`drizzle/migrations/*`、本番DBデータに影響する変更が必要になった。
- `hooks/use-auth.ts`、`server/_core/oauth.ts`、`server/twitter-routes.ts`、Clerk Satellite の挙動に影響する。
- `modules/event/` の削除・変更が必要になった（残す本体機能と確定済みのため、触る必要が生じたら停止）。
- テストと実装の期待値が矛盾する。
- 公開API、tRPC契約、DBカラム、保存済みデータの互換性を壊す可能性がある。
- 大規模な責務分離やファイル移動が必要で、インポート修正だけでは済まない。

## Baseline Commands

作業開始時:

```bash
git status --short
pnpm check
pnpm test
pnpm lint
```

各フェーズ後:

```bash
pnpm check
```

変更内容に応じて追加:

```bash
pnpm test
pnpm lint
pnpm build
```

DB schema を触った場合のみ、承認後に:

```bash
pnpm db:push
```

## Debt Map

| 負債 | 根拠 | なぜ負債か | 影響範囲 | 変更リスク | 改善案 | 検証方法 | 実装可否 |
|---|---|---|---|---|---|---|---|
| 現行方針と古い記述の矛盾 | `refactor-instructions.md`, `README.md`, `drizzle/schema/encounter.ts`, `drizzle/schema/index.ts`, `server/_core/index.ts` | Supabase、48h削除、生座標非保存の記述が残り、AGENTS/CLAUDEのRailway・正確座標永続保存方針と矛盾する | 将来の実装判断、DB設計、削除処理 | 低から中。コメントだけなら低、README運用手順は確認必要 | コメントと指示書を現行方針へ更新。READMEの環境手順は質問後に修正 | `pnpm check`、差分レビュー | コメント/指示書は実装可。READMEは確認推奨 |
| encounter API が module 層から server 層へ依存 | `modules/encounter/api/*.ts` が `server/_core/trpc` と `server/db/connection` を import | `modules/encounter` を純粋なドメイン/DB層として移植しづらい | tRPC、テスト、移植性 | 中。ファイル移動は import 破損リスクあり | まず `api` は現状維持し、ルーター内の純粋ロジックを `core/usecases` へ薄く抽出する | `pnpm check`, `pnpm test` | 小さな抽出のみ実装可。大規模移動は提案のみ |
| `checkIn` ルーターの責務集中 | `modules/encounter/api/encounter.ts` | validation、geocode、insert、matching、初回ボーナス、settings更新が1 mutationに集中 | 位置記録、マッチング、UX | 高 | 先に `checkIn` の入力/出力・副作用順のテストまたは手動再現手順を作り、純粋計算だけ抽出 | `pnpm check`, `pnpm test`, ローカル手動チェックイン | 段階的なら実装可 |
| `getMyEncounters` のN+1クエリ | `modules/encounter/db/queries.ts` | encounter一覧取得後、partner取得・Twitter cache取得・件数取得をループ内で実行 | ポスト画面、DB負荷 | 中から高。返却形の維持が必要 | 返却契約テストを追加後、join/集約でまとめる | DBあり統合テストまたはモックDBテスト、`pnpm check` | テスト先行なら実装可 |
| 認証フローの高結合 | `hooks/use-auth.ts`, `app/auth/kimito-link.tsx`, `server/_core/index.ts`, OAuth関連 | Web/Native/Clerk Satellite/kimito.link/バックエンド同期が密接 | ログイン不能リスク | 高 | 設計案作成に留め、実装は手動E2E確認計画がある場合のみ | 実機/ブラウザ手動E2E、`pnpm check` | 提案のみ |
| ~~旧テンプレート由来らしき残存物~~（解決済み） | `modules/event/*`, `app/(tabs)/events.tsx` | ユーザー確認の結果、**残す本体機能**と確定（確定事項1）。負債ではない | — | — | 対応不要。触らない | — | 対象外 |
| mojibake コメント | `server/_core/index.ts`, `.github/workflows/sweep.yml` | コメントが読めず、セキュリティヘッダーやsweep意図のレビュー性が低い | 保守性 | 低。ただしコードは触らない | コメントのみ日本語/英語へ修正 | `pnpm check` | 実装可 |
| lint warnings の蓄積 | `pnpm lint` 出力 | 直書きカラー、未使用、hook deps などが多い | レビュー信号の低下 | 中。UI差分を生みやすい | エラーだけ優先。警告は対象ファイルを限定して別フェーズで処理 | `pnpm lint` | 小分けなら実装可 |
| schema/migration 配置の混在 | `drizzle/` 直下SQL、`drizzle/migrations/`, `drizzle/meta_broken/` | どれが現行マイグレーションか誤解しやすい | DB運用 | 高 | 現行運用を確認し、削除せずREADME/AGENTSへ整理 | `pnpm check`, DB履歴確認 | 提案のみ |

## Implementation Phases

### Phase 1: 現在状態と検証結果の記録

- `git status --short` を保存する。
- `pnpm check`, `pnpm test`, `pnpm lint` を実行する。
- 既存未コミット差分を把握し、自分が触る範囲を宣言する。

完了条件:

- baseline結果を報告できる。
- 既存差分と自分の差分を区別できる。

### Phase 2: 安全なドキュメント/コメント整合

- schemaコメント、sweepコメントなど、現行方針と明確に矛盾する記述を修正する。
- `README.md` の Supabase / `sweeper.yml` 記述を Railway / `sweep.yml` の現行運用へ更新する（確定事項2で承認済み）。CLAUDE.md の「Railway / データベースについて」を正とする。
- コード挙動は変えない。

検証:

```bash
pnpm check
```

### Phase 3: lint error のみ修正

- `local-rules/no-direct-router-push` など、lintを失敗させる error だけ直す。
- warning の一括修正はしない。
- navigation は `lib/navigation/app-routes.ts` のヘルパーへ寄せる。

検証:

```bash
pnpm check
pnpm lint
pnpm test
```

### Phase 4: encounter ルーターの安全網追加

- `modules/encounter/core/*` の既存テストを維持する。
- `checkIn` から抽出したい純粋処理がある場合、先に入力/出力の単体テストを書く。
- DB・認証・geocodeの副作用順が関わる部分は、実装前に再現手順を明文化する。

検証:

```bash
pnpm check
pnpm test
```

### Phase 5: 小さな責務分離

- `checkIn` から、DBに依存しない値組み立て・結果整形だけを純粋関数へ抽出する。
- geocodeを待つ/待たないタイミング、`locations` insert順、`visitedAreas` upsert順、`homeMaskCell` 非同期更新は変えない。
- `modules/encounter/api/*.ts` のファイル移動は行わない。

検証:

```bash
pnpm check
pnpm test
```

### Phase 6: DBクエリ改善の準備

- `getMyEncounters` の返却契約を**モックDBの単体テスト**に落とす（確定事項4）。対象: 返却順、件数、cursor、ブロック除外、停止ユーザー除外、24hひとこと表示。
- 契約テストが通ってから、N+1最適化を小さく行う。
- 上記の返却契約を一切変えない。

検証:

```bash
pnpm check
pnpm test
```

### Phase 7: 大きな設計変更は提案のみ

- 認証分割、event残存物削除、migration整理、DB schema変更は実装しない。
- 具体的なリスク、必要テスト、移行手順をMarkdownで提案する。

## Verification Requirements

- 各フェーズ後に `pnpm check` を実行する。
- コード変更があるフェーズでは `pnpm test` を実行する。
- navigation、lint rule、画面遷移に触った場合は `pnpm lint` を実行する。
- UI/UX、画面文言、地図表現に触った場合は `DESIGN.md` の Anti-Slop Checklist を使い、モバイル/デスクトップ幅で文字切れ、重なり、正確な場所の見え方を確認する。
- DB schemaに触る必要が出たら停止する。
- 失敗したコマンドは、エラー要約、原因、直した内容、再実行結果を報告する。
- warning は「残存 warning」として報告し、無関係な一括修正はしない。

## Reporting Format

完了時は以下を報告する。

1. 実行したフェーズ。
2. 変更したファイル。
3. 既存差分と自分の差分の区別。
4. 最後に実行したコマンドと結果。
5. 残した警告・未解決の負債。
6. Stop And Ask Conditions に該当した場合は、止めた理由と質問。

## Out-of-scope Items

- 新機能追加。
- UIの見た目改善だけを目的にした変更。
- 認証フローの実装変更。
- DB schema / migration の破壊的変更。
- `modules/event/` や旧テンプレート由来らしきファイルの削除。
- 大規模なファイル移動。
- 新規依存ライブラリ追加。
- lint warning の無差別な一括修正。
- `dist/`, `.expo/`, `.vercel/`, `node_modules/`, `public/lp/img/`, `public/lp/sounds/`, `council/`, `*.log` の探索や編集。
