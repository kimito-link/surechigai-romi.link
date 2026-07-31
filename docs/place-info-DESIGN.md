# 場所メモ設計書 — 足あとに「その場所の実用情報」を書き残す機能

- 設計: Fable(claude-fable-5) / 裏取り: 司令塔(Opus 5) / 2026-07-31
- 3段構えワークフロー（会議ハーネス → Fable設計 → 実装引き継ぎ）の手順2の産物
- ステータス: **設計確定・実装未着手**
- 前史: `docs/handoff-2026-07-06.md` の「4-4. グルメマップ・思い出機能（設計未着手・規模大）」が
  「着手する場合は先に会議ハーネス→Fable設計の3段構えプロセスを踏むことを推奨」として保留していた案件。
  本設計はその手順を踏んだもので、4-4 から写真を外したスコープ縮小版にあたる。

## 司令塔による裏取り結果

設計の結論を左右する主張を実コードで確認した。

| 主張 | 検証結果 |
|---|---|
| `locations` に列を足せばアカウント削除に自動で乗る | **事実**。`modules/encounter/db/account-deletion.ts:91` に `delete(locations).where(eq(locations.userId, userId))` がある |
| `hitokoto` は24時間で表示から消える | **事実**。`modules/encounter/api/encounter.ts:267-276` が `hitokotoAge < 24h` で出し分けている。永続の場所メモと棲み分けが成立する |
| `visit.report` はモデレーションを通していない | **事実**。`modules/encounter/api/visit.ts` に `moderateText` の参照が0件。`publicProcedure` でグループコード（最短2文字）を知れば誰でも読める |
| 同一テーマが保留されていた | **事実**。`docs/handoff-2026-07-06.md:102-109` |

---

## A. 結論

**作る。ただし「口コミ機能」ではなく「自分の足あと1件に添える本人メモ（場所名120字＋メモ140字）」として作る。**

`locations` に nullable 3列を足し、書き込みはチェックインとは別の専用 mutation（moderation 込み）、
表示は FootprintSheet と共有軌跡 `/u/{slug}` の同シートのみ。**地図ピンには一切出さない**。
集約・検索・評価・他人の足あとへの書き込みは作らない。ガソリン価格もグルメ情報も
「その人がその日その場所で見たこと」という**一人称の記録**として残り、拡散は従来どおり X に委ねる。

### 必答論点1:「そもそも作るべきでない」の検討

真剣に検討した。却下しない理由は3つ。

1. **「Xに書けば済む」は半分しか正しくない**。X に書いた情報は流れて消え、座標と切り離される。
   このアプリの核心価値は「後でその場所に行ける精度で残る」こと（`DESIGN.md`「あとで行ける具体的な場所」）。
   「安いスタンド」「旨い店」は座標とセットで初めて再訪可能になる。
   X が担うのは拡散、アプリが担うのは**座標に固定された記録**。役割が重ならない。
2. **既にユーザー要望として記録がある**（`docs/handoff-2026-07-06.md` 4-4）。運営者自身が
   X 本文への手書きで代用している＝需要の実在が観測済み。
   今回のスコープ（写真なし・テキストのみ）なら 4-4 が懸念した「規模大」は解消される。
3. **焦点をぼかさない形が存在する**。焦点がぼけるのは「エリアの口コミ集約」を作った場合。
   「自分の足あとへの注記」なら主役は依然「その人の足あと」であり、却下済みの周辺POI表示
   （`docs/share-landing-uiux-SPEC.md:242`「その人の足あとという主役をぼかす」）とは逆に、主役を濃くする。

**ただし条件付き**。以下の一線を越えたら口コミアプリ化して運用が破綻するので、越えない（→E節）:
他人の足あとに書けない／同一地点のメモを集約しない／評価・スコアを付けない／検索できない。

---

## B. 理想の体験フロー

### 書く瞬間（2導線・どちらも押し付けない）

1. **チェックイン直後**: `CheckinSuccessPanel` の「記録の確認」ゾーン（記録時刻・場所ラベルの直下、
   出口ボタン群より上）に小さなテキストボタン「この場所にメモを添える」を1つ置く。タップでモーダル。
   書かなくても何も損なわれない。訴求密度ルール（`docs/uxux-stability-audit-SPEC.md:160-165`）の
   縦順序では②記録の確認に属し、③商業訴求・④行動訴求より上で整合。
2. **あとから**: 自分の地図でピンをタップ → `FootprintSheet` に「メモを添える／編集」ボタン
   （`canManage` 時のみ）。給油後に走り出して、休憩時に思い出して書く、が自然にできる。

モーダルは `HitokotoModal` と `visit-screen-view.tsx:165-188` の2フィールド構成を合成した `PlaceNoteModal`:
- 場所名（任意・120字）: 「○○ガソリンスタンド」「らーめん△△」
- メモ（任意・140字）: ワンタップ定型文6種で手入力を減らす。
  案: 「レギュラー ¥」「ここの飯が旨い」「駐車場あり」「景色がいい」「また来たい」「推し向けスポット」

### 読む瞬間

- **自分**: 地図ピンタップ → FootprintSheet の住所・時刻の下に、罫線で区切られたメモブロック。
- **他人**: `/u/{slug}` の共有軌跡でピンタップ → 同じ FootprintSheet に
  「〈名前〉さんのメモ・YYYY/MM/DD時点」として表示。**日付を必ず併記**し、書いた人が誰かを常に明示する。
  30日超のメモは文字色を muted に落とす（消さない）。
- **地図面には何も出ない**。ピンの見た目はメモ有無で変えない
  （会議収束点1・`docs/cost-and-ads-ltv-SPEC.md:176` の原則をユーザー生成情報にも適用）。

---

## C. 具体機構

### C-1. スキーマ（`drizzle/schema/encounter.ts` の `locations` に追加）

```ts
/** 本人が付けた施設・店名（自由入力=主張）。逆ジオ由来の address（事実）とは別列。 */
placeName: varchar("placeName", { length: 120 }),
/** 本人のメモ。API側で140字制限（hitokoto と同じ予算）。 */
note: text("note"),
/** メモの最終更新。鮮度表示用。NULL = メモなし。 */
noteUpdatedAt: timestamp("noteUpdatedAt"),
```

- 文字数は `groupVisitReports`（同ファイル:86-119）の実績値 120/140 を踏襲。
- **別テーブルは作らない**。1足あと=最大1メモ（1:1）なので JOIN 不要・削除も既存処理に自動で乗る（→地雷5）。
- `reports` に `locationId: integer("locationId")`（NULL可）を追加（→地雷2）。

### C-2. tRPC プロシージャ

**`zukan.updateLocationNote`**（protected・新設。`modules/encounter/api/zukan.ts` の
`deleteLocation`/`setLocationVisibility` と同族なのでここに置く）

```
input: { locationId: number, placeName?: string(≤120), note?: string(≤140) }
処理:
 1. cleanText 相当の NFKC 正規化＋空文字null化（visit.ts:31-34 のパターンを core へ抽出して共用）
 2. placeName + note を連結して moderateText()（updateHitokoto と同じ呼び方・encounter.ts:334-337）
 3. 所有権チェック付き UPDATE（softDeleteLocation と同じ userId AND locationId 条件）
 4. noteUpdatedAt = now()。両方 null なら3列とも null に戻す（=メモ削除。専用deleteは作らない）
```

- レート制限: `api/trpc/[trpc].ts:24-32` の `expensivePathRules` に
  `{ pattern: /^zukan\.updateLocationNote$/, windowMs: 20_000, max: 1 }` を追加（`visit.report` と同格）。
- **`encounter.checkIn` は1行も触らない**（→地雷3）。

**`safety.report` の拡張**: input に `locationId?: number` を追加、
`REPORT_REASONS` に `"inappropriate_place_note"` を追加。

**読み取り**: `getMyTrailLocations` と `getPublicTrailByShareSlug` の select に
`placeName / note / noteUpdatedAt` を追加するだけ。可視性は既存の仕組みにタダ乗りする —
private な足あとは既に `isLocationVisibleToOthers` で共有から落ちるので、
**メモ単独の公開設定は作らない**（足あとが private ならメモも見えない。それで十分）。

### C-3. `TrailPoint` の拡張（`lib/map/tile-geo.ts:6-16`）

```ts
export type TrailPoint = {
  // ...既存フィールド（address は逆ジオ由来の「事実」専用のまま）
  /** 本人入力の場所名（主張）。address と混ぜないこと（app/visit.tsx:140 の轍を踏まない） */
  placeName?: string | null;
  note?: string | null;
  noteUpdatedAt?: Date | string | null;
};
```

`precision-tile-map.tsx` の `formatPlace` / 情報パネル（:98-99）は**変更しない** —
引き続き `address` のみを表示する。`placeName`/`note` を描画するのは FootprintSheet だけ。

### C-4. 画面

| 画面/部品 | 変更 |
|---|---|
| `components/checkin/place-note-modal.tsx`（新設） | 場所名＋メモ＋定型文6種。HitokotoModal 系の見た目を踏襲 |
| `components/map/footprint-sheet.tsx` | 住所・座標の下にメモブロック（区切り線＋メモ本文＋「YYYY/MM/DD時点」）。`canManage` なら「メモを添える/編集」ボタン、非オーナー・ログイン済みなら「通報」テキストリンク → 既存 `report-modal` を locationId 付きで開く |
| `components/checkin/checkin-success-panel.tsx` | 記録確認ゾーンに「この場所にメモを添える」テキストボタン1つ |
| `components/post/report-modal.tsx` | reason 定数を共有モジュールへ移して locationId 対応（→地雷6） |

### C-5. 声の分類（必答論点2）: **「記録」で確定**

- 場所メモは常に「本人の足あと＋本人の名前＋日付」に固定表示され、集約もランキングもされない。
  `docs/uxux-stability-audit-SPEC.md:152` の3分類では**記録**（ラベルなし＝デフォルトの声）。
  共有ページでは「〈名前〉さんのメモ」と帰属を明示することで、誰の声かが構造的に曖昧にならない。
- 景表法・ステマ規制の射程: 規制対象は「事業者が自己の供給する商品等について行う表示」。
  一般ユーザーが自分の移動記録に添える感想は運営の表示でも広告でもなく、射程外。
  **ただし店舗関係者が自店宣伝に使う抜け道は塞ぐ**: 利用規約に
  「宣伝・広告目的の投稿禁止（自己の営む店舗等の宣伝を含む）」を明記し、
  通報理由 `inappropriate_place_note` で運用対応する。
- 境界線のルール（`server/routers/ads.ts:58-60` の出し分けと同じ慎重さ）:
  **金銭が絡む場所訴求は既存の協賛カード（sponsorCards）だけが担い、場所メモには金銭経路を将来も作らない**。
  「無償＝記録、有償＝協賛」の一本線で決着させる。

### C-6. 鮮度（必答論点5）

- 期限切れ削除はしない（足あと永続の設計と矛盾するため）。誠実さは**日付の常時表示**で担保:
  「2026/07/31時点」を必ずメモに併記。
- `noteUpdatedAt` から30日超は文字色を `color.textMuted` に落とし「古い情報です」と小さく添える
  （条件分岐1つ。バッチ処理・自動失効は作らない）。
- 更新は本人のみ・いつでも上書き可（noteUpdatedAt が進み鮮度表示が戻る）。
  他人による更新・訂正機能は作らない。

### C-7. ひとことの棲み分け（必答論点6）

| | ひとこと（`users.hitokoto`） | 場所メモ（`locations.note`） |
|---|---|---|
| 紐づく先 | 人（プロフィール） | 足あと1件（座標） |
| 寿命 | 24hで表示から消える（`encounter.ts:267-276`） | 永続（30日で減光） |
| 読者 | すれ違った相手 | 自分＋軌跡を見に来た人 |
| 用途 | 挨拶・自己紹介 | その場所の記録・実用情報 |

重複なし。UI 文言でも「ひとこと=あなたのこと」「メモ=この場所のこと」と書き分ける。

---

## D. MVP（1〜2週間）

**作る（この順で）**:
1. スキーマ: `locations` 3列＋`reports.locationId`（`pnpm db:push`＋migration コミット）
2. `zukan.updateLocationNote`（moderation・所有権・レート制限込み）＋ cleanText の共用化
3. `PlaceNoteModal`＋FootprintSheet 表示（自分の地図）
4. `/u/{slug}` 共有軌跡での表示（select 3列追加＋シート表示。閲覧専用）
5. 通報: reason 共有定数化→ `inappropriate_place_note` 追加→ FootprintSheet からの通報導線（ログイン済み閲覧者のみ）
6. CheckinSuccessPanel の入口ボタン
7. 利用規約・プライバシーポリシー改訂（→F）
8. `pnpm check` 0エラー→デプロイ→FootprintSheet のメモ表示をマーカー文字列で配信確認（CDNチャンク地雷対応）

**MVPで作らない**: 写真添付／trail-history-list へのメモ表示／ピンのメモ有無インジケータ／
ゲスト閲覧者の通報導線（当面は問い合わせ窓口で受ける）／NGワードリストの改修。

---

## E. 捨てた案と理由

| 案 | 捨てた理由 |
|---|---|
| エリア口コミ・レビュー集約 | 会議収束点4。中傷・ステマ・訂正対応の運用が個人開発で回らない。集約した瞬間「情報の正しさ」の責任がアプリ側に移る。一人称の記録なら責任は書名入りの本人に留まる |
| 地図ピンへのメモ表示・メモ有無マーカー | 会議収束点1＋`cost-and-ads-ltv-SPEC.md:176` の原則。「地図＝真実」に主張を混ぜない。有無インジケータすら P2 送り（滑り坂の入口のため） |
| 構造化入力（ガソリン価格専用フィールド・カテゴリ enum） | 過剰設計。定型文プリセットで9割賄える。カテゴリを作ると「カテゴリ別一覧」が欲しくなり口コミ化への滑り坂 |
| 別テーブル `placeNotes` 新設 | 1:1 なのに JOIN・削除処理追加（地雷5）・通報先の増加を招く。列追加で足りる |
| `visit.report`/`groupVisitReports` への相乗り | 地雷1（moderation ゼロ・publicProcedure・匿名）。器の性質が違いすぎる |
| 外部POI/価格API・店舗名オートコンプリート | 却下済み周辺POI表示の蒸し返し＋地雷7（Nominatim 1.1s直列）＋Stop And Ask 対象を増やさない |
| 写真添付（handoff 4-4 の原形） | ストレージ費用・画像モデレーションが個人開発の運用限界を超える。テキスト+X側の写真で十分（現に運営者はそうしている） |
| メモの自動期限切れ・失効削除 | 「消さない」という根本方針と矛盾。日付表示＋減光で誠実さは足りる |
| メモ単独の公開/非公開設定 | 足あと自体の visibility（既存）で代替可。設定の直交軸を増やさない |

---

## F. 連動して直すもの（Stop And Ask 項目含む）

`docs/feature-appeal-redesign-SPEC.md:297-304` の Stop And Ask 該当:

1. **DBスキーマ変更**（該当・必須）: `locations` 3列＋`reports.locationId`。
   migration を `drizzle/migrations/` にコミット。
2. **利用規約の文言変更**（該当・必須）: 「場所メモは公開設定に従い第三者に表示される」
   「虚偽情報・宣伝広告目的（自店宣伝含む）・第三者の誹謗中傷の禁止」「違反時の削除・アカウント停止」
   「価格等の情報は投稿時点のものであり正確性を保証しない」を追加。
3. **プライバシーポリシー**（該当・必須）: ユーザー生成コンテンツとして場所メモを収集項目に追記。
   アカウント削除で消えること（locations 行ごと削除・`account-deletion.ts:91` で自動担保）を明記。
4. 新規外部サービス・CSP変更: **非該当**（既存 Groq/Gemini の無料枠内）。

その他の連動修正:
- 通報 reason の共有定数化（地雷6の恒久修正。`shared/report-reasons.ts` 等に一本化し
  safety.ts と report-modal.tsx 双方が import）。
- ストア公開後は iOS/Play のデータ開示（UGC 項目）更新 — `store-guard` 案件としてメモ。
- **推奨併修（本機能とは独立の既存穴）**: `visit.report` に `moderateText` を入れる。
  本設計では相乗りしないが、野放しの穴自体は残る（地雷1参照）。別タスク切り出しを推奨。

---

## G. 地雷マップへの回答

| 地雷 | 回避策 |
|---|---|
| 🔴1 `visit.report` moderation なし | **流用しない**。新設 `zukan.updateLocationNote` は protectedProcedure＋`moderateText` を初日から通す。`cleanText` だけを core モジュールに抽出して共用（コピーではなく移動） |
| 🔴2 `reports` に locationId がない | `reports.locationId`（NULL可）追加＋reason `inappropriate_place_note` 追加＋FootprintSheet に通報導線。3件自動停止の既存運用（`targetUserId` 集計）にそのまま乗る |
| 🔴3 moderation 直列10秒 | チェックイン経路に一切触れない。moderation は専用 mutation 内でのみ実行（updateHitokoto と同型）。ユーザーは「保存中…」を見て待てる文脈であり、最悪10秒でも UX 事故にならない。**checkIn 内で note を受ける案は禁止事項として明記**（`encounter.ts:164-169` の Serverless 警告圏内のため） |
| 🟠4 TrailPoint の事実/主張混在 | `placeName`/`note` を**別フィールド**として追加。`address` には今後もユーザー入力を入れない。`formatPlace`・地図情報パネルは `address` のみ表示を維持し、主張の描画箇所は FootprintSheet に限定。`app/visit.tsx:140` の既存混在は本設計のスコープ外だが同注釈をコードコメントで残す |
| 🟠5 アカウント削除に乗らない | 別テーブルを作らず `locations` の列にしたので `account-deletion.ts:91` の `delete(locations)` で自動削除。設計段階で構造的に解決 |
| 🟡6 通報 reason 二重管理 | reason 定数を共有モジュールへ一本化してから `inappropriate_place_note` を追加（追加作業自体を二重管理解消の機会にする） |
| 🟡7 Nominatim 1.1s 直列 | 店舗名オートコンプリートは作らない。場所名は手入力＋定型文のみ。逆ジオ呼び出しは1回も増えない |

**NGワード誤爆（地雷3付随）の扱い**: `ばか/あほ/くそ` は「ばか旨い」等の飲食文脈で誤爆するが、
MVPではリストを触らない（hitokoto と共有のため影響範囲が広い）。拒否時のエラーメッセージを
「使えない表現が含まれています。言い換えてお試しください」とし、定型文プリセットで
誤爆語を避けた表現（「ここの飯が旨い」）へ誘導する。誤爆報告が実際に来たら初めてリスト分離を検討する
（来る前に作り込まない）。LLM プロンプトのステマ判定拡張も同様に見送り —
プロンプトは hitokoto と共有であり、既存プリセット「Xフォローしてね」を広告判定で誤爆させるリスクの方が高い。
一次防衛は「書名＋日付の常時表示・集約しない・通報」の構造で足りる。
