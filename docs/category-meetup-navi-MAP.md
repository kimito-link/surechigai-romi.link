# 地図(wayfinder): カテゴリで会いに行く / 自宅に帰る

> 作成: 司令塔(Claude Opus 5) / 2026-09-06 / **実コードを読んで書いた事実ベース**
> 手法: [WAYFINDER-TO-SPEC-HOWTO.md](../../web-ios-android/docs/ai-workflows/WAYFINDER-TO-SPEC-HOWTO.md) 手順1
> ★コードは一切変更していない。

## お題（オーナーの言葉）

> ジモティで取引した。気付いた。**ツイッターで普段のツイート見てると取引が安心できる。**
> その機能をジャンルごとにつけたい。また**ことりっぷみたいな**機能も。行った場所に行って記録したい。
> でも、**このアプリには文章の投稿も写真の投稿も実装しない。金銭のやりとりもなし。**
> **カテゴリだけ**をいれる。そのカテゴリを元に見にいくように。
> 気になったらフォローしたり交流する。**このアプリを使えば属性合う人がフォローされる、
> フォロワーを増やせるのを売りにしたい。**
> Xがあるから、もし会いに行って取引終了後、売買したものが壊れていても連絡できる。**これこそがメリット。**
>
> 見つけたら、**Googleマップみたいに現在地から会いに行く機能**をつけたい。
> **カーナビみたいに普段づかい**してもらえるように。**相手のアカウントを指定したら会いに行く**みたいな。
> **自宅に帰る機能も。もちろん、公開・非公開は自由意志。**

### ★実体験による裏付け（2026-09-07・オーナーが実際に踏んだ）

オーナーがジモティで取引予定だったが、**当日すっぽかされた**。
やりとりの実物（スクショで確認）:

```
きの   09/06 23:57  明日でしたら対応可能ですがいかがでしょうか？
tm     10:42        お返事遅れてすいません。本日よろしいでしょうか？
きの   12:15        何時頃対応可能ですか？
tm     14:32        きのさんのご都合の良い時間で調整させて頂きます。
                    → ★そのまま来なかった
```

ジモティの返信欄には運営の注意書きが並んでいる:
- 「履歴を残すため、ジモティー内でのやりとりを推奨しております」
- 「トラブルの際は**警察等の捜査依頼に積極的に協力**しております」
- 「直接お会いしての取引は、**人目のつく場所か複数人**で行いましょう」

★**これが「Xで普段のツイートが見えると安心できる」の出発点**。
ジモティは**プラットフォーム内に閉じた履歴**で相手を担保しようとするが、
- 相手の**人となりは分からない**（取引履歴と評価しか見えない）
- **すっぽかされても連絡手段が絶たれる**（アカウントを消せば終わり）

⟹ このアプリの立ち位置は「**取引の場を作る**」ではなく
「**会う前に相手が分かり、会ったあとも連絡が続く**」。
Xが**本人の日常の蓄積**であり、かつ**アプリの外に残り続ける連絡経路**である点が効く。

★オーナーの言葉「**取引終了後、売買したものが壊れていても連絡できる。これこそがメリット**」は、
この実体験から出ている。

### 確定済みの方針（AskUserQuestion で回答済み）

- カテゴリは **プロフィール / 足あと(場所) / 集まり の3箇所すべて**に付ける
- フォローは **X へ送るだけ**（アプリ内フォロー関係は持たない）

---

## 1. 入口になる画面・API

| 入口 | 実体 | 状態 |
|---|---|---|
| ホーム(投稿/レーダー) | [components/post/post-authenticated-screen.tsx](../components/post/post-authenticated-screen.tsx) | ★**居場所マーカーが無効化されている**（後述4-A） |
| 軌跡マップ | [app/(tabs)/map.tsx](../app/(tabs)/map.tsx) | 稼働 |
| 集まり | [app/(tabs)/events.tsx](../app/(tabs)/events.tsx) | 稼働。**1画面に集約・詳細ページは無い** |
| 図鑑 | [app/(tabs)/zukan.tsx](../app/(tabs)/zukan.tsx) | 稼働 |
| マイページ(設定) | [components/mypage/mypage-authenticated-screen.tsx](../components/mypage/mypage-authenticated-screen.tsx) | 稼働 |
| 居場所API | `presence.setEnabled` / `pulse` / `list` — [modules/encounter/api/presence.ts:92,126,186](../modules/encounter/api/presence.ts) | 稼働（listの描画側だけ止まっている） |

---

## 2. 関係する主要ファイルと責務

| ファイル | 責務 |
|---|---|
| [lib/navigation/open-maps-directions.ts:56,67](../lib/navigation/open-maps-directions.ts) | 現在地→目的地の経路URL生成。Webは Google Maps `dir/?`、ネイティブは `daddr=` |
| [components/molecules/navigate-to-place-button.tsx:11-31](../components/molecules/navigate-to-place-button.tsx) | 「ここへ向かう」ボタン。`{lat, lng, label?}` を受け取る |
| [modules/encounter/db/queries.ts:2256-2265](../modules/encounter/db/queries.ts) | `LivePresenceMarker` 型（`userId/name/profileImage/lat/lng/place/updatedAt/isSelf`） |
| [modules/encounter/db/queries.ts:2311](../modules/encounter/db/queries.ts) | `listLivePresenceForViewer` — 公開中の他人の現在地を返す |
| [drizzle/schema/encounter.ts:292-320](../drizzle/schema/encounter.ts) | `userSettings` — ★プライバシー設定の集約点 |
| [drizzle/schema/encounter.ts:27-70](../drizzle/schema/encounter.ts) | `locations` — 正確な `lat/lng/accuracyM`・`note`・`visibility` |
| [drizzle/schema/users.ts:29-47](../drizzle/schema/users.ts) | `users` — `hitokoto` / `shareSlug` / `isSuspended` |
| [modules/event/api/event.ts](../modules/event/api/event.ts) | 集まりの tRPC。`onlineUrl` 等 |

---

## 3. データが流れる順番

### 「相手の現在地へ向かう」に必要な流れ（★2本とも既に存在する）

```
本人が公開をON
  presence.setEnabled [presence.ts:92] → userSettings.livePresenceEnabled = true
本人の端末が定期送信
  presence.pulse [presence.ts:126] → updateLivePresencePosition [queries.ts:2267]
      → homeMaskCell 内なら place="ひみつの場所"（座標は保存される）[queries.ts:2295-2300]
      → userSettings.livePresenceLat / Lng / Municipality / UpdatedAt を更新
閲覧者が一覧を取る
  presence.list [presence.ts:186] → listLivePresenceForViewer [queries.ts:2311]
      → 除外: 停止中(isSuspended) / locationPausedUntil 未来 / 5分より古い / ブロック相手
      → LivePresenceMarker[] （lat, lng を含む）
描画
  post-authenticated-screen.tsx:96 useQuery(presence.list)
  post-authenticated-screen.tsx:205 presenceAll = LIVE_PRESENCE_RADAR_ENABLED ? … : []
      ★ここが false 固定なので、取得もせず描画もしない
```

### 「経路を開く」の流れ（既に4箇所で稼働）

```
NavigateToPlaceButton({lat, lng, label})
  → openMapsDirections [open-maps-directions.ts]
      → Web: https://www.google.com/maps/dir/?…      [:56]
      → ネイティブ: …daddr=<lat>,<lng>               [:67]
```
使用中: チェックイン成功画面 [checkin-success-panel.tsx:172] / 足あとシート [footprint-sheet.tsx:141] /
足あと履歴 [trail-history-list.tsx:110] / チェックイン画面 [checkin-authenticated-screen.tsx:44]

★**`LivePresenceMarker` は `lat`/`lng` を持ち、`NavigateToPlaceButton` は `lat`/`lng` を要求する。
両者を繋ぐだけで「相手を指定して会いに行く」は成立する**（新規のAPIも計算も要らない）。

---

## 4. 既存の設計判断と、その根拠（★壊してはいけない境界）

### 4-A. ★居場所レーダーが2ヶ月間、無実のまま止まっている（最重要）

[post-authenticated-screen.tsx:36-40](../components/post/post-authenticated-screen.tsx):
```
// docs/auth-home-oom-diagnosis-v2.md: 認証済みホームのOOMが e0cbccf(居場所リアルタイム公開)
// 導入以前は起きていなかったとの実機報告を受け、原因切り分けのため居場所マーカーの
// 描画とpresence.list定期クエリを一時停止する。
const LIVE_PRESENCE_RADAR_ENABLED = false;
```
`6058111eb`（2026-07-04）で**原因切り分けのため一時停止**された。コメントは
「原因が確定し次第、安全な形で作り直して再有効化する」と書いている。

★**OOM の真因は別だった**。メモリ [[surechigai-auth-home-oom]] に:
> 真因は `lib/icons/material-icons.web.tsx` の動的import + React 19 の無限sync再レンダリング。
> **解決済み（2026-07-04, `b3337de`）**
> 旧仮説は全て無効: …/**presence refetch**/…

⟹ **居場所レーダーは無罪と確定済みなのに、キルスイッチが残されたまま**。
「会いに行く」機能の土台がここで止まっている。★**これが最大の発見**。

### 4-B. プライバシーは既に「本人の意思」で設計されている

[drizzle/schema/encounter.ts:292-320](../drizzle/schema/encounter.ts) の `userSettings`:

| カラム | 既定値 | 意味 |
|---|---|---|
| `livePresenceEnabled` | **false** | リアルタイム公開はオプトイン |
| `trailVisibility` | `public` | private / link / acquaintance / public の4段階 |
| `shareLocationPrecise` | **false** | OGPで正確座標を出すか（既定は市区町村粒度） |
| `locationPausedUntil` | NULL | 一時停止 |
| `homeMaskCell` | NULL | 自宅推定セルを照合から除外 |

⟹ オーナーの「公開・非公開は自由意志」は**既存の設計思想と完全に一致**する。
新しい公開の仕組みを作るのではなく、**この枠に乗せる**のが正しい。

### 4-C. 鮮度は5分で切られている

[queries.ts:2315](../modules/encounter/db/queries.ts): `staleBefore = Date.now() - 5*60*1000`
かつ `isLivePresenceFresh` で二重に確認 [queries.ts:2349]。
⟹ 「今いる場所」ではなく「**5分以内に居た場所**」しか出ない。追跡にならない歯止めが既にある。

### 4-C2. 自宅マスクの実態（★2026-09-07 訂正: 当初の記述は誤りだった）

> ★**訂正**: 当初ここに「masked でも他人に正確座標が返る」と書いたが**誤り**。
> Fable の指摘を受けて実コードを再確認したところ、
> [queries.ts:2368-2371](../modules/encounter/db/queries.ts) に
> `const masked = isHomeMasked(h3R8, row.homeMaskCell); if (masked && !isSelf) continue;`
> が実在し、**閲覧層では既に他人に返らない**。地図の誤りを訂正する。

残る穴は2つ（こちらは確認済み）:

**(a) 保存層は masked でも正確座標を保存する** [queries.ts:2301-2306](../modules/encounter/db/queries.ts):
```
livePresenceLat: input.lat,   // ★masked でもそのまま
livePresenceLng: input.lng,
livePresenceMunicipality: place,  // 隠しているのは地名だけ
```

**(b) ★そもそもマスクが存在しない人が多い**（これが本当の急所）:
[core/home-mask.ts:6-10](../modules/encounter/core/home-mask.ts):
```
HOME_MASK_NIGHT_HOURS_JST = { start: 23, end: 5 }
HOME_MASK_MIN_NIGHT_VISITS = 3
```
＝ **夜間23-5時のチェックイン3回以上/30日**でしか推定されない。
新規ユーザー・昼型ユーザー・チェックインしない人には **`homeMaskCell` が NULL**。
NULL なら `isHomeMasked` は常に false ＝ **自宅に居ても素通りで座標が配信される**。

⟹ 「会いに行く」の前提条件は「マスクが正しく効くこと」ではなく
**「マスクが必ず存在すること」**に置く必要がある。

### 4-C3. ★★居場所公開は「本人の意思」の証拠にならない（★重大な訂正）

> ★**訂正**: 4-B に「`livePresenceEnabled` の既定 false ＝ オプトイン」と書いたが、
> **DB の既定値がそうであるだけで、クライアントが自動で ON にする**。

[hooks/use-auto-start-live-presence.ts:41-48](../hooks/use-auto-start-live-presence.ts):
```
const armLivePresence = () => {
  if (startedRef.current || readLivePresenceUserOffSync()) return;
  …
  setEnabledMutation.mutate({ enabled: true });   // ★自動でONにする
};
```

⟹ **`livePresenceEnabled = true` は「本人が会いに来てよいと言った」証拠にならない**。
位置情報を許可しただけの人が含まれる。
★**「会いに行く」の同意をこのフラグに相乗りさせてはいけない。別の明示フラグが要る。**

### 4-C2-old. （旧記述・誤り。記録のため残す）

[queries.ts:2286-2306](../modules/encounter/db/queries.ts) の `updateLivePresencePosition`:
```
const masked = isHomeMasked(h3R8, settings.homeMaskCell);
const place = masked ? "ひみつの場所" : shortPlaceLabel(…);
await upsertUserSettings(db, userId, {
  livePresenceLat: input.lat,     // ★masked でも正確な座標をそのまま保存
  livePresenceLng: input.lng,     // ★同上
  livePresenceMunicipality: place, // 隠しているのはここ（地名）だけ
});
```
`listLivePresenceForViewer` [queries.ts:2311] はこの `lat`/`lng` をそのまま返す。

⟹ **今は地図上の点として出るだけなので実害が見えにくいが、
「この人へ経路案内」を付けた瞬間、『ひみつの場所』と表示されている自宅へ
カーナビが正確に案内する**という状態になる。

★同型の設計が `shouldMaskHomeCellFromShare` [location-visibility.ts:32-39] にもあり、
こちらもシェアからの除外であって座標の秘匿ではない。

★**「会いに行く」を作るなら、ここを塞ぐことが前提条件**。これは新機能の副作用ではなく、
**既存の穴が新機能によって顕在化する**型（[[surechigai-pwa-share-and-guest-visibility-2026-08-17]] と
同じく「経路が増えると既存の甘さが実害になる」パターン）。

### 4-D. 座標の永続保存は意図的な方針転換

[drizzle/schema/encounter.ts:50-58](../drizzle/schema/encounter.ts):
> 方針転換: 思い出をたどる/聖地巡礼のため、生座標を保存し48hでも消さない。
> 自衛は移動専用アカウント運用に委ねる。

CLAUDE.md の設計原則1も同じ。⟹ 「後で行ける精度」は**既に担保済み**。

### 4-E. 交流は X に委ねる（DM禁止）

CLAUDE.md 設計原則4: 「DM禁止、X連携。アプリ内通信は一方向スタンプのみ。交流はXに委譲」
⟹ オーナーの「フォローはXで」「投稿は持たない」は**既存方針そのもの**。新方針ではない。

### 4-F. 集まりに詳細ページは無い

CLAUDE.md: 「画面は `app/(tabs)/events.tsx` の1画面に集約（**イベント詳細ページは存在しない**）」
★`lib/navigation/app-routes.ts` に**実在しないルート定数が28件**残っているので、
`navigate.toXxx` を新規に使うときは `app/` に実ファイルがあるか必ず確認する。

---

## 5. 変更すると壊れうる箇所

| 箇所 | 壊れ方 |
|---|---|
| `LivePresenceMarker` 型 [queries.ts:2256] | `presence.list` の戻り値。UI側と契約している |
| `listLivePresenceForViewer` の除外条件 [queries.ts:2338-2356] | ★ブロック・停止・鮮度の**安全弁**。緩めると事故る |
| `userSettings` へのカラム追加 | `pnpm db:push` 不可。migration の4罠あり [[surechigai-place-note-and-premium-2026-07-31]] |
| `NavigateToPlaceButton` の props | 既に4箇所で使用中 |
| `openExternalUrl` の許可リスト | ★列挙に無いドメインは**無言で false**（押しても無反応） |
| ストアのプライバシー開示 | 位置情報の用途が変わると審査で**申告のやり直し**が要る [[surechigai-both-stores-submitted-2026-08-12]] |

---

## 6. 未確認の前提（★推測と明記する）

- **カテゴリ用のテーブル・カラムは存在しない**（`grep placeCategory` → 0件）。新規に要る。**確認済み**
- `locations.note`（場所メモ）は存在する [encounter.ts:89]。カテゴリと役割が重なるか**未確認**
- 自宅の**正確な座標**を持つ場所は無い。`homeMaskCell` は H3 res8（約460m）の**セルIDのみ**で、
  カーナビの目的地には粒度が足りない。**確認済み**（＝自宅座標は新規に持つ必要がある）
- `LIVE_PRESENCE_RADAR_ENABLED` を true に戻して**実際にOOMが再発しないか**は**未検証**（推測: 
  真因が別と確定しているので再発しないはずだが、実機で測るまで断定しない）
- 現在このアプリに何人ユーザーが居るか**未確認**。オーナーは「自分しか使っていない」と発言
- ★`homeMaskCell` が座標を隠さないことは**確認済み**（4-C2）。地名のみ置換される

---

## 6-B. ★すっぽかし体験から出た、追加で決めるべき論点

実体験（冒頭）を踏まえると、**「会う前に人となりを見る」だけでは足りない**可能性がある。
すっぽかしは「相手が悪人だった」のではなく「**約束の重みが軽かった**」ために起きる。

★ただし、ここで**評価・レビュー機能を作ってはいけない**（オーナーの確定方針
「文章の投稿も写真の投稿もしない・金銭のやりとりもなし」を壊す。
評価は投稿の一種であり、モデレーション・通報・名誉毀損の対応が芋づるで必要になる）。

代わりに、**このアプリが既に持っているもの**で約束の重みを作れないか:

| 手段 | 既存資産 | 何が効くか |
|---|---|---|
| Xが晒される | `openTwitterProfile` | ★**すっぽかすと自分のXアカウントに紐づく**。捨てアカと違い日常の蓄積があるので抑止が働く |
| 足あとが残る | `locations`（永続保存） | 約束の場所に**実際に行った証跡**が本人の軌跡に残る |
| 集まりへの参加表明 | `modules/event/`（参加テーブル実在） | ★「行く」と表明した記録が残る |

### ★オーナー判断: 抑止を役割に含める（2026-09-07 承認済み）

「はい、いれましょう」＝ すっぽかし抑止を**アプリの役割に含める**。
ただし**評価・レビュー・ペナルティは作らない**（投稿を持たない方針を壊すため）。

実測した既存資産と、その使い方:

| 資産 | 実測 | 抑止としてどう効くか |
|---|---|---|
| 参加表明 | `eventParticipations` [event-participation.ts:18-40](../drizzle/schema/event-participation.ts)。`displayName`/`username`/`profileImage` を持ち、`reminderEnabled` でリマインドまで実装済み | ★「行く」と**Xのハンドル付きで**表明した記録が残る |
| Xが紐づく | `openTwitterProfile` [external-links.ts:199](../lib/navigation/external-links.ts) | ★捨てアカと違い**日常の蓄積があるアカウント**に紐づくので抑止が働く |
| 足あと | `locations`（永続保存・正確座標） | 約束の場所に**実際に行った証跡**が本人の軌跡に残る |

★**自動照合は現状できない**（実測で確認）:
`events` に**会場の座標が無い**（`venueName` の文字列だけ [event.ts:68](../drizzle/schema/event.ts)）。
⟹ 「参加表明した集まりの会場に、実際に足あとがあるか」を機械的に突き合わせられない。

**したがって取れる道は2つ**（実装前に決める・7章 Q9 に載せた）:
- **(a) 見せ方だけで抑止する** — 新規実装ゼロ。「この人はXでこういう人」「参加表明が残る」を
  会う前に見せるだけ。★すっぽかしを**記録しない**ので、誤判定も起きない
- **(b) 会場に座標を持たせる** — `events` に `lat`/`lng` を足し、足あとと照合できるようにする。
  ★ただし「行ったのに圏外で記録されなかった」等の**誤判定が人を傷つける**side がある

★私の見立ては **(a) から始める**。(b) は「来なかった」を機械が断定する仕組みで、
測位失敗・電池切れ・遅刻を区別できない。**冤罪のコストが、抑止の利得を上回りうる**。

## 6-C. ★ガソリン価格など「みんなが役立つ便利情報」— ほぼ実装済みだった

> オーナー: 「ガソリンスタンドの金額とかもいれたい。みんなが役立つ便利情報として」

実コードを読んだ結果、**機能自体は既にある**（実測で確認）:

| 資産 | 実体 | 状態 |
|---|---|---|
| 保存先 | `locations.placeName`(120字) / `note`(140字) / `noteUpdatedAt` [encounter.ts:87-90](../drizzle/schema/encounter.ts) | ★実在 |
| 入力UI | [components/map/place-note-modal.tsx:7](../components/map/place-note-modal.tsx) — コメントに**「ここのガソリンが安い」**と明記。placeholder も「例: ○○ガソリンスタンド」 | ★実在・地図から呼ばれている |
| 保存API | `updateLocationNote` [modules/encounter/api/zukan.ts:127](../modules/encounter/api/zukan.ts) | ★実在（moderation 込み） |
| 鮮度表示 | [modules/encounter/core/place-note.ts:16](../modules/encounter/core/place-note.ts) — 「ガソリン価格のように数日で変わる情報があるため、鮮度は必ず利用者に見せる」 | ★実在 |

### ★足りないのは1点だけ:「他人に見えていない」

- `getCreatorsByPrefecture` [queries.ts:1251-1253](../modules/encounter/db/queries.ts) は
  `placeName`/`note`/`noteUpdatedAt` を**select している**
- しかし **`getPublicTrailByShareSlug`（共有軌跡 `/u/[slug]` が使う）は select していない**（実測）
- 表示側 `FootprintSheet` は `point.note` を描く実装があり [footprint-sheet.tsx:121-128](../components/map/footprint-sheet.tsx)、
  `onSaveNote` の有無で編集可否を切り替える設計＝**閲覧は他人でも可能な作り**

⟹ 「みんなが役立つ」にするには、**共有軌跡のクエリに3列を足すだけ**で届く可能性が高い。

### ★★ただし設計文書と衝突する（実装前に必ず判断が要る）

[docs/place-info-DESIGN.md:24-29](place-info-DESIGN.md) の結論:
> **「口コミ機能」ではなく「自分の足あと1件に添える本人メモ」として作る。**
> 表示は FootprintSheet と共有軌跡 `/u/{slug}` の同シートのみ。**地図ピンには一切出さない**。
> **集約・検索・評価・他人の足あとへの書き込みは作らない。**
> ガソリン価格もグルメ情報も「その人がその日その場所で見たこと」という**一人称の記録**として残る。

同文書:205 は「**ガソリン価格専用フィールド・カテゴリ enum**」を
「カテゴリを作ると『カテゴリ別一覧』が欲しくなり**口コミ化への滑り坂**」として却下している。

★オーナーの「みんなが役立つ便利情報として」は、読み方によっては
**この却下事項（集約・検索）に踏み込む**。実装前に線引きを決める:

- **(a) 一人称のまま他人にも見せる** — 共有軌跡に3列足すだけ。設計文書と整合する。
  「〇〇さんが3日前に見たガソリン価格」として出る（誰の記録か分かる形）
- **(b) 集約する** — 「近くの安いスタンド一覧」を作る。★設計文書が明確に却下した方向。
  価格の正確性に責任が生じ、モデレーションと鮮度管理が重くなる

★私の見立ては **(a)**。既存資産にほぼ乗り、投稿を持たない利点も壊さない。
「一人称の記録が積み重なって結果的に役立つ」という形にできる。
**ただしこれはオーナーの判断が要る**（「みんなが役立つ」の意図が (b) なら別設計）。

## 7. ★実装前に決める必要がある質問（Fableに答えさせる）

1. **カテゴリの語彙を誰が決めるか。** 固定リストか自由入力か。
   ★自由入力にすると「投稿を持たない＝モデレーション不要」という最大の利点が消える。
2. **カテゴリのデータ構造。** `users` にカラム追加か別テーブルか。
   1ユーザー複数カテゴリを許すか。足あと・集まりにも同じ語彙を使うか。
3. **`LIVE_PRESENCE_RADAR_ENABLED` を戻すか。** 戻すなら、OOM 再発を**どう機械的に確かめる**か。
   ★「たぶん大丈夫」で戻さない（2ヶ月止まっていた機能である）。
4. **自宅座標をどこに持つか。** `userSettings` に `homeLat/homeLng` を足すか。
   ★これは**最も秘匿すべきデータ**。`homeMaskCell` との関係をどう整理するか。
   自宅を登録した人の `homeMaskCell` は自動で決まるべきか。
5. **「会いに行く」を出す条件。** 相手が `livePresenceEnabled` の時だけか。足あと（過去の場所）にも出すか。
   ★★**前提として 4-C2 の穴を塞ぐ設計が要る**（自宅マスク中は座標を返さない/丸める/ボタンを出さない
   のどれか）。「地名だけ隠して座標は返す」ままカーナビを付けてはいけない。
6. **カテゴリで人を探す画面をどこに置くか。** 新タブは作らない前提でどこに載せるか
   （既存タブは 6つ: index/checkin/map/events/zukan/mypage）。
7. **ストア審査の申告をどう書き換えるか。** 位置情報の用途に「他の利用者を探す」が加わる。
   ★提出前に必ず更新する。動画提出を求められた前例あり。
8. **MVP をどこで切るか。** カテゴリ / 会いに行く / 自宅に帰る の3つは独立して出せるか。
   ★オーナーは「カーナビとして普段使い」を重視しており、**自宅に帰るが最も日常的に押される**
   （カテゴリより先に出す価値があるかもしれない）。

---

9. ★**すっぽかし抑止をどこまでやるか**（オーナーは「いれる」と承認済み）。
   6-B の (a) 見せ方だけ / (b) 会場に座標を持たせて照合。★(b) は誤判定が人を傷つける。
10. ★**「みんなが役立つ便利情報」の線引き**（6-C）。(a) 一人称のまま他人にも見せる /
   (b) 集約する。★(b) は `place-info-DESIGN.md` が「口コミ化への滑り坂」として却下した方向。

## セルフチェック（HOWTO の項目）

- [x] ファイル名の列挙で終わっていない（4章で「なぜそうなっているか」を根拠付きで書いた）
- [x] 既存仕様を守る理由（4-B/4-D/4-E に方針の出典を明記）
- [x] ユーザー体験上の制約（4-C の5分鮮度、4-F の画面構成）
- [x] データ保存・互換性・失敗時（5章の migration 罠、無言 false）
- [x] 事実と推測を分けた（6章で「確認済み/未確認」を明示）
- [x] 重要な判断に根拠（commit `6058111eb` `b3337de`、メモリ、行番号）
