# 実装ハンドオフ: 写真から思い出をとりこむ（v1.1 MVP）

> **この1枚だけで着手できる粒度で書いてある。** 設計の全文は
> `docs/photo-import-and-viral-DESIGN.md`（設計=Fable / 裏取り=司令塔 / 2026-08-14）。
> 実装は別モデル／次チャットで行う。

## 0. 読む順

1. このファイル（全部）
2. `docs/photo-import-and-viral-DESIGN.md` の **C章（具体機構）と D章（失敗系）** — ここが実装の本体
3. `CLAUDE.md`（ディレクティブ1: tsc必須 / 1.5: UI変更前に DESIGN.md）
4. 触る既存ファイルだけ実物を読む（下の「触るファイル」参照）

## 1. スコープ（MVPだけ。これ以外やらない）

**「写真から思い出をとりこむ」画面1本**。写真は**保存しない**。EXIF から座標と撮影時刻だけ取り、
過去日付の足あと（`visibility: "private"`）として保存し、図鑑（visitedAreas）を埋める。

やらないこと（設計 F章で意図的に捨てた。勝手に足さない）:
- 画像のアップロード・保存（ストレージ導入は禁止）
- 新しい OGP バリアント
- シェアしたら報酬、の類（X Web Intent は投稿完了を検知できない＝検証不能）
- `expo-image-picker` / `expo-media-library`（ネイティブ権限が増える。v1.2）
- `locations.visibility` の既定変更（既に public で稼働中。写真由来だけ手続き側で private を渡す）
- `importFootprints` でのすれ違いマッチング実行

## 2. 着手手順

```bash
git checkout -b feat/photo-import
```

TDD で進める。**テストは「バグを再導入したら落ちる」ことを必ず確認すること**
（このリポジトリは過去に「grepで書いたテストが許可リストを外しても緑のまま」だった実績がある）。

### 手順1: 依存を1つだけ追加
```bash
pnpm add exifr
```
`exifr@7.1.3` は **dependencies が空＝純JS**。ネイティブモジュールを持たないので autolinking 対象外＝
ストア権限申告は増えない（司令塔が `npm view` で裏取り済み）。**これ以外の依存を足さないこと。**

### 手順2: スキーマ＋マイグレーション（4罠に注意）
`drizzle/schema/encounter.ts` の `locations` に追加:
```ts
/** 足あとの由来: checkin=リアルタイムチェックイン / photo=写真EXIF / manual=手動指定 */
source: varchar("source", { length: 16 }).default("checkin").notNull(),
```
罠（過去に全部踏んでいる）:
- **`pnpm db:push` は使わない**
- `drizzle-kit` は `drizzle/schema/index.drizzle-kit.ts` を見る → そちらにも export が要る
- `migrate.ts` は env を自前で読まない → 環境変数を外から与えて実行する
- migrate 後に **journal への手動追記**が要る

生成される SQL は実質これ1行:
```sql
ALTER TABLE "locations" ADD COLUMN "source" varchar(16) NOT NULL DEFAULT 'checkin';
```

### 手順3: EXIF 解析（`lib/photo-exif.ts` 新規）
設計 C-2 のシグネチャどおり。要点:
- `exifr` は **イベントハンドラ内で `await import("exifr")`**。
  render パスで動的 import チャンクを直接描画しない（React19 無限再レンダリング OOM の実績あり）
- `previewUrl` は `URL.createObjectURL`。**unmount と差し替えで `revokeObjectURL`**
- 1枚の失敗が全体を壊さないよう **try/catch はカード単位**

### 手順4: tRPC 手続き（`modules/encounter/api/encounter.ts` に追加）
**新ルーターを作らない**（`server/routers/index.ts` の登録漏れ事故を構造的に回避）。
設計 C-3 の1〜8をそのまま実装。特に:
- `recordedAt` は **epoch ms の number で受ける**（Date 直渡しは生SQL地雷の実績あり）
- 逆ジオコーディングは**ユニークセル単位**でまとめ、**総予算6秒で打ち切り**
- 重複判定: 同 userId・同 h3R8・±60分・`deletedAt IS NULL`
- **マッチングは呼ばない**
- 返り値は肯定形: `{ imported, skippedDuplicates, rejected, newAreas }`

再利用する既存関数（**全て実在を確認済み**）:
`assertFiniteLatLng` / `toGrid` / `toH3Cell` / `toH3ParentCell` / `toH3R7` /
`reverseGeocodeWithTimeout` / `upsertVisitedArea`

### 手順5: 画面（`app/photo-import.tsx` ＋ `components/photo-import/`）
設計 A の 1〜5。**UI を書く前に `DESIGN.md` を読む**（ディレクティブ1.5）。
- 「写真そのものは送信されません」を画面に明記する（これがこの機能の一番の売り）
- 位置が取れなかった写真 → **地図タップ＋日付入力の手動指定**。
  **ここは切ってはいけない**（EXIF ゼロでも機能が成立することの担保）
- ネイティブでは `Platform.OS` ガードで「アプリ版で近日対応」表示（落とさない）

### 手順6: 表示の小改修
- `modules/encounter/db/queries.ts` の `getMyTrailLocations` の select に `source` 追加
- `components/organisms/precision-tile-map.tsx`: `source !== "checkin"` にカメラ印
- `components/map/footprint-sheet.tsx`: 「写真からの思い出」ラベル1行

### 手順7: シェア配線（新規実装ほぼゼロ）
`prepareSharePopup()` → `getOrCreateShareSlug` → **`await warmOgImageNow(...)`** → intent 差し替え。
**URL を自前で組み立てない**（1文字違うと別キャッシュキーになりウォームが無意味になる。実績2回）。

## 3. 完了判定（機械的に）

```bash
pnpm check          # tsc 0 エラー（ディレクティブ1）
pnpm test           # 全通過。追加テストが「壊したら落ちる」ことも確認済みであること
node scripts/lint-pre-submission.mjs   # 出荷ゲート（CHECK 9 で dev 依存混入も見る）
```

加えて手動確認:
- [ ] GPS 付き写真 → 足あとが増える／図鑑に街が増える
- [ ] **GPS 無し写真だけ** → 手動指定で足あとを作れる（機能が成立する）
- [ ] 同じ写真を2回とりこむ → `skippedDuplicates` が増え、二重に増えない
- [ ] とりこんだ足あとは **private**（他人の県別一覧に出ない）
- [ ] 写真がネットワークに出ていない（DevTools の Network で確認）

## 4. 地雷（設計 G章の要点。全部このリポジトリで実際に踏んだもの）

| 地雷 | 回避 |
|---|---|
| 依存追加で権限混入（expo-audio / expo-dev-client で起動クラッシュ） | 追加は純JSの `exifr` のみ。ネイティブモジュール持ちを足さない |
| DBマイグレーション4罠 | 手順2に明記。`db:push` 禁止・journal 手動追記 |
| ルーター登録漏れ | 新ルーターを作らず `encounterRouter` に追加 |
| OGPウォーム不一致（2回事故） | 新バリアントを作らない。URL を加工しない |
| 動的importチャンク直接描画 → OOM | `exifr` の import はハンドラ内のみ。描画に使わない |
| Date 直渡しで 500（encounter.list の実績） | epoch ms で受けてサーバーで Date 化。生SQLに埋めない |
| CDNチャンクキャッシュ（version.json一致≠反映） | `precision-tile-map` を触るのでマーカー文字列 grep で反映確認 |

## 5. 転記元の実在パス一覧（司令塔が確認済み）

```
app/(tabs)/map.tsx
components/map/footprint-sheet.tsx
components/checkin/checkin-success-panel.tsx
components/organisms/precision-tile-map.tsx
lib/lazy-heavy-components.tsx
modules/encounter/api/encounter.ts        # checkIn / list / open / react / updateHitokoto
modules/encounter/api/zukan.ts            # myTrail
modules/encounter/db/queries.ts           # getMyTrailLocations / upsertVisitedArea
drizzle/schema/encounter.ts               # locations / visitedAreas
hooks/use-warm-og-image.ts                # warmOgImageNow（シェア前に待つ）
lib/share.ts                              # prepareSharePopup / withShareTimeout
```

新規作成するもの:
```
lib/photo-exif.ts
app/photo-import.tsx
components/photo-import/photo-import-screen.tsx
components/photo-import/import-success-panel.tsx
__tests__/photo-exif.test.ts              # 少なくとも「GPS無しでも壊れない」を固定
```
