# Refactoring Instructions for surechigai-romi.link

このファイルは、実装担当モデルに `/goal refactor-instructions.md に書かれたことを完遂しろ` と渡すための作業指示書です。

## 実装前に確認すべき質問

現時点で、実装担当モデルが勝手に決めてはいけない事項は以下です。

1. `modules/event/` と `app/(tabs)/events.tsx` は、すれちがいロミ本体で残す予定の「予定×ライブ表明」機能か、旧テンプレート由来の削除候補か。
2. `README.md` に残る Supabase / `sweeper.yml` 記述は、すぐに Railway / `sweep.yml` へ更新してよいか。
3. 認証フローを分割する場合、Clerk Satellite と kimito.link 連携の手動E2E確認を誰がどの環境で行うか。
4. `getMyEncounters` のN+1クエリ最適化で返却順・件数・ブロック除外・停止ユーザー除外の厳密な期待値をどこまでテスト化するか。
5. `drizzle/` 直下の古いマイグレーション群と `meta_broken/` を削除候補にしてよいか。DB履歴に影響しうるため、承認なしに消さないこと。

## Objective

既存仕様を壊さず、今後のMVP実装を安全に進めるために、現在のコードベースに残る技術的負債を小さな単位で減らす。

最優先は以下。

- 現行方針と矛盾する古い設計記述を整理する。
- `pnpm check` 0エラーを維持する。
- ルーター、DBクエリ、純粋ドメインロジックの境界を少しずつ明確にする。
- 既存挙動に安全網がない箇所は、先にテストまたは再現手順を作る。

見た目を整えるだけの変更、全面書き換え、大量削除、新機能追加は目的ではない。

## Project Understanding

このプロジェクトは「すれちがいロミ (surechigai-romi.link)」。DSのすれ違い通信を現代的に再現する位置情報マッチングアプリである。

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
- `modules/event/` や旧テンプレート由来に見えるコードの削除判断が必要になった。
- `README.md` と `AGENTS.md` / `CLAUDE.md` の矛盾について、どちらを修正対象にするか判断が必要になった。
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
| 旧テンプレート由来らしき残存物 | `modules/event/*`, `app/(tabs)/events.tsx`, 旧イベント/チャレンジ系 navigation entries | AGENTSでは削除済みモジュールの再利用禁止がある一方、現コードでは event router が登録されている | ルート、API、型、将来削除 | 高。プロダクト判断が必要 | 使用実態を調査し、削除候補リストだけ作る | `git grep` 相当、`pnpm check` | 提案のみ |
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

- `refactor-instructions.md`、schemaコメント、sweepコメントなど、現行方針と明確に矛盾する記述を修正する。
- READMEの運用手順は確認事項に入っているため、承認なしに広範囲更新しない。
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

- `getMyEncounters` の返却契約をテストまたは具体的な検証手順に落とす。
- N+1最適化は、契約が固まってから小さく行う。
- 返却順、cursor、ブロック除外、停止ユーザー除外、24hひとこと表示を変えない。

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
