# チェックイン再設計 SPEC — 確実・最速・楽しい

**作成:** Fable（claude-fable-5）/ 2026-07-04
**入力:** `docs/investigation/checkin-redesign-material-2026-07-04.md`（地雷マップは絶対制約）+ `DESIGN.md` + 実コード実読
（encounter.ts / get-current-location.ts / live-location-session.ts / geolocation-warmup.ts / geocoding.ts /
checkin-guards.ts / checkin-authenticated-screen.tsx / matching.ts / queries.ts / api/trpc/[trpc].ts / vercel.json /
sweep.yml / envelope-pulse.tsx / theme/tokens）
**読者:** 実装担当モデル。この SPEC だけで迷わず実装できることを目標に書いている。
**鉄則:** DESIGN.md と本 SPEC が矛盾したら DESIGN.md が勝つ。会議素材と本 SPEC が矛盾する箇所は本 SPEC が勝つ（捨てた理由は各所に明記済み）。

## ユーザー確認済みの確定事項（2026-07-04）

実装担当モデルはこれを前提として作業し、再質問しないこと。

1. **`@vercel/functions`（waitUntil）の依存追加は承認済み**（Phase 2 の前提。無料・Hobbyプラン利用可）。
2. **地図クリック補正は現行仕様を継続**（accuracy=8m として保存・マッチング参加。本人申告を高精度扱い）。
3. **モバイル測位は速さ優先バランスで承認**（即25m / 3秒80m / 6秒150m / 最大10秒カット、精度100m超は保存前レビューへ）。
4. **Vercel関数のコールドスタート対策（DBプーラ/リージョン最適化）は今回スコープ外**。将来の別タスク。
5. sweep GHA が `/api/sweep` を叩けていない疑いは**別タスクとして切り出し済み**（本SPECのスコープ外）。

---

## 1. 設計の核（1段落）

**「provisional な座標はサーバーに送らない。DB には確定した足あとしか書かない。速さはクライアントの測位戦略と
サーバーのクリティカルパス削減で作り、演出は測位待ちの隠蔽と保存成功の祝福だけに使う。」**
会議合意の「粗測位で即保存→後から confirm/PATCH」は**不採用**。理由: (a) 本製品の契約は「正確な lat/lng を保存し
永続化・共有・OGP に即時露出する」であり、粗い行を書いてから直す方式は汚染が外に漏れる窓を必ず作る、
(b) 再マッチング整合性（相手側封筒の矛盾）に答えがない、(c) DB スキーマ変更（Stop And Ask 事項）を要する、
(d) `encounter.checkIn` は IP毎 15秒1回のレート制限があり confirm 二段呼び出しと相性が悪い。
代わりに「段階的受理」は**クライアント内部の状態機械**として実装する — 観測（fix）は端末内で provisional →
accepted と昇格し、accepted になった座標だけが 1 回だけサーバーへ行く。守るもの: 正確な座標の永続保存、
h3R8+500mグリッドのマッチング互換、同日同ペア抑止、ブロック除外、acc>10000 サーバー拒否、位置許可はユーザー操作起点。
捨てるもの: PC の 45 秒待ち、geocode 2.5 秒のクリティカルパス直列、逐次 encounter INSERT、失敗時に測位結果を捨てる現行 UX。

---

## 2. 測位状態機械

### 2.1 fix（1つの測位サンプル）のライフサイクル

```
observed（watchPosition/expo-location から届いた生サンプル）
   │ ベスト更新判定（accuracy がより小さい）
   ▼
provisional（端末内のみ。地図に精度円つきで表示してよいが、サーバー送信・キャッシュ書込みは禁止）
   │ 受理ラダー（§3.3）を満たす
   ▼
accepted（送信候補として確定。アンカー補正 refineDesktopCheckinLocation 適用後の値）
   │ もしくは
pinned（レビュー画面でユーザーが地図クリックで指定。accuracy=8。現行 handleMapPinAdjust と同じ）
   ▼
sent → saved（サーバー 200 + locationId 受領。ここで初めて「確定した足あと」）
```

**規約（会議の批判への回答）:**

| 批判 | 本設計の回答 |
|------|-------------|
| 再マッチング整合性（粗→精でセルが変わる） | サーバー二段階を採用しないため発生しない。マッチングは常に accepted/pinned の確定座標で 1 回だけ実行。confirm/PATCH/再計算キューは作らない |
| 低精度データの汚染 | provisional は端末外に出ない。DB は確定行のみ → 軌跡・共有・OGP・マッチングの表示規約は現行のまま追加不要。`acc>10000` のサーバー拒否（`isAcceptableAccuracy`）は防衛線として**変更しない** |
| 楽観UIのロールバック | 「祝う演出」はサーバー 200 後のみ（§5.4）。200 以前は測位・記録の**進行演出**であり成功表示ではないので、ロールバックが発生しない。`saved:false` 応答は成功扱いせずエラー系（§6.3）へ |
| レース・二重チェックイン | 三重ガード: ①クライアント single-flight（`state==="loading"` 中は発火拒否・既存）②IP レート制限 15s/1回（`api/trpc/[trpc].ts` 既存・変更禁止）③サーバー自然キー冪等（§4.4） |

### 2.2 マッチング参加条件

- マッチングに参加するのは **saved になった確定座標のみ**（現行と同じ）。変更なし。
- pinned（accuracy=8 の手動指定）も現行仕様どおりマッチング参加する。この仕様の是非は Stop And Ask #4。

### 2.3 冪等キー

DB スキーマを触らずに冪等性を担保する。クライアント生成 UUID カラム案（会議）は**不採用**（カラム追加 = Stop And Ask、
かつ自然キーで同等の防御が可能なため）。

- **自然キー: `(userId, h3R8, recordedAt が直近 15 秒以内)`**。checkIn 冒頭の並列読み取りバッチ（§4.2）に
  「自ユーザーの直近 15 秒の location 行」取得を含め、同一 h3R8 の行が既にあれば INSERT せず
  `{ duplicate: true, locationId: 既存id, newEncounters: 0, ... }` を返す。
- 15 秒はレート制限窓と一致させる。429 をすり抜けた同時リクエスト（マルチタブ等）はこの自然キーで吸収。
- クライアントは `duplicate: true` を成功として扱う（「記録済みだよ」トーンの success 表示）。

---

## 3. クライアント測位設計

### 3.1 新モジュール `lib/checkin-location-session.ts`（新規作成）

45 秒待ちの `watchWebLocationBestSample` を置き換える。`lib/live-location-session.ts` の
「速いキャッシュ → watch → 500ms 後に高精度1発」パターンをチェックイン用に組み替える。

- `lib/get-current-location.ts` は**変更しない**（`getCheckinLocation` / `refineDesktopCheckinLocation` /
  `haversineMeters` / `isDesktopWeb` はエクスポート維持。純粋関数は新モジュールから import して再利用する）。
  `__tests__/get-current-location.test.ts` はユーザー未コミット差分で破損中のため**絶対に触らない**。
  新モジュールのテストは新ファイル `__tests__/checkin-location-session.test.ts` に書く。
- API 案:

```ts
export type CheckinFix = { lat: number; lng: number; accuracy?: number; observedAt: number };
export type CheckinLocationResult =
  | { kind: "accepted"; fix: CheckinFix }        // そのまま保存してよい
  | { kind: "review"; fix: CheckinFix };         // レビュー（保存前プレビュー）を挟む
export function acquireCheckinLocation(opts: {
  preciseAnchors: PreciseLocationAnchor[];
  prewarmedFix?: CheckinFix | null;              // §3.4 の事前測位
  onProgress?: (best: CheckinFix) => void;       // UI の精度カウンタ・地図更新用
  signal?: AbortSignal;                          // 画面離脱時に必ず中断
}): Promise<CheckinLocationResult>;
```

- 実装骨子（Web）: `getCurrentPosition(fast, maximumAge:300_000)` と `watchPosition(highAccuracy)` を同時に開始し、
  500ms 後に高精度 `getCurrentPosition` を 1 発（live-location-session と同型）。全サンプルを `onProgress` に流し、
  §3.3 のラダーで打ち切る。cleanup（clearWatch / clearTimeout）は resolve・reject・abort の全経路で必ず実行。
- Native: 逐次 2 回 GPS（`getNativeCheckinLocation` の retry）を廃止し、`Location.watchPositionAsync`
  （`Accuracy.High`）で同じラダーに統一。`requestForegroundPermissionsAsync` はボタン押下起点でのみ呼ぶ（地雷10）。

### 3.2 目標時間（設計目標。フェーズ完了条件に使う）

| 環境 | 押下→保存開始 | 押下→成功表示 |
|------|--------------|--------------|
| モバイル・事前測位ヒット（§3.4） | ≤0.3s | **≤1.5s** |
| モバイル・コールド | 中央値 2〜4s | p95 ≤12s（レビュー到達含む） |
| PC・高精度アンカーあり | ≤1s | ≤2s |
| PC・アンカーなし（Wi-Fi/IP測位） | — | **≤8s でレビュー画面提示**（保存はユーザーの1クリック後） |

現行の PC 最大 45 秒 / モバイル最大 22 秒待ちは全廃。

### 3.3 受理ラダー（妥協ルール）

サンプル到着毎 + 500ms ティックで評価。`best` = 最小 accuracy のサンプル（アンカー補正後）。

**モバイル Web / Native:**

| 条件 | 帰結 |
|------|------|
| いつでも acc ≤ 25m | 即 accepted |
| 経過 ≥3s かつ acc ≤ 80m | accepted |
| 経過 ≥6s かつ acc ≤ 150m | accepted |
| 経過 ≥10s（ハードカット）で acc ≤ 100m | accepted |
| ハードカットで 100m < acc ≤ 10000m | **review**（精度円を正直に見せて保存/再測位を選ばせる） |
| ハードカットで acc > 10000m またはサンプル0件 | エラー系 §6 |

**PC（isDesktopWeb）:**

| 条件 | 帰結 |
|------|------|
| いつでも（アンカー補正後）acc ≤ 35m | 即 accepted |
| 経過 ≥8s（ハードカット） | **review**（acc>10000 でも throw せずレビューへ。地図クリック修正が既定の回復手段） |

- `refineDesktopCheckinLocation`（既存アンカー補正）は各サンプル評価前に必ず適用。スマホで直近足あとがある PC は
  実質即 accepted になる（既存資産の最大活用）。
- 現行画面の `if (pos.accuracy > 10000) throw`（checkin-authenticated-screen.tsx L334）は**削除**し review へ流す。
  「PC の IP 測位 = 失敗」だった最大の失敗要因を「地図で1クリック修正」に変換する。サーバーの 10000m 拒否は残す
  （review を経ずに >10000 が送られることはクライアント上なくなる）。
- 会議の発散案「精度改善の見込み確率で早期妥協」はこのラダー（時間×精度の段階閾値）として簡略採用。
  確率モデルの実装は**過剰**なのでやらない。

### 3.4 事前測位（pre-positioning）— 体感1秒の主砲

- チェックイン画面が**フォーカスされている間だけ**、`navigator.permissions.query({ name: "geolocation" })` が
  `"granted"` の場合に限り、軽量ウォームセッション（live-location-session と同じ fast→watch→高精度1発、
  ただし **最長 12 秒で自動停止**）を回し、最新 best fix を ref に保持する。
- 押下時に `prewarmedFix`（age < 20s）があればラダー初期値として注入 → 閾値を既に満たしていれば
  **測位待ちゼロで即 saving へ**。これが「押下→成功 1.5 秒」の実現手段。
- `"prompt"` / `"denied"` では何もしない（勝手に権限プロンプトを出さない — 地雷10・過去設計判断の踏襲）。
  `navigator.permissions` 非対応ブラウザ（Safari 15 系）はウォームセッションをスキップし、既存の
  `warmGeolocationCache()`（query-auth-sync.tsx で発火済み）だけに任せる。
- **必ず** `useFocusEffect` で開始/停止する。expo-router の Tabs はタブ切替でアンマウントしないため、
  blur で watch を止めないと常駐する（地雷6 と同種の常駐リスク）。Native では実装しない（バッテリー配慮、Web のみ）。

### 3.5 測位結果の保持（失敗時に捨てない）

現行はエラー後 4 秒で idle に戻り測位結果を破棄する。改め、直近の accepted/pinned fix を
`lastFixRef`（observedAt 付き）に保持し、リトライ時は **age < 60s なら再測位せずそのまま再送**する（§6.3）。

---

## 4. サーバー設計（encounter.checkIn）

### 4.1 クリティカルパスに残すもの / 外すもの

| 処理 | 現行 | 新設計 |
|------|------|--------|
| 入力検証（acc>10000 拒否・座標検証） | 同期 | **残す**（変更なし） |
| getUserSettings（pause 判定） | 同期 | 残す（並列バッチへ統合） |
| reverseGeocodeWithTimeout | **2.5s 直列** | **600ms レース**。間に合えば同期返却、間に合わなければ応答後バックフィル（§4.3） |
| insertLocation + upsertVisitedArea | 同期並列 | 残す（変更なし） |
| homeMaskCell 更新 | fire-and-forget | `runAfterResponse`（§4.3）へ移す |
| マッチング読み取り4本 | insert 後に並列 | **冒頭の並列読みバッチへ統合**（insert と依存関係がない） |
| insertEncounterIfNew | **逐次ループ** | **1回の multi-row INSERT（onConflictDoNothing）** に変更 |

**マッチングと newEncounters は同期のまま返す**（会議の「マッチング非同期化」は**不採用**）。理由:
(a) すれ違い件数はチェックイン体験の報酬の核であり、応答に載せないとポーリング/プッシュ基盤が必要になる、
(b) 上記統合後のマッチングコストは並列読み 1 バッチ + INSERT 1 回で済み、非同期化の利得が小さい、
(c) 非同期化すると「相手側だけ封筒がある」時間窓と再送時の重複管理が生まれ、批判1の罠に自分から入る。

**新しい往復構成（ウォーム時 DB 2〜3 往復）:**

```
① 並列読みバッチ（1往復）: getUserSettings / getNearbyCandidates / getTimeshiftCandidates
   / getBlockSet / getTodayPairSet / getLatestLocationSince(userId, 15s)   ← §2.3 冪等チェック用（新設）
   （+ 並行して geocode 600ms レース。DB ではなく Nominatim/キャッシュ）
② pause 判定・冪等判定（読み取り結果で早期 return。書込み前なので契約どおり「停止中は記録しない」）
③ 並列書きバッチ（1往復）: insertLocation + upsertVisitedArea
④ findMatches（純関数・変更禁止）→ マッチ0件なら省略 / あれば insertEncountersBatch（1往復）
⑤ 応答 → runAfterResponse でバックフィル（§4.3）
```

推定応答時間: ウォーム 0.4〜0.9s（現行は geocode 2.5s + 5〜6 往復直列で 3〜5s 級）。コールドスタートは
+1〜2s 残るが本 SPEC のスコープ外（質問リスト参照）。

### 4.2 queries.ts への追加（スキーマ変更なし）

- `getLatestLocationSince(db, userId, sinceMs)` — 直近 sinceMs 以内の自分の location 1 行（id, h3R8, recordedAt）。
- `insertEncountersBatch(db, params[])` — `insertEncounterIfNew` の multi-row 版。`onConflictDoNothing` +
  `returning({ id })` で挿入できた行数と id 一覧を返す（バックフィル対象の特定に使う）。
  既存 `insertEncounterIfNew` は他所で使われていなければ残置でよい（削除は任意）。
- `backfillCheckinGeodata(db, { locationId, h3R7, userId, encounterIds, geocode })` — UPDATE 3 本:
  - `locations SET municipality/prefecture/address WHERE id=locationId AND municipality IS NULL`
  - `visitedAreas SET municipality=COALESCE(municipality,□), prefecture=COALESCE(prefecture,□) WHERE userId+h3R7`
  - `encounters SET areaName=□, prefecture=□ WHERE id IN (encounterIds) AND areaName IS NULL`

### 4.3 非同期実行基盤: `waitUntil`（応答後処理）を選定

- 実装: `server/_core/after-response.ts` を新設。`runAfterResponse(promise)` は
  `@vercel/functions` の `waitUntil` があればそれを使い、無ければ（ローカル Express / テスト）
  fire-and-forget + `catch(console.error)` にフォールバック。既存 checkIn の homeMaskCell
  fire-and-forget もこれに載せ替える。
- **選定理由:**
  - **sweep GHA は不採用**: `.github/workflows/sweep.yml` は `/api/sweep` を叩くが、Vercel の `api/` に
    sweep 関数は**存在しない**（Express 側 `server/_core/index.ts` にのみ実装がある）。つまり現構成で
    Vercel 本番の sweep が動いている保証がなく、これを基盤に選ぶのは砂上の楼閣（現状調査は Stop And Ask #5）。
    また 15 分粒度では「成功画面にエリア名を出す」用途に遅すぎる。
  - **次回リクエスト lazy は補助線として採用**: `zukan.myTrail` 等の読み取り時に municipality NULL の
    直近行があれば geocode を lazy 補完…は**やらない**（読み取りパスを重くし Nominatim 呼び出し頻度が
    読み取り回数に比例して増える恐れ = 地雷8）。lazy は使わない。waitUntil 一本。
  - waitUntil は Vercel Node.js Functions（Hobby 含む）で利用可・追加コストなし（実行時間は
    `maxDuration: 30` 内。geocode は 8s abort 済みで収まる）。
- **Nominatim 頻度は増えない**ことの担保: 600ms レースで負けた場合も**同一の** `reverseGeocode` Promise を
  waitUntil に引き継ぐ（`reverseGeocodeWithTimeout` の Promise.race は元 Promise を中断しないので、
  checkIn 側で `const geocodePromise = reverseGeocode(lat,lng)` を 1 回だけ生成し、レースとバックフィルで共有する
  実装にする）。リクエスト数は現行と同じ 1 回/チェックイン。throttle・429 クールダウン・キャッシュは無変更。
- `@vercel/functions` は新規依存。導入自体は許可するが、**デプロイ後に本番チェックインの実測ログで
  バックフィルが完走していること（locations.municipality が数秒内に埋まる）を確認するまで Phase 2 完了としない**。

### 4.4 checkIn 応答スキーマ（後方互換）

既存フィールドは全部残す（クライアント旧バージョン互換）。追加のみ:

```ts
{
  newEncounters, prefecture, municipality, areaName, address, lat, lng, locationId,  // 既存
  saved?: boolean,          // 既存（INSERT失敗時 false）
  duplicate?: boolean,      // 新規: 冪等ヒット時 true
  geoPending?: boolean,     // 新規: geocode がレースに負け、バックフィル中のとき true
}
```

`geoPending: true` のとき municipality/prefecture/areaName/address は null。クライアントは §5.5 のとおり
後追い表示する。

---

## 5. UIUX設計 — 「押したくなる」チェックイン

前提: DESIGN.md 遵守（最重要コピー「会いたい君がいる現在地」/ ライト UI / radar・scan・pin モチーフ /
カード入れ子禁止 / `theme/tokens` 使用・`#RRGGBB` 直書きは palette.ts へ）。
アニメは全て `envelope-pulse.tsx` の作法: `useReducedMotion` で静的表現へ、`animate` prop、
cleanup で `cancelAnimation` 必須、タブ非フォーカスで停止（`useFocusEffect`）。

### 5.1 タイムライン（押下からの体験設計）

| 時刻 | 何が起きるか |
|------|-------------|
| 0–100ms | 押下スケールスプリング（既存）+ ハプティクス（既存）。ボタンは即「探しています」表示へ。**視覚応答 0.1 秒以内はここで担保** |
| 100ms–1s | **レーダースキャン演出**（§5.2）開始。最初の provisional fix が来たら即、地図に淡いピン + 精度円を表示（1 秒以内に「もう位置は見えている」体験） |
| 〜受理 | 精度カウンタが「±480m → ±62m → ±18m」と縮む（等幅数字 `fontVariant: tabular-nums`、DESIGN.md の「座標は monospace」規約）。**待ち時間の隠蔽はこの「精度が良くなっていく実況」で行う** — 嘘の進捗バーは使わない |
| 受理→保存 | ボタン文言「足あとを刻んでいます…」。精度円がキュッと縮んでピンに収束するモーション（map pin focus モチーフ） |
| 200 受領 | **祝福**（§5.4）: スタンプ押印アニメ 600ms + エリア名 + すれ違い件数。ここまでモバイル・ウォームで合計 ≤1.5s |

### 5.2 測位中の演出（radar sweep）

- 現行の pulseRing（ボタン周囲の無限パルス）を、地図上の**現在地候補ピンを中心にしたレーダーパルス**
  （EnvelopePulse と同じ実装パターン: withRepeat + withTiming、色は `color.accentPrimary` ネイビー系）に置き換える。
  地図がまだ無い最初の数百 ms はボタン内のスキャンライン（左→右の細い光、`withRepeat`）でつなぐ。
- 実装は新 molecule `components/molecules/checkin-radar-pulse.tsx`。`animate` prop / `useReducedMotion` /
  cleanup / フォーカス停止を EnvelopePulse から踏襲（コピペ元として明記: components/molecules/envelope-pulse.tsx）。
- reduced-motion 時: パルスなし・静的リング + 精度カウンタのテキスト更新のみ（テキスト更新はアニメではないので可）。

### 5.3 文言（コピー案 — 「会いたい君がいる現在地」の世界観）

| 状態 | 文言 |
|------|------|
| idle ボタン | `現在地を記録する`（現行維持。DESIGN.md の推奨コピー） |
| 測位中（モバイル） | `君のいる現在地を探しています…` + `±38m` カウンタ |
| 測位中（PC） | `現在地を探しています…（PCは数秒かかります）` ← 「最大45秒」文言は廃止 |
| 保存中 | `足あとを刻んでいます…` |
| review 見出し | `この場所で合ってる？` |
| review 保存ボタン | `この場所に足あとを残す`（DESIGN.md 推奨コピー） |
| review 副文（PC） | `PCの測位はズレやすいです。地図をクリックして直せます`（現行文言を短縮） |
| review 副文（モバイル低精度） | `精度 ±340m。このまま残すか、もう一度測れます` |
| 成功（すれ違い0） | `足あとを残しました` + 場所名。副文 `この現在地は、あとでたどれる正確な場所として残ります` |
| 成功（N件） | `N件のすれ違い！`（現行維持）+ 封筒導線 |
| duplicate | `さっき記録したばかりです` + 直近足あとの場所名 |
| 429 | `連続チェックインは15秒あけてね（あと◯秒）` ← Retry-After 秒でカウントダウン |
| エリア名待ち | `エリア名を調べています…`（シマー 1 行。座標と地図ピンは即時表示済み） |

### 5.4 成功の祝福と接続（封筒・エリア名・切手帳）

- **祝福はサーバー 200 後のみ**（§2.1 の規約）。演出は 800ms 以内で完結させ「過剰演出で遅く感じさせない」
  （批判5）: 切手（スタンプ）が地図の上にポンと押される 1 回きりのスプリング（withSequence、無限ループ禁止）+
  Native はハプティクス Success（既存）。紙吹雪・全画面オーバーレイは作らない。
- すれ違い N>0: 既存 CheckinSuccessPanel の件数表示に、封筒アイコンの単発パルス（EnvelopePulse の
  press 演出を 1 回だけ再生する静的版）を追加し、`すれ違いを確認` で encounter list へ。
- 切手帳接続: 成功パネルに `切手帳に追加されました → 見る` の 1 行導線（zukan タブへ navigate）。
  **今回の訪問が新エリア（visitedAreas 新規）かどうかはサーバー応答に含まれない** — 追加フィールドを
  増やしたくなるが、Phase 3 では「切手帳を見る」導線のみとし、「NEW エリア！」判定は
  upsertVisitedArea の挿入/更新判別を返す小改修（応答フィールド `newArea?: boolean` 追加）として
  Phase 3 内の任意項目にする（スキーマ変更ではないので Stop And Ask 不要）。
- 楽観キャッシュ反映（myTrail / myAreas / mySignal への setData）は現行実装を維持（200 後なので安全）。

### 5.5 エリア名の後追い表示（geoPending）

- `geoPending: true` の成功時: 場所名行をシマー表示にし、**1.5 秒後と 4 秒後の最大 2 回**
  `zukan.myTrail.invalidate()`（limit:1 の再取得で十分）→ municipality が埋まっていれば差し替え。
  2 回で埋まらなければ `場所を記録しました（エリア名はあとで表示されます）` に確定させ、ポーリングを止める。
  無限ポーリング禁止。タイマーは cleanup 必須。

### 5.6 review（保存前プレビュー）の再定義

- 既存 adjust 状態（CheckinPreviewCard・地図クリック補正・再測位）を土台に、名称を review に統一。
- モバイルにも開放する（現行は `mapInteractive` が PC 限定）: モバイルは地図クリック補正なしでも
  「このまま残す / もう一度測る」の 2 択 + 正直な精度円表示。地図タップ補正のモバイル開放は任意
  （誤タップリスクがあるため既定 OFF でよい）。
- review へ入る条件は §3.3 のラダーのみ。**エラーではなく通常フローの一部**として扱う（失敗の飲み込み §6.2）。

---

## 6. 失敗の飲み込み方（3系統）

### 6.1 権限拒否

- 検出: Web は GeolocationPositionError.code===1 / permissions API。Native は `status !== "granted"`。
- UX: エラー赤ではなく**案内トーン**のシート（PostLoginLocationIntro と同じ組版）:
  `位置情報が許可されていません。許可すると、この場所を「あとで行ける精度」で残せます` +
  プラットフォーム別の 1 行手順（Web: `アドレスバーの位置情報アイコンから許可できます` / iOS・Android: 設定導線）。
- 再試行ボタンは常設。**自動で再プロンプトはしない**（地雷10）。ボタンは idle に戻す（4 秒自動復帰は廃止し、
  ユーザー操作で戻る）。

### 6.2 低精度

- 「失敗」から「review フロー」へ降格（§3.3 / §5.6）。acc>10000 の PC IP 測位もクライアントでは
  throw せず review へ。ユーザーが地図クリック（pinned, acc=8）するか、スマホ経由アンカーで解決。
- review で何もせず保存を押した場合: acc ≤10000 ならそのままの正直な accuracy で保存（accuracy を
  詐称しない）。acc >10000 のままなら保存ボタンを disabled にし
  `この精度では残せません。地図をクリックして位置を指定してください` を表示（サーバー拒否と整合）。

### 6.3 圏外・サーバーエラー

- **座標を捨てない**が原則（§3.5）。エラー画面に「もう一度送る」ボタンを置き、lastFix の age<60s なら
  **再測位せず同じ座標を再送**（測位待ちの二重払いをなくす）。age≥60s なら再測位からやり直す
  （recordedAt はサーバー時刻なので、古い座標の再送は「現在地」の真実性を壊す — 60 秒が許容上限）。
- 再送前に必ず `zukan.myTrail` を 1 回 refetch し、**直近 60 秒に足あとが増えていたら「実は成功していた」**
  と判定して成功系へ合流（応答ロスト時の二重登録防止。サーバー側自然キー §2.3 との二段防御）。
- 429: Retry-After を読んでボタンにカウントダウン表示（§5.3）。カウント中は disabled。自動再送はしない。
- `saved: false`（INSERT 失敗）応答: 現行はエリア名だけ出て曖昧 — 明示的にエラー系へ回し「もう一度送る」導線を出す。
- **オフライン持ち越しキュー（会議の UUID付きFIFO）は不採用**: recordedAt はサーバー時刻であり、
  10 分後に自動再送された「現在地」は嘘の足あとになる。核の価値（正確な足あと）に反するため、
  リトライは 60 秒以内の手動 1 回に限定する。

---

## 7. 実装フェーズ分割

> 共通ゲート（全フェーズ）: `pnpm check` 0 エラー / `__tests__/encounter-core.test.ts` 71 件 +
> checkin-guards テスト全通過（挙動契約の安全網。**これらのテストを書き換える変更は契約違反のサイン**）/
> `__tests__/get-current-location.test.ts` は**触らない**（破損中・新テストは別ファイル）/
> UI に触れたフェーズは本番ビルド + 凍結プローブ（地雷9: 7/1 の全面障害の教訓）+ qa:doctor /
> CLAUDE.md ディレクティブ4 に従い各フェーズごとにデプロイ + version.json 確認。

### Phase 1 — クライアント測位の高速化（効果最大・リスク小・サーバー無変更）

1. `lib/checkin-location-session.ts` 新規作成（§3.1〜3.3 の受理ラダー、アンカー補正再利用、cleanup 完備）。
2. checkin-authenticated-screen.tsx の `performLocateAndCheckin` を新モジュールへ差し替え。
   L334 の `>10000 throw` を review 遷移に変更。エラー時 4 秒自動復帰を廃止し lastFix 保持（§3.5, §6.3 の再送含む）。
3. 事前測位（§3.4）: granted 時のみ・フォーカス中のみ・12 秒自動停止のウォームセッション。
4. 文言差し替え（「最大45秒」の削除、§5.3 の測位中・review 文言）。
- **検証:** 新規 `__tests__/checkin-location-session.test.ts`（ラダー閾値・タイムアウト・アンカー補正・abort cleanup を
  フェイクタイマーで）/ encounter-core 71 件通過（触っていないので当然通る）/ qa:doctor / 本番ビルド + 凍結プローブ
  （watch 常駐が残らないこと: フォーカス外で `clearWatch` が呼ばれるのを手動 or e2e で確認）。
- **完了条件:** PC でアンカーなし 8 秒以内に review 提示・45 秒待ちの経路が存在しない。モバイル実機
  （または qa:doctor の geolocation モック）で押下→保存開始が §3.2 の目標内。

### Phase 2 — サーバー応答の高速化（geocode 非同期化・往復削減・冪等）

1. `server/_core/after-response.ts`（waitUntil ラッパー）+ `@vercel/functions` 依存追加。
2. encounter.ts の checkIn を §4.1 の往復構成に再編（読み 1 バッチ → 書き 1 バッチ → encounters バッチ 1 回）。
   geocode 600ms レース + 共有 Promise バックフィル（§4.3）。homeMaskCell 更新を runAfterResponse へ。
3. queries.ts に `getLatestLocationSince` / `insertEncountersBatch` / `backfillCheckinGeodata` 追加（§4.2）。
4. 応答フィールド `duplicate` / `geoPending` 追加（§4.4）。
- **検証:** encounter-core 71 件 + checkin-guards **無修正で**全通過（findMatches・ガード関数は触らない）/
  新規 `__tests__/checkin-server-flow.test.ts`（冪等ヒット・pause 早期 return・バッチ INSERT の件数・
  バックフィル UPDATE の対象条件）/ デプロイ後、本番で実チェックインし
  (a) 応答時間ログ（api/trpc の durationMs warn が 2s 未満に収まる）(b) locations.municipality が
  数秒内に埋まる（`scripts/check-db-columns.cjs` 系の照会 or SQL）を確認。
- **完了条件:** ウォーム応答 p50 < 1s（Vercel ログ実測）・geoPending 発生時もバックフィル完走・
  旧クライアント（デプロイ跨ぎ）が壊れない（フィールド追加のみで削除なし）。

### Phase 3 — 楽しさの演出（radar・祝福・後追いエリア名・接続導線）

1. `components/molecules/checkin-radar-pulse.tsx` 新設（§5.2、EnvelopePulse 作法踏襲）。精度カウンタ表示。
2. 成功スタンプ演出（単発 600ms）・封筒単発パルス・切手帳導線（§5.4）。任意: `newArea` フィールド追加。
3. geoPending シマー + 最大 2 回の後追い取得（§5.5）。429 カウントダウン・duplicate 表示（§5.3）。
4. モバイル review の 2 択開放（§5.6）。
- **検証:** DESIGN.md Anti-Slop Checklist を明示的に確認（特に「正確な場所が見える」「文字切れ」「余白密度」）/
  reduced-motion で全アニメが静的表現になること / タブ切替でアニメ・タイマーが止まること（地雷6）/
  本番ビルド + 凍結プローブ（アニメ追加フェーズなので必須）/ qa:doctor。
- **完了条件:** 押下 0.1s 以内に視覚応答・成功演出 800ms 以内・無限ループアニメが測位中以外に存在しない・
  ポーリングが最大 2 回で必ず停止する。

---

## 8. Stop And Ask リスト（実装モデルはユーザー確認なしに進めるな）

1. **DB スキーマ変更全般**（本 SPEC は不要な設計にしてある。実装中に必要と感じたら、それは設計からの逸脱 — 停止して確認）。
2. **checkIn 応答から既存フィールドを削除する・意味を変える**変更（追加のみ許可）。
3. **`api/trpc/[trpc].ts` のレート制限ルール変更**（15s/1回の緩和・強化とも）。
4. **pinned（地図クリック, accuracy=8）保存のマッチング参加**を制限したくなった場合
   （現行挙動の変更 = 位置偽装対策の領域に踏み込むため。§9 参照）。
5. **sweep 基盤の修理**: `/api/sweep` が Vercel に存在しない疑い（Express 実装のみ・GHA が 404 の可能性）。
   調査・修理はチェックイン再設計と独立した作業として、着手前にユーザーへ報告して指示を仰ぐ。
6. **位置情報許可フローの変更**（自動プロンプト化・granted 判定以外でのウォーム開始）。
7. **Nominatim の呼び出し頻度が増える一切の変更**（プロバイダ変更・クライアント直呼びを含む）。
8. **Vercel の関数リージョン変更・Fluid compute 等のインフラ設定変更**（コールドスタート対策をやりたくなっても）。

## 9. やらないことリスト（スコープ外）

- **位置偽装対策**（pinned acc=8 の悪用検知、速度異常検知等）— 既知の未対策領域として据え置き。
- **オフライン持ち越しキュー**（§6.3 で理由つき却下: recordedAt の真実性）。
- **サーバー側 provisional 保存 / confirm PATCH / 再マッチングキュー**（§1 で理由つき却下）。
- **マッチング結果のプッシュ通知**（応答同期返却で不要）。
- **visitedAreas 更新のバッチ化（会議発散案）**— upsert 1 回は既に並列であり効果薄。
- **Nominatim の代替ジオコーダ移行・キャッシュの永続化（DB化）**。
- **DB リージョン移設・接続プーラ導入等のコールドスタート根治**（質問リストで方針だけ確認）。
- **live-location-session.ts / geolocation-warmup.ts 自体の改変**（読むだけ・パターン流用のみ。ライブ位置共有を壊さない）。
- **認証フロー（use-auth / Clerk Satellite / oauth）とゲスト `/` の tRPC defer 境界**（地雷7 — 一切触らない）。
- `__tests__/get-current-location.test.ts` の修正・削除（地雷3）。

---

## 付録A: 触ってよいファイル / 触るなファイル

| 区分 | ファイル |
|------|---------|
| 新規 | `lib/checkin-location-session.ts` / `server/_core/after-response.ts` / `components/molecules/checkin-radar-pulse.tsx` / `__tests__/checkin-location-session.test.ts` / `__tests__/checkin-server-flow.test.ts` |
| 変更 | `components/checkin/checkin-authenticated-screen.tsx` / `components/checkin/checkin-preview-card.tsx` / `components/checkin/checkin-success-panel.tsx` / `modules/encounter/api/encounter.ts` / `modules/encounter/db/queries.ts`（追加のみ）/ `package.json`（@vercel/functions） |
| 読むだけ | `lib/get-current-location.ts`（純関数 import は可・本体変更禁止）/ `lib/live-location-session.ts` / `lib/geolocation-warmup.ts` / `modules/encounter/core/*`（matching.ts / checkin-guards.ts / geocoding.ts のロジック変更禁止。geocoding は §4.3 の「共有 Promise」利用のため `reverseGeocode` を直接 import してよい） |
| 禁止 | `__tests__/get-current-location.test.ts` / `__tests__/encounter-core.test.ts`（通すもの。書き換え禁止）/ 認証系 / `api/trpc/[trpc].ts` のレート制限 / drizzle/schema |

## 付録B: 会議提案の採否一覧

| 会議の提案 | 採否 | 根拠 |
|-----------|------|------|
| 段階的受理（provisional 即保存→confirm） | クライアント内状態機械として**形を変えて採用**、サーバー二段階は**却下** | §1, §2 |
| geocode の非同期化 | **採用**（600ms レース + waitUntil バックフィル） | §4.3 |
| マッチングの非同期化 | **却下** | §4.1 |
| 楽観UI（押下瞬間の成功表示） | **縮小採用**（進行演出は即時・祝福は200後） | §2.1, §5.4 |
| オフライン/リトライキュー（UUID FIFO） | **却下**（60秒以内の手動再送のみ） | §6.3 |
| 精度改善見込み確率での早期妥協 | 時間×精度ラダーとして**簡略採用** | §3.3 |
| 高精度履歴クラスタリング補正 | **却下**（既存アンカー補正で足りる。一般化は過剰） | §3.3 |
| visitedAreas バッチ化 | **却下** | §9 |
