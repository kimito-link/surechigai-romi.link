# 実装仕様(to-spec): カテゴリで会いに行く / 自宅に帰る

> **設計 = Fable 5.1（claude-fable-5-1）／ 地図・裏取り = 司令塔(Claude Opus 5)／ 2026-09-07**
> 地図: [category-meetup-navi-MAP.md](category-meetup-navi-MAP.md)
> 手法: [WAYFINDER-TO-SPEC-HOWTO.md](../../web-ios-android/docs/ai-workflows/WAYFINDER-TO-SPEC-HOWTO.md) 手順2
>
> ## ★司令塔による裏取りの結果（HOWTO「仕様の裏取り」）
>
> Fable は**地図の誤りを3点指摘した。実コードで確認したところ、3点とも Fable が正しい**:
>
> | # | 指摘 | 裏取り | 判定 |
> |---|---|---|---|
> | 訂正1 | 閲覧層では masked を他人に返していない | `queries.ts:2371` に `if (masked && !isSelf) continue;` が実在 | ★**Fable が正しい**。地図を訂正済み |
> | 訂正2 | `livePresenceEnabled` はクライアントが自動でONにする | `use-auto-start-live-presence.ts:48` に `setEnabledMutation.mutate({enabled:true})` が実在 | ★**Fable が正しい**。同意の証拠にならない |
> | 補足 | 自宅マスクは夜間3回以上でしか作られない | `core/home-mask.ts:7,10` に `{start:23,end:5}` `MIN_NIGHT_VISITS = 3` が実在 | ★**Fable が正しい**。マスク不在のユーザーが居る |
>
> ★この3点は設計の前提を変える重要な指摘であり、**地図を書いた司令塔の側が誤っていた**。
> 以下の仕様はこの訂正を織り込んだもの。

---

## 1. Problem Statement

1. **「自宅に帰る」が無い。** 経路案内の部品（`openMapsDirections`／`NavigateToPlaceButton`）は4箇所で稼働しているが、毎日押される目的地＝自宅を1タップで開く導線が無い。カーナビとして普段使いされる入口が無い。
2. **「会いに行く」の土台が2ヶ月止まっている。** `LIVE_PRESENCE_RADAR_ENABLED = false`（`components/post/post-authenticated-screen.tsx:40`）は OOM 切り分けの一時停止で、真因は別（`b3337de`）と確定済み。無罪のまま止まっている。
3. **「会いに行く」を今のまま付けると自宅へ案内する。** 理由: (a) masked でも正確座標を保存している、(b) マスクは推定でしか作られず多くのユーザーに存在しない、(c) 居場所公開はクライアントが自動 ON にするので「本人が会いに来てよいと言った」証拠にならない。
4. **「属性の合う人にフォローされる」を示す語彙が無い。** カテゴリ用のテーブル・カラムは存在しない。投稿を持たない方針なので、属性を示す唯一のデータがカテゴリになる。

## 2. Solution

### 2-1. 3つに分けて、この順で出す

| 順 | 名前 | 中身 | 依存 |
|---|---|---|---|
| **A** | 自宅に帰る | 自宅座標を **端末ローカルだけ** に持ち、既存 `openMapsDirections` で開く。副産物として **自宅セルを「宣言」して `homeMaskCell` を即時に確定**させる | 無し |
| **B** | 会いに行く | 保存層の穴塞ぎ → 明示同意フラグ `meetableEnabled` → 「いま会いに行ける人」一覧 → レーダー再有効化（ソークで機械確認） | A |
| **C** | カテゴリ | 固定語彙をプロフィール／足あと／集まりに付け、県別クリエイター一覧で「同じ属性」で探せるようにし、X へ送る | 無し |

**A を先に出す理由**: サーバー変更が最小、ストア申告の変更なし、毎日押される、そして **B の安全条件（マスクの存在）を作る**。
**C を最後にする理由**: 現時点でユーザーが1人なので「属性で探す」の価値が出るのが最も遅く、語彙の確定という未解決事項を抱えている。

### 2-2. 地図7章の8問への回答

**Q1. カテゴリの語彙。** **固定リスト。** 自由入力は不採用。理由: (1) 自由入力にした瞬間「投稿を持たない＝モデレーション不要」が消える。(2) 「属性が合う」は同一 id の一致で判定するので表記揺れが機能を壊す。(3) オーナー自身が姉妹アプリで「ジャンルが広すぎて迷う」と結論している。

ルール: 最大12件、**「その他」を置かない**（一致信号を持たない）、id は ASCII snake_case、`CATEGORY_VOCAB_VERSION` を持つ。語彙を減らすときは DB の値を消さず `parseCategories` が未知 id を捨てる（前方互換）。

★**初期語彙はオーナー確定待ち**。叩き台: `jimoty_trade`(ジモティ・取引) / `oshi_katsu`(推し活) / `seichi`(聖地巡礼) / `haishin`(配信・VTuber) / `drive`(ドライブ・車) / `camp`(キャンプ・アウトドア) / `gourmet`(グルメ) / `onsen`(温泉・旅)

**Q2. データ構造。** **既存テーブルへの列追加。別テーブルは作らない。**

- `users.categories text NOT NULL DEFAULT ''`（カンマ区切り・最大3）
- `locations.category varchar(24) NULL`（足あとは1件1つ）
- `events.categories text NOT NULL DEFAULT ''`（最大3。`typeTags` とは別列）

理由: 1対1／1対N-小 なのに JOIN・削除処理・通報先が増える。列追加なら退会削除は既存の行削除に自動で乗る。

**Q3. `LIVE_PRESENCE_RADAR_ENABLED` を戻すか。** **戻す。ただし B の最後の単独コミットとして、既存ソークで前後を測ってから。**

1. `pnpm soak:auth-home --lite --minutes=10 --heap-mb=256`（基準値）
2. フラグ true で同条件
3. 合格条件: `OOM_CRASH` / `RELOAD_LOOP` / `MUTATION_STORM` / `BOUNDARY_LOOP` / `ERROR_STORM` / `HEAP_GROWTH` のいずれも出ない
4. 本番反映後、同じ10分ソークを本番に対して再実行（★ローカル緑は本番の証拠にならない）
5. コミットに手順2と4の verdict を貼る。★「たぶん大丈夫」と書かない

逃げ道の `?romiLiteHome=1` はそのまま残す。

**Q4. 自宅座標をどこに持つか。** **サーバーは自宅の座標を一切持たない。端末ローカルだけ。**

サーバーへ送るのは **500m グリッドに丸めた点**だけで、そこから h3R8 を計算して `homeMaskCell` に**セルIDだけ**保存する。

- 新列 `userSettings.homeMaskSource varchar(16)`（`'declared'` / `'inferred'` / NULL）
- 自宅登録 → `homeMaskCell = <cell>, homeMaskSource = 'declared'`
- 夜間推定は `homeMaskSource === 'declared'` のとき**上書きしない**

漏れたときの被害: DB が漏れても自宅は **460m のセル ID しか無い**（現状の推定マスクと同じ粒度・新しい情報を増やさない）。

**Q5. 「会いに行く」を出す条件（AND・すべてサーバー側判定）。**

1. 相手が `meetableEnabled = true`（新設・既定 false・**本人の明示 ON のみ。自動 ON の経路を作らない**）
2. 相手が `livePresenceEnabled = true` かつ 5分以内
3. 停止中でない・一時停止中でない・ブロック関係でない（既存の除外そのまま）
4. 相手の現在位置が自宅マスクに当たらない（既存 skip を利用）
5. ★**`meetableEnabled` を ON にする前提条件として `homeMaskCell != null`**（サーバーで `PRECONDITION_FAILED`。UI は自宅登録へ誘導）

保存層の穴塞ぎ（B-1）:

- `updateLivePresencePosition` で masked のとき **500m グリッド値を保存**（正確座標を保存しない）
- `listLivePresenceForViewer` は **`meetableEnabled` でない他人の座標を 500m に丸めて返す**

**Q6. カテゴリで人を探す画面。** **`app/zukan/[prefecture].tsx`（県別クリエイター一覧）に載せる。** 新しい画面は作らない。ここは既に「人を探す」唯一の公開ディレクトリで、`trailVisibility = public` の人だけ載る＝本人の自由意志の枠に既に乗っている。

**Q7. ストア審査。** 影響があるのは **B のみ**（A はサーバーに座標を送らず、C は位置情報に触れない）。

- iOS `NSLocationWhenInUseUsageDescription` に追記:「本人が『会いに行ける』を ON にした場合のみ、正確な現在地を他の利用者への道案内に使います」
- `app/privacy.tsx` に同内容の節
- 審査ノートに「既定 OFF・本人の明示 ON・自宅マスク必須・5分で失効」
- ★**B のストア提出前に `store-guard` に通す**。動画提出を求められた前例があるので30秒の画面録画を先に用意

**Q8. MVP。** **A → B → C。MVP＝A のみで1本のリリース。** B は3コミット（B-1 穴塞ぎ／B-2 同意と一覧／B-3 フラグ復帰）に分け、B-3 は単独コミットにしてソーク結果を添える。

### 2-3. 「属性が合う」をカテゴリだけでどう示すか

投稿が無いので、示せる根拠は3つだけ:

1. **宣言**（プロフィールのカテゴリ、最大3）
2. **行動**（カテゴリ付きの足あと＝その属性で実際に行った場所。★「ツイートを見ると安心できる」の、このアプリにおける等価物）
3. **予定**（カテゴリ付きの集まりの主催・参加）

「属性が合う」＝ 閲覧者の宣言カテゴリと、相手の 1〜3 の和集合との**交わりが空でない**。
★交わりの数を出す以上の「相性スコア」は作らない（根拠を説明できない数字は信用を落とす）。
フォローは全面 X 送り（既存 `openTwitterProfile`）。

## 3. User Stories

### A. 自宅に帰る

- **正常**: 登録済み → 「自宅に帰る」→ 外部地図が経路案内を開く
- **空（未登録）**: ボタンは表示され、押すと登録モーダル。登録しても**即座に案内を開かない**（誤登録直後に地図へ飛ばさない）
- **読み込み中**: ストレージ読み込み中はボタンを disabled にせず、押されたら完了を待って分岐
- **失敗と再試行**: 位置取得失敗 → モーダル内にエラーと「もう一度」。★`accuracy > 500m` は保存しない（PC の Wi-Fi 測位で隣町を自宅にしない）
- **権限不足**: 「設定で位置情報を許可してください」。★自宅登録に現在地以外の入力手段を作らない
- **古いデータ**: 壊れた JSON → `parseHomeLocation` が null を返し「未登録」扱い（クラッシュしない）
- **Undo**: 登録直後のトーストで10秒 Undo。マイページに「自宅を解除」
- **サーバー同期の失敗**: ローカル保存は成功させ「あとで再送します」。★**ローカル保存を失敗させない**（毎日の導線を止めない）

### B. 会いに行く

- **正常（相手側）**: マイページで ON → 自宅登録済みなら即 ON
- **正常（閲覧側）**: 「いま会いに行ける人」一覧 → 「会いに行く」→ 外部地図
- **空**: 「いま会いに行ける人はいません」＋自分が OFF なら「あなたも ON にすると、会いに来てもらえます」
- **失敗**: 一覧を隠さず「取得できませんでした（再試行）」
- **権限不足**: 自宅未登録で ON → `PRECONDITION_FAILED` → 登録モーダルへ誘導し、完了後に再試行
- **古いデータ**: 既存ユーザーは全員 `meetableEnabled=false`
- **Undo**: OFF は即時。OFF にした瞬間から `list` に載らない（サーバー判定）
- **相手が動いた**: 押した時点の座標で案内が開く。行内の「○分前」で古さを示す
- **自宅にいる相手**: 一覧から消える。相手側には「ひみつの場所にいるため、いまは一覧に出ていません」

### C. カテゴリ

- **正常**: マイページ「属性」→ チップ最大3 → 保存
- **空**: 未設定なら「同じ属性」バッジは出ない
- **失敗**: 元の選択に戻す（onError ロールバック）
- **権限不足**: 足あとのカテゴリは所有者だけ
- **古いデータ**: 語彙から消えた id は表示しない・保存時に落とす
- **競合**: 2端末同時保存は後勝ち（競合検出は作らない）

## 4. Implementation Decisions

### 4-1. スキーマ（列追加のみ・新テーブル無し）

```ts
// drizzle/schema/encounter.ts - userSettings
meetableEnabled: boolean("meetableEnabled").default(false).notNull(),
homeMaskSource: varchar("homeMaskSource", { length: 16 }),  // 'declared'|'inferred'|NULL

// drizzle/schema/encounter.ts - locations
category: varchar("category", { length: 24 }),

// drizzle/schema/users.ts - users
categories: text("categories").default("").notNull(),

// drizzle/schema/event.ts - events
categories: text("categories").default("").notNull(),
```

マイグレーションは3本に分ける（A / B / C）。

### 4-2. 純粋関数（テストの主戦場）

```ts
// modules/encounter/core/lat-lng.ts  ★h3 を import しない側に置く
export const LAT_GRID: number; export const LNG_GRID: number;
export function snapToGrid(lat: number, lng: number): { latGrid: number; lngGrid: number };

// modules/encounter/core/home-mask.ts
export type HomeMaskSource = "declared" | "inferred";
export function shouldApplyInferredHomeMask(source: string | null | undefined): boolean;

// modules/encounter/core/live-presence.ts
export function resolveLivePresenceStoragePoint(input: { lat: number; lng: number; masked: boolean }): { lat: number; lng: number };
export function coarsenPresenceForViewer(marker: LivePresenceMarker, opts: { meetable: boolean }): LivePresenceMarker;
export function canMeet(marker: Pick<LivePresenceMarker, "isSelf" | "meetable" | "updatedAt">, nowMs?: number): boolean;

// modules/encounter/core/category.ts  新規
export const CATEGORY_VOCAB_VERSION = 1;
export const CATEGORY_IDS = [/* オーナー確定 */] as const;
export type CategoryId = (typeof CATEGORY_IDS)[number];
export const CATEGORY_LABELS: Record<CategoryId, string>;
export const MAX_PROFILE_CATEGORIES = 3;
export function isCategoryId(value: unknown): value is CategoryId;
export function parseCategories(raw: string | null | undefined): CategoryId[];
export function serializeCategories(ids: readonly string[], max: number): string;
export function sharedCategories(a: readonly string[], b: readonly string[]): CategoryId[];
export function categoryLabel(id: string): string;

// lib/home-location.ts  新規・クライアント専用・★h3/geo.ts を import しない
export const HOME_LOCATION_KEY = "@surechigai_home_location_v1";
export type HomeLocation = { lat: number; lng: number; accuracyM: number | null; savedAt: string };
export const HOME_LOCATION_MAX_ACCURACY_M = 500;
export function parseHomeLocation(raw: string | null): HomeLocation | null;
export function isAcceptableHomeAccuracy(accuracyM: number | null | undefined): boolean;
export async function readHomeLocation(): Promise<HomeLocation | null>;
export async function saveHomeLocation(input: { lat: number; lng: number; accuracyM: number | null }): Promise<HomeLocation>;
export async function clearHomeLocation(): Promise<void>;
```

### 4-3. API（tRPC）

```ts
// modules/encounter/api/settings.ts
setHomeMask: protectedProcedure.input(z.object({ latGrid: z.number(), lngGrid: z.number() })).mutation(...)
clearHomeMask: protectedProcedure.mutation(...)

// modules/encounter/api/presence.ts
setMeetable: protectedProcedure.input(z.object({ enabled: z.boolean() })).mutation(...)
  // enabled かつ homeMaskCell が無い → PRECONDITION_FAILED("先に自宅を登録してください")

// modules/encounter/api/encounter.ts
updateCategories: protectedProcedure.input(z.object({ categories: z.array(z.string().max(24)).max(3) })).mutation(...)

// modules/encounter/api/zukan.ts
updateLocationCategory: protectedProcedure.input(z.object({ locationId: z.number(), category: z.string().max(24).nullable() }))
```

### 4-4. 既存関数の変更

| 箇所 | 変更 |
|---|---|
| `queries.ts updateLivePresencePosition` | 保存前に `resolveLivePresenceStoragePoint` を通す |
| `queries.ts listLivePresenceForViewer` | select に `meetableEnabled` 追加。push 前に `coarsenPresenceForViewer`。型に `meetable` 追加 |
| `encounter.ts:178-180` | `shouldApplyInferredHomeMask(settings?.homeMaskSource)` が true のときだけ upsert |
| `settings.ts get` の既定オブジェクト | ★新列を足し忘れると tsc がユニオン型で落ちる |
| `post-authenticated-screen.tsx:40` | B-3 で `true` |

### 4-5. UI（★DESIGN.md を読んでから。新規画面なし）

| ファイル（新規） | 責務 |
|---|---|
| `hooks/use-home-location.ts` | ローカル保存＋`settings.setHomeMask` の再送 |
| `components/molecules/go-home-button.tsx` | 登録済み → 経路。未登録 → モーダル |
| `components/mypage/home-location-setup-modal.tsx` | 精度警告。★副作用の説明「自宅周辺の足あとは他の人に見えなくなります」 |
| `components/presence/meetable-now-list.tsx` | 行: アバター／名前／地名／○分前／「会いに行く」／X ボタン |
| `components/mypage/category-picker-modal.tsx` | `HitokotoModal` と同型 |
| `components/molecules/category-chips.tsx` | 表示専用 |

### 4-6. ★変更しないこと（境界）

- `listLivePresenceForViewer` の除外条件（停止／一時停止／鮮度／ブロック／masked skip）は **1行も緩めない**
- `NavigateToPlaceButton` の props は変えない
- `events.typeTags` はそのまま（別軸）
- `openExternalUrl` 許可リストは触らない

## 5. Testing Decisions（vitest・`__tests__/` に集約）

| ファイル | ケース名 |
|---|---|
| `__tests__/home-location.test.ts` | `parseHomeLocation は壊れたJSON/範囲外/NaN を null にする` ／ `isAcceptableHomeAccuracy は 500m 超を拒否` ／ `saveHomeLocation は savedAt を ISO で持つ` |
| `__tests__/client-bundle-no-h3.test.ts`（既存に追加） | `lib/home-location.ts と core/category.ts は geo.ts / h3-js を import しない` |
| `__tests__/home-mask.test.ts`（既存に追加） | `shouldApplyInferredHomeMask は declared のとき false` ／ `snapToGrid は geo.ts の toGrid と同じ値を返す` |
| `__tests__/live-presence.test.ts`（既存に追加） | `resolveLivePresenceStoragePoint は masked のとき 500m グリッド` ／ `coarsenPresenceForViewer は meetable でない他人を丸める` ／ `canMeet は updatedAt 6分前で false` |
| `__tests__/presence-meetable-precondition.test.ts` | `homeMaskCell が null なら PRECONDITION_FAILED` ／ `一時停止中なら拒否` ／ `両方満たせば通る` |
| `__tests__/category.test.ts` | `parseCategories は未知idを捨てる` ／ `serializeCategories は重複を除き max で切る` ／ `CATEGORY_IDS に other が無い` ／ `全 id に LABELS がある` |
| `__tests__/tap-target-min-height.test.ts`（既存） | `GoHomeButton` と `MeetableNowList` の行が 44px 以上 |

ランタイム検証（vitest では守れない・実施記録をコミットに残す）:

- Q3 のソーク手順（ローカル → 本番）
- ★PWA（iOS standalone）で `GoHomeButton` が実際に地図を開くこと（`window.open` が null を返す前例あり）
- B-1 反映後、DB で `livePresenceLat` が masked ユーザーについて丸められていること（SQL で実測）
- `pnpm check:a11y` を新規 UI を含むルートで実行

★**「壊して落ちるか」の確認**: `coarsenPresenceForViewer` の呼び出しを外したときにテストが赤になることを、採用前に1回確かめる。

## 6. Out of Scope

- カテゴリの自由入力・ユーザー提案語彙・「その他」
- アプリ内フォロー／フォロワー数／通知（「近くに同じ属性の人がいます」等）
- 自宅座標のサーバー保存・別端末同期・住所検索や手入力での自宅登録
- バックグラウンド位置取得・ジオフェンス
- アプリ内の経路描画（外部地図へ投げる既存方式のみ）
- 他人の足あとへの「ここへ向かう」／`/u/[slug]` 上の「会いに行く」CTA
- カテゴリ別のメモ集約・口コミ化（`place-info-DESIGN.md` の却下を維持）
- 集まり詳細ページ・新タブ
- ホーム画面ショートカット／ウィジェット／Siri での「自宅に帰る」
- 自宅マスクの k-ring 拡張（境界のセル跨ぎは既知の限界として残す）

## 7. Further Notes（実装時の地雷）

1. **新規ファイルは Decision Receipt が無いと `pnpm check` が落ちる**。`node scripts/record-decision-receipt.mjs --responsibility "..." --decision LOCAL --scope <path>` を新規ファイルごとに記録
2. **マイグレーションは `pnpm db:push` 不可**。`drizzle-kit generate` → `scripts/migrate.ts` → journal 手動 INSERT → `db-journal-doctor.cjs`
3. ★**クライアント側で h3 を import しない**。`geo.ts` を import すると h3-js がゲストバンドルに載る
4. **`settings.get` の既定オブジェクト**に新列を足し忘れると tsc が落ちる。★無理に `as` で黙らせない
5. `openMapsDirections` は URL に `label` を含めない。自宅の座標は外部地図に渡る（本人の端末 → 本人の地図アプリ）
6. `presence.list` は永続化されない。★この方針を維持（`meetable` 座標をキャッシュに残さない）
7. ★**レーダー再有効化は単独コミット**。混ぜるとソークで赤が出たとき切り分けられない
8. `app-routes.ts` の実在しないルート定数28件。新しい `navigate.toXxx` を使うなら実ファイルを確認
9. **自宅登録の副作用**: `homeMaskCell` が立つと共有軌跡・県別一覧の除外にも即効く。★モーダルで先に伝える
10. マスクは1セル（約460m）。境界付近だと隣セルで masked にならない（既知の限界）
11. チャンクが届かないときは `CDN_CACHE_EPOCH` +1
12. ★**ストアの位置情報文言は B のリリース前に更新**。`store-guard` を通す
13. `docs/` に置く仕様に impl 注記コメントを書かない（`verify-doc-impl-coverage.mjs` が実在を検査する）
14. **DESIGN.md**: 最重要コピー「会いたい君がいる現在地」。★文言は「会いに行く」で統一し「ナビ」「経路」を主語にしない

## 未解決の質問

1. ★**カテゴリの初期語彙**（最大12・「その他」なし）を何にするか。叩き台は Q1。**オーナー確定が要る**
2. 「自宅に帰る」ボタンの置き場所。DESIGN.md を読んだ上で実装者が決め、★実座標で報告する（置き場所を3回外した前例あり）
3. 会いに行ける相手の範囲。全ログインユーザーか `trailVisibility` の4段階に揃えるか（本仕様は前者で始める）
4. B-1 反映時に既存 masked 行を SQL で一括丸めするか、次の pulse に任せるか
5. `useAuth()` の戻りに `categories` が含まれるか（未確認）
6. Play Data safety の「Data shared」欄の要否（人手で再確認）

## ★司令塔による追加裏取り（Fable が「未確認」とした点の解決）

HOWTO「Fable が未確認とした論点も、司令塔が追加でコードを読めば解決できることがある」に従い、
実コードで確認した:

| Fable の未確認事項 | 裏取り結果 |
|---|---|
| `lib/get-current-location.ts` の現在地取得関数名 | ★**解決**: `getCurrentLocation(options?)` [:293] と `getCheckinLocation(options?)` [:299]。自宅登録は精度が要るので **`getCheckinLocation` を使う**（精度が収束するまで複数測位を競わせる既存ロジックに乗る） |
| `encounter.ts` の hitokoto 更新 mutation の名前 | ★**解決**: `updateHitokoto` [encounter.ts:526]。`updateCategories` はこの隣に、同じ形（`protectedProcedure` → 検証 → `requireDb()` → `db.update(users)` → `{ok:true}`）で置く |
| ソークスクリプトの実在 | ★**解決**: `scripts/auth-home-soak.mjs` 実在。`package.json:55` に `"soak:auth-home"` 登録済み |

⟹ 未解決の質問 #5（`useAuth()` に `categories` が含まれるか）は、
**`updateHitokoto` と同じ経路＝`users` テーブル直更新**なので、
表示側も hitokoto と同じ経路（`encounter.list` の `partnerHitokoto` [encounter.ts:463-469]）に
`partnerCategories` を足せばよい。★新しいクエリは要らない。

## 根拠のない断定（assumption list）

- 「自宅登録の精度上限 500m」は経験則。実測根拠なし
- 「レーダーの日本全図では 500m の丸めが視認できない」は式からの推定。実機目視は未実施
- 「`lookupCacheByDisplayNameFuzzy` の戻りに `twitterUsername` が含まれる」は使い方からの推定。型定義は未確認
- 「Play の Data safety の『共有』にユーザー間可視化は含まない」は一般理解。フォームで未確認
- 「`openMapsDirections` は iOS PWA でも動く」は既存4箇所が動いている前提からの推定。未実測
- ★「レーダー再有効化で OOM が再発しない」は真因が別と確定していることからの推定。**ソークで測るまで断定しない**
- ~~`lib/get-current-location.ts` の現在地取得関数名~~ → ★司令塔が確認済み（上表）
