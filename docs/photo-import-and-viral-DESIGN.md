# 写真の位置情報 × 「勝手に広まる」機構 — 設計書

> **設計 = Fable(claude-fable-5) / 素材 = 会議ハーネス(4体) / 裏取り = 司令塔(Claude)**
> **日付: 2026-08-14** ／ 3段構えワークフロー（council-fable）の手順2の産物。
> 実装は未着手。着手は `docs/photo-import-and-viral-IMPLEMENTATION-HANDOFF.md` を読むこと。

## この設計に至った経緯（要約）

会議ハーネスに案A（写真を保存）/案B（EXIFの位置だけ吸い出す）/案C（折衷）を比較させたところ、
**4体中4体が案Bを支持**した。理由は一致していて、画像ストレージ0・UGCモデレーション義務回避・
EXIF公開リスクゼロ・Apple審査要求増の回避で、個人開発の運用継続性を壊さないため。

批判役(groq/gpt-oss-120b)が刺した穴が最も価値があった:
> 案Bは「EXIFが必ず取得できる」前提に依存している。iOSは写真アクセスを限定/拒否でき、
> HEICの解析にも失敗しうる。**取れないと足あとが1件も増えず「機能が使えない」と判断されて離脱する。**

この穴を塞ぐことを必答論点として Fable に課した。回答は D 章（手動指定への合流）。

### 司法塔が訂正した会議の誤り（会議の出力は素材であって結論ではない）

| 会議の主張 | 実測 |
|---|---|
| `exifr` 等を使う | 当時**1つも入っていなかった**（要新規追加） |
| 「シェアで公開」（それまで非公開） | `locations.visibility` は既に `default("public")`。前提が食い違う → F-2 で部分採用に変更 |
| `src/server/router/location.ts` に実装 | **存在しないパス**。実際は `modules/encounter/api/` |

### 設計後の裏取り（司令塔が実施・全て合格）

- Fable が挙げた7ファイル（`app/(tabs)/map.tsx`, `components/map/footprint-sheet.tsx`,
  `lib/lazy-heavy-components.tsx`, `components/organisms/precision-tile-map.tsx`,
  `modules/encounter/db/queries.ts`, `modules/encounter/api/zukan.ts`,
  `components/checkin/checkin-success-panel.tsx`）は**全て実在**。
- 再利用すると書いた8関数（`assertFiniteLatLng` / `toGrid` / `toH3Cell` / `toH3ParentCell` /
  `toH3R7` / `reverseGeocodeWithTimeout` / `upsertVisitedArea` / `getMyTrailLocations`）は**全て実在**。
- `exifr@7.1.3` は **dependencies が空＝純JS**。「autolinking 対象外なので権限申告が増えない」は正しい。

---

# 設計書本文（以下 Fable の出力）

**採用案: 案B（写真は保存しない。EXIF から座標と撮影時刻だけ吸い出して「過去の足あと」にする）。写真のバイト列は端末（ブラウザ）から一切出さない。**
機能名（画面コピー案）: **「写真から思い出をとりこむ」**。

---

## A. 理想の体験フロー

### v1.1（Web で完結する最小形）

1. **入口**: 軌跡マップ画面（`app/(tabs)/map.tsx`）のヘッダー付近に「写真から思い出をとりこむ」ボタン。押すと `/photo-import` 画面へ。
2. **選ぶ**: `<input type="file" accept="image/*" multiple>` で写真を選ぶ（最大20枚/回）。写真はアップロードされない——この宣言を画面に明記する（「写真そのものは送信されません。場所と日時だけを足あとにします」）。
3. **並ぶ（見せ場・その場限り）**: 選んだ写真をブラウザ内で EXIF 解析し、**ObjectURL のサムネイルをピンとして地図プレビューに並べる**。ユーザーが見せてきた Apple マップの「写真が地図に並ぶ」画面は、**インポートセッション中のローカル体験として成立させる**（保存はしない）。
4. **確かめる・直す**: 各写真カードに「📍あり（座標・撮影日時）／📍なし」を表示。位置が取れなかった写真は、**地図タップ＋日付入力で手動指定できる**（批判役の穴への回答。EXIF ゼロでも足あとは作れる）。不要な写真はチェックを外す。
5. **とりこむ**: 確定すると、選択分が **`visibility: "private"`（自分だけ）の過去日付の足あと**として保存される。同時に**図鑑（visitedAreas）が過去の旅のぶんだけ埋まる**——これが即時の「本人の得」その1。「○件の思い出を地図に灯しました。図鑑に△つの街が増えました」。
6. **公開する（任意・1件ずつ）**: 既存の足あとシート（`components/map/footprint-sheet.tsx` の公開/非公開トグル）で、見せたい足あとだけを public にする。公開時に一度だけ注意文（「他人の家・他人が写った写真の場所は公開しないでください」）。
7. **シェアする**: とりこみ完了パネルに X シェア CTA。既存の `ogp.getOrCreateShareSlug` → `warmOgImageNow`（待ってから）→ `prepareSharePopup` の実装済み経路をそのまま使う。シェア文言は「□□の旅の足あとを△件、地図に灯しました 🏮 {url}」。**新しい OGP バリアントは作らない**（地雷6）。

### 「勝手に広まる」の構造（v1.1 の答え）

Web の `intent/tweet` は**投稿完了を検知できない**ため、「シェアしたら報酬付与」型は技術的に空洞（押すだけで貰える＝即無意味化）。よって v1.1 は**報酬付与型を採らず、「シェアそのものが本人の利益」型**にする:

- **得1**: 過去の旅で図鑑が一気に埋まる（とりこみの内発的報酬。シェア検知不要）。
- **得2**: 自分の巡礼地図・軌跡を推し/フォロワーに見せられる（`/u/{slug}` 着地は本人の X プロフィール導線を持つ既存資産。ファンの「推しの軌跡を辿る」ユースケースに直結）。
- 景表法・射幸性: 抽選なし・経済的価値の付与なし・シェア対価なし。リスクゼロ構成。

### v1.2 以降の拡張（設計だけ示し、v1.1 では作らない）

- ネイティブ版で `expo-image-picker`（写真ライブラリ権限＋ストア申告増を伴う。地雷1）。
- 「旅の絵巻」: とりこんだ一連の足あとを EXIF 時刻順に結んだ決定論的ビジュアル（発散役の代案）。OGP バリアント追加になるため、**ウォーム対象の増加とセットで**設計すること。
- 公開足あと数・訪問県数のプロフィールバッジ（機能・表現の解放型。付与判定がシェア検知に依存しない形に限る）。

---

## B. 統合アーキテクチャ（コンポーネント4個）

```
[1] PhotoImportScreen (UI・Web)
     ├─ <input type="file"> → File[]
     ├─ [2] lib/photo-exif.ts で EXIF 解析（端末内・アップロードなし）
     ├─ プレビュー地図（LazyPrecisionTileMap 再利用 + ObjectURL サムネピン）
     └─ 確定 → [3] trpc.encounter.importFootprints (1回のmutationで最大20件)
                    ├─ 検証・500m丸め・H3・逆ジオコーディング（ユニークセルのみ）
                    ├─ 重複判定 → skip
                    ├─ locations INSERT (source='photo', visibility='private', recordedAt=撮影時刻)
                    ├─ visitedAreas upsert（図鑑が埋まる）
                    └─ マッチングは実行しない（checkIn と決定的に違う点）
[4] スキーマ: locations.source カラム追加 + zukan.myTrail の返却に source を含める
     └─ 地図ピン: source==='photo' はカメラ印で描き分け
シェア: 既存資産をそのまま配線（getOrCreateShareSlug / warmOgImageNow / prepareSharePopup）
```

- **[1] UI**: `app/photo-import.tsx`（新規ルート）＋ `components/photo-import/photo-import-screen.tsx`（新規）。地図プレビューは `lib/lazy-heavy-components.tsx` の `LazyPrecisionTileMap` を再利用。`PrecisionTileMap` がカスタムマーカー（サムネイル画像ピン）に未対応なら、v1.1 は「写真カード一覧＋小地図に点ピン」への簡略化を許容する（実装者判断。体験の核は3〜5の流れであってピンの画像化ではない）。
- **[2] EXIF**: `lib/photo-exif.ts`（新規）。`exifr` を**イベントハンドラ内で動的 import**して使う。
- **[3] API**: 既存の `modules/encounter/api/encounter.ts` に `importFootprints` 手続きを追加（**新ルーターは作らない**＝`server/routers/index.ts` の登録漏れ事故を構造的に回避）。DB クエリは `modules/encounter/db/queries.ts` に `insertImportedLocation` を追加。
- **[4] スキーマ**: `drizzle/schema/encounter.ts` の `locations` に `source` を追加（マイグレーション手順は G 参照）。

---

## C. 具体機構

### C-1. 依存の追加（1つだけ）

- `exifr`（**新規追加**）: 純 JS・ネイティブモジュールなし・Expo プラグインなし・autolinking 対象外。**ストア権限申告は増えない**（地雷1 の懸念は expo-media-library 系の話であり、exifr は該当しない。iOS 495 クラッシュ型の「dependencies にあるだけで焼き込まれる」事故はネイティブコードを持つパッケージ固有）。HEIC コンテナからの EXIF 抽出に対応している点が採用理由。
- `expo-image-picker` / `expo-media-library` は **v1.1 では追加しない**。

### C-2. `lib/photo-exif.ts`（新規）

```ts
export type PhotoExifResult = {
  fileName: string;
  lat: number | null;        // GPSLatitude/GPSLongitude (exifr が10進変換済み)
  lng: number | null;
  takenAt: Date | null;      // DateTimeOriginal → CreateDate の順でフォールバック
  previewUrl: string | null; // URL.createObjectURL。HEICで描画不能なら null
};
export async function extractPhotoExif(file: File): Promise<PhotoExifResult>
```

- `exifr` の import は関数内の `await import("exifr")`。**render パスで動的 import チャンクを直接描画しない**（React19 無限再レンダリング OOM の既知地雷）。解析はハンドラ内で完結し、結果を state に入れてから描画する。
- `Platform.OS !== "web"` では呼ばれない前提（画面側でガード）。ネイティブ実装は v1.2。
- ObjectURL は画面 unmount 時と写真差し替え時に `revokeObjectURL` する（20枚×HEICでメモリを食う）。

### C-3. tRPC 手続き（`modules/encounter/api/encounter.ts` に追加）

```ts
importFootprints: protectedProcedure
  .input(z.object({
    items: z.array(z.object({
      lat: z.number(),
      lng: z.number(),
      recordedAt: z.number(),        // epoch ms（Date直渡しは過去の生SQL地雷があるため数値で受ける）
    })).min(1).max(20),
  }))
  .mutation(...)
```

サーバー側処理（checkIn の部品を再利用）:

1. 各 item: `assertFiniteLatLng` / `recordedAt` は「2004-01-01 〜 現在時刻」の範囲外を reject（未来日付・EXIF 破損対策）。
2. `toGrid` → `toH3Cell(8)` → `toH3ParentCell(7/5)` ＋ `toH3R7`（visitedAreas 用の直接計算。既存の二系統 h3R7 の使い分けを厳守）。
3. **逆ジオコーディングはユニークな latGrid/lngGrid セル単位でまとめて実行**（最大20件が同じ街なら1回で済む）。`reverseGeocodeWithTimeout(lat, lng, 2_500)` を直列 or 並列2で回し、**総予算 6 秒で打ち切り**（Vercel Function のタイムアウト保護）。取れなかった item は municipality/prefecture null で保存（海外写真もこの経路で自然に落ちる。「日本の外の思い出」はエリア名なしの足あとになるだけで壊れない）。
4. **重複判定**: 同 userId・同 h3R8・`recordedAt` 差が±60分以内の既存 location があれば skip（`deletedAt IS NULL` 条件込み）。二度とりこみ・連写写真をここで吸収。
5. INSERT: `insertImportedLocation(db, { ..., accuracyM: null, visibility: "private", source: "photo", recordedAt })`。`hitokoto` 系は触らない。
6. ユニーク h3R7 ごとに `upsertVisitedArea`。
7. **マッチング（近距離/広域/タイムシフト）は実行しない**。理由: (a) 写真由来の在圏主張は本人のリアルタイム在圏より証拠力が弱く、過去日付ですれ違いを遡及生成するとタイムシフトマッチの意味論が壊れる、(b) 他人の写真をとりこんだ偽在圏でマッチを釣る攻撃面を開けない、(c) 手続きが軽く保てる。
8. 返り値: `{ imported: number, skippedDuplicates: number, rejected: number, newAreas: string[] }`（成功形は肯定形フィールドで返す。P0-1「saved 欠落＝偽成功」の教訓）。

### C-4. スキーマ変更（`drizzle/schema/encounter.ts`）

```ts
/** 足あとの由来: checkin=リアルタイムチェックイン / photo=写真EXIFからのとりこみ / manual=手動指定 */
source: varchar("source", { length: 16 }).default("checkin").notNull(),
```

- マイグレーション SQL: `ALTER TABLE "locations" ADD COLUMN "source" varchar(16) NOT NULL DEFAULT 'checkin';`（既存行は全部 checkin になり正しい）。
- `manual` は「EXIF なし写真を地図タップで指定した足あと」用。v1.1 から使う。
- `visibility` の **default("public") は変えない**（地雷2。判断は F 参照）。

### C-5. 表示系の変更（既存ファイルの小改修）

- `modules/encounter/db/queries.ts` の `getMyTrailLocations` の select に `source` を追加。
- `modules/encounter/api/zukan.ts` `myTrail` はそのまま透過。
- 地図ピン（`components/organisms/precision-tile-map.tsx` 側）: `source !== "checkin"` のピンにカメラ印（MaterialIcons `photo-camera`）を重ねる。配色・余白は `theme/tokens/` 準拠、`DESIGN.md` の「正確な場所が見える地図UI」原則に従い丸め表示にしない（本人画面なので正確な座標でよい）。
- `components/map/footprint-sheet.tsx`: 由来ラベル「写真からの思い出」を1行追加。公開トグルは既存の `handleToggleVisibility` がそのまま効く。

### C-6. シェア配線（新規実装ほぼゼロ）

- とりこみ完了パネル（`components/photo-import/import-success-panel.tsx` 新規、`checkin-success-panel.tsx` の型を踏襲）に X シェアボタン。
- 押下時: `prepareSharePopup()`（クリック同ティックで空タブ確保）→ `getOrCreateShareSlug` → `await warmOgImageNow(warmImageUrl)`（3.2秒上限）→ intent URL 差し替え。**すべて実装済みの部品**であり、URL を自前で組み立てないこと（1文字違うと別キャッシュキー地雷）。
- シェア文言: 「{prefecture}の旅の足あとを{imported}件、地図に灯しました 🏮」＋ `/u/{slug}`。

---

## D. 偽陽性/失敗系の潰し方

| 失敗系 | 対策 |
|---|---|
| **EXIF に GPS がない**（スクショ・位置情報オフ撮影・SNS保存画像は EXIF 剥がれ済み） | 写真カードに「📍位置情報なし」を表示し、**地図タップ＋日付入力の手動指定**へ誘導（`source: "manual"` で保存）。**EXIF ゼロ枚でも機能は成立する**——これが批判役の「全体を EXIF 依存にするな」への構造的回答。 |
| **HEIC の解析失敗** | exifr は HEIC の EXIF 抽出に対応するが、失敗時は上の「位置情報なし」経路に合流（クラッシュさせない。try/catch でカード単位に隔離）。**プレビュー描画**は別問題: Chrome/Firefox は HEIC を `<img>` 表示できないため、`previewUrl: null` のときはファイル名＋撮影日時のテキストカードで代替（解析と描画を独立に失敗させる）。 |
| **写真アクセスの制限/拒否（iOS の限定アクセス）** | Web の `<input type="file">` は OS 標準ピッカー経由なので「選んだ写真だけ」渡ってくる＝限定アクセスと構造的に整合。権限 API を自前で触らないので拒否状態が存在しない。 |
| **撮影日時がない** | 手動で日付入力（時刻は 12:00 固定でよい。分単位の精度は足あとの価値に効かない）。未入力なら取り込み不可にする（recordedAt=now で偽装保存しない）。 |
| **重複足あと** | C-3 の h3R8×±60分ルールでサーバー側 skip。返り値 `skippedDuplicates` を UI に出す（「3件は既に灯っていました」）。無言 skip は「保存されたはず」誤認を生む（偽成功一掃の教訓）。 |
| **未来日付・異常日付** | サーバーで reject（2004年以前・現在以降）。`rejected` 件数を UI に表示。 |
| **逆ジオコーディング失敗/海外** | municipality/prefecture null で保存継続。足あと自体は成立。 |
| **20枚超・連打** | クライアントで20枚制限＋mutation 中はボタン disabled。サーバーでも `.max(20)`。 |
| **とりこみ後「地図に出ない」** | private 既定のため県別一覧には出ないのが正しい。完了パネルに「自分の軌跡マップで見る」導線を必ず置き、`/(tabs)/map?focus={locationId}` で着地させる（タブ直アクセス消失バグは修正済みの経路）。 |

---

## E. MVP（v1.1 で1つだけ作るなら）

**「写真から思い出をとりこむ」画面 1 本**（= A の 1〜5）。内訳:

1. `exifr` 追加（依存はこの1個だけ）
2. `locations.source` カラム追加（マイグレーション1本）
3. `encounter.importFootprints` 手続き（マッチングなし・private 既定・図鑑 upsert あり）
4. `app/photo-import.tsx` ＋ 選択/プレビュー/手動指定 UI
5. 完了パネルの X シェア CTA は**既存シェア部品の配線のみ**（新規 OGP・新規報酬システム・新規テーブルはゼロ）

これで「Apple マップの写真ピン体験（セッション内）」「過去の旅で図鑑が埋まる得」「シェア導線」の3点が最小コストで揃う。ピンの写真サムネイル化が `PrecisionTileMap` の改修で重くなる場合、**v1.1 はカード一覧＋点ピンまで**で出してよい（切ってよい順: サムネピン → プレビュー地図 → 手動指定は切らない）。

---

## F. 捨てた案と理由

1. **案A（写真保存）/ 案C（サムネ保存）**: 画像ストレージ禁止の制約に違反。UGC モデレーション義務・審査申告増・Vercel/Railway コスト増。会議4体の判定どおり不採用。
2. **発散役の「シェア＝公開」（シェア前は下書き）**: `locations.visibility` は既に `default("public")` で稼働中（地雷2）。既定を private に反転するには既存全行の意味変更＋ユーザー告知が必要で v1.1 の重さではない。**捨てる**。ただし思想は部分採用: **写真由来の足あとに限り** 手続き側で明示的に `"private"` を渡す（スキーマ既定は不変。マイグレーション不要で「勝手に公開されない」を実現）。
3. **シェア報酬（バッジ/機能解放の付与）**: X の Web Intent は投稿完了コールバックがなく、**付与条件を検証できない**。押すだけで貰えるならゲームとして即崩壊する。v1.1 では不採用。将来やるなら「公開足あと数」等シェア検知に依存しない指標で。
4. **新 OGP バリアント（旅の絵巻カード）**: 生成 1.6〜2.9 秒×ウォーム対象増（地雷6）。「温めたつもり」事故を2回起こしている領域に v1.1 で新変数を持ち込まない。v1.2 候補として保留。
5. **trips テーブル（旅のグルーピング）**: EXIF 時刻でソートすれば表示時にグルーピング可能。保存時のグループ確定は過剰設計。
6. **サーバーサイド EXIF 解析（写真をアップロードして解析）**: 「写真は端末から出ない」というプライバシー上の一番強い主張を失う上、一時的でも画像がサーバーを通る＝ストレージ導入と同じ審査・規約論点を招く。クライアント解析一択。
7. **ネイティブ写真ライブラリ一括スキャン（expo-media-library）**: ネイティブ権限＋ストア申告増（地雷1）。iOS/Android は審査中で誰も触れない（地雷7）。v1.2 以降。
8. **importFootprints でのマッチング実行**: C-3 の7に記載の3理由で不採用。

---

## G. 地雷と回避策

| 地雷 | 本設計での回避 |
|---|---|
| 依存追加＝権限混入（expo-audio/dev-client の実績） | 追加は純 JS の `exifr` 1個のみ。ネイティブモジュールを持つパッケージは v1.1 で追加しない。実装後に iOS/Android のマニフェスト差分がゼロであることを確認する必要すらない（autolinking 対象外）が、念のため store-guard の lint を通す。 |
| DB マイグレーション4罠 | `db:push` 禁止 → `drizzle-kit generate`（`index.drizzle-kit.ts` を見る）→ migrate.ts は env を自前で読まないので環境変数を外から与えて実行 → **journal への手動追記**を手順書に含める。カラム1本・DEFAULT あり・NOT NULL なので既存行ロックは短い。 |
| ルーター登録漏れ（CLAUDE.md ディレクティブ1） | 新ルーターを作らず既存 `encounterRouter` に手続き追加。`server/routers/index.ts` は無変更。 |
| OGP ウォーム不一致（2回事故） | 新バリアントを作らない。`warmImageUrl` はサーバーが返す文字列をそのまま `warmOgImageNow` に渡す。URL を一切加工しない。 |
| 動的 import チャンク直接描画 → React19 無限再レンダリング OOM | `exifr` の動的 import はイベントハンドラ内のみ。import 結果をコンポーネントとして描画しない（データ処理のみ）。 |
| Date の生 SQL 直渡し（encounter.list 500 の実績） | `recordedAt` は epoch ms の number で受け、サーバーで `new Date()` に変換してから Drizzle の insert に渡す。重複判定クエリも Drizzle のビルダー経由で書く（生 sql テンプレートに Date を埋めない）。 |
| Web のみ公開中（地雷7） | 全機能が `<input type="file">` ベースで Web 完結。画面はネイティブでは `Platform.OS` ガードで「アプリ版で近日対応」表示（クラッシュさせない）。 |
| EXIF 座標の公開性（他人の家・他人の写真） | 既定 private＋1件ずつ手動公開＋公開時の注意文。マッチング不参加なので private のまま他ユーザーに漏れる経路がない。既存の `reports.locationId` 通報が公開後の足あとにそのまま効く。 |
| CDN チャンクキャッシュ（version.json 一致≠反映） | 重要修正のデプロイ時は既存運用どおり。この機能は新規チャンク中心なので親チャンク同名別内容のリスクは低いが、`precision-tile-map` を触るため反映確認はマーカー文字列 grep で行う。 |
| tsc | 手続き・スキーマ・select 追加すべて型が波及する（`Location` 型に source が乗る）。`pnpm check` 0 エラーを完了条件とする。 |
