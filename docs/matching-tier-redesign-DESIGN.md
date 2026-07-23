# マッチングティア再設計 DESIGN — Tier3・4 復活と過疎地対策の同期処理適合

- 作成: 2026-07-23（Fable 5 設計フェーズ。コード実装は本文書の範囲外）
- 対象: `modules/encounter/`（core/tiers.ts, core/matching.ts, core/geo.ts, db/queries.ts, api/encounter.ts）+ `drizzle/schema/encounter.ts`
- 前段: 会議ハーネス（groq/gpt-oss-120b, qwen3.6-27b, llama-3.3-70b 等 4体）の素材を、h3-js 実測とコード実読で裏取り済み
- 注記: 本パスには一時的に司令塔執筆の旧ドラフト（Tier3-4非同期バッチ案）が存在したが、(a) res8 k=2 で Tier2 をカバーできるとする記述が実測（保証半径約1.7km < 3km）と矛盾、(b) 非同期バッチ化が「マッチングはチェックイン時に同期実行」という確定制約と衝突、の2点により本設計で置き換えた。旧ドラフトの論点は §4.3 / §7 に吸収済み。
- 追記: 司令塔がFableの設計を全方位実測（36方位×距離でセル一致判定）で再検証したところ、広域ステージの `res5×k=3` はTier4(50km)地点を**42%(15/36方位)取りこぼす**ことが判明したため、`k=3`→`k=4`（61セル・50km地点を全方位で完全カバー確認済み）に修正した。該当箇所（§0・§1.2・§2.3・§7-Q2）は修正済み。

---

## 0. 設計方針サマリ（結論）

**「解像度切り替え + 2段構え同期検索 + マッチ0件ゲート」で、Tier3・4 を同期チェックイン処理のまま安全に復活させる。非同期化は不要。**

1. **候補取得は最大2クエリ**に収める。
   - **近距離ステージ（毎回実行）**: `h3R7` 列 × k-ring=2（19セル、保証半径約4.5km）→ Tier1(500m)・Tier2(3km) をカバー
   - **広域ステージ（条件付き実行）**: `h3R5` 列 × k-ring=4（61セル）→ Tier3(10km)・Tier4(50km) をカバー
     （司令塔による全方位実測でk=3は50km地点の42%を取りこぼすと判明したためk=4に修正。§7-Q2参照）
2. 広域ステージの発火条件（過疎地対策ゲート）: **「今回の近距離マッチが0件」かつ「当日まだ1件もマッチしていない（todayPairSet が空）」**。旧版 surechigai-nico の「直近24hマッチ0件のユーザーだけ範囲拡大」の意図を、追加クエリゼロで同期処理に移植する（todayPairSet は既存処理で取得済みのため）。
3. `locations` テーブルに **`h3R7` / `h3R5` 列を追加**し、`(h3R7, recordedAt)` / `(h3R5, recordedAt)` 複合インデックスを張る。値は既存の `h3R8` から `cellToParent()` で導出（書き込み時に併記 + 既存行はバックフィル）。
4. **`core/matching.ts`（findMatches）と `core/tiers.ts`（judgeTier）は無変更**。ティア判定は従来通り「500mグリッド丸め座標同士の Haversine 距離」で行うため、候補を広く渡すだけで Tier3・4 は自然に機能する。変更は queries.ts（候補取得）・api/encounter.ts（オーケストレーション）・スキーマの3点に閉じる。
5. 会議で提案された「Tier3-4 は非同期バックグラウンド処理 + 通知」案は**不採用**（§4.3 に理由）。

---

## 1. 事実確認（h3-js 実測。2026-07-23、本リポジトリの h3-js v4 で東京駅座標にて計測）

### 1.1 解像度ごとのセル面積・平均エッジ長

| 解像度 | セル面積 | 平均エッジ長 | 用途 |
|---|---|---|---|
| res 8 | 0.678 km² | 0.531 km | 現行チェックインセル（`h3R8` 保存済み） |
| res 7 | 4.746 km² | 1.406 km | visitedAreas / タイムシフトで使用中 |
| res 6 | 33.2 km² | 3.725 km | （今回は列追加しない。§4.2） |
| res 5 | 232.5 km² | 9.854 km | 広域ステージ用に新規採用 |

※ タスク指示にあった「res8≒460m」はエッジ長ではなく旧v3系の数値感。実測エッジ長は約531m（東京緯度）。コード内コメントの「約460m」表記は誤差の範囲だが、設計判断は上表の実測値に基づく。

### 1.2 k-ring（gridDisk）のセル数と保証カバー半径（実測・保守的見積り）

「保証カバー半径」= その距離以内の相手なら方向によらず必ず候補集合に入る半径（外側リングの最近接セル中心距離 − エッジ長で算出した保守値）。

| 構成 | セル数 | 保証カバー半径 | 判定 |
|---|---|---|---|
| res8 × k=1（現行） | 7 | 約 0.95 km | Tier1(500m) ○ / **Tier2(3km) 未達 ×** |
| res8 × k=2 | 19 | 約 1.71 km | Tier2 未達 ×（旧ドラフトの「k=2で十分」は誤り） |
| res7 × k=2 | 19 | 約 4.53 km | **Tier1+2 ○（近距離ステージ採用）** |
| res6 × k=2 | 19 | 約 12.0 km | Tier3(10km) ○（不採用。§4.2） |
| res5 × k=3 | 37 | 約 44.9 km | Tier3+4 不採用。全方位網羅実測で50km地点の取りこぼし率42%(15/36方位)判明→§7-Q2 |
| res5 × k=4 | 61 | 約 58.5 km | **Tier3+4 採用（全方位網羅実測で50km地点0/36ミス・完全カバー確認済み）** |
| res8 のまま 50km を k-ring | **約 9,241**（k≈55） | — | **論外（会議の懸念はこのケースのみ妥当）** |

### 1.3 会議素材の検証結果

| 会議の主張 | 検証結果 |
|---|---|
| 「広域検索で H3 セル数が数十万に達しレイテンシ数秒〜数十秒」 | **半分正しい**。res8 のまま k-ring を広げれば約9千セル（1.2節）で確かに `IN` 句が破綻する。しかし解像度を落とせば最大37セルで、インデックス付き `IN` 検索としてはごく普通の規模。「同期処理で広域検索は危険」という結論は**解像度切り替えを前提にすれば成立しない**。 |
| 「k-ring 固定拡大はプライバシー粒度も粗くなる」 | **誤り（前提の混同）**。本システムのプライバシー担保は「500mグリッド丸め座標でマッチング距離を計算する」ことにあり、H3 セルは**候補の事前絞り込みにしか使っていない**（実コード確認済み: findMatches は latGrid/lngGrid の Haversine でティア判定）。検索セルを粗くしても他ユーザーに渡る座標粒度は変わらない。ただし「セル数が爆発する」という後段の指摘は正しく、結論（固定拡大しない）自体は採用。 |
| 「Tier3-4 は非同期 + 通知で」 | **不採用**（§4.3）。 |
| qwen の「解像度自体をティアごとに切り替える」示唆 | **妥当・採用**。実測で具体化した（1.2節）。なお `tiers.ts` の `TIER_DEFS` には既に `h3Res`/`k` ヒント（T1:res8/k1, T2:res7/k2, T3:res6/k2, T4:res5/k3）が定義済みなのにどこからも参照されていない＝先人も同じ構想だったが配線されなかった、という状態。本設計はこのヒントを（T3 の res6 を除き）ほぼそのまま活かす。 |

### 1.4 現行コードの問題点（実読で確認）

- `getNearbyCandidates`（queries.ts）は固定 `kRing(selfH3R8, 1)` + 直近6時間。保証半径約0.95kmなので **Tier2(3km) すら完全にはカバーできておらず**、Tier3・4 は完全にデッドコード。
- `locations` のインデックスは `h3R8` 単独 / `userId` / `recordedAt` の3本のみ。res7/res5 相当の列は存在しない。
- H3 セルIDは文字列前方一致で親子関係を引けない（プレフィックス構造ではない）ため、SQL 側で res8 → res5 への丸めはできない（Postgres の h3 拡張は Railway 標準では使えない前提）。**列として持たせるのが正解**。
- checkIn（api/encounter.ts）は既に `getNearbyCandidates` / `getTimeshiftCandidates` / `getBlockSet` / `getTodayPairSet` を `Promise.all` で並列取得しており、`todayPairSet` が手元にある。過疎地対策ゲートの判定材料は**追加クエリなしで揃う**。

---

## 2. 候補取得の再設計（getNearbyCandidates 相当）

### 2.1 スキーマ変更

```
locations テーブルに追加:
  h3R7: text  -- cellToParent(h3R8, 7) を書き込み時に併記
  h3R5: text  -- cellToParent(h3R8, 5) を書き込み時に併記
  （移行期間は nullable。バックフィル完了後に NOT NULL 化を検討）

インデックス追加:
  locations_h3R7_recordedAt_idx ON (h3R7, recordedAt)
  locations_h3R5_recordedAt_idx ON (h3R5, recordedAt)
  （既存 locations_h3R8_idx は他用途もあるため残す）
```

- 導出は `h3.cellToParent(h3R8, 7 | 5)`（動作確認済み: `872f5a32dffffff` → res5 `852f5a33fffffff`）。latGrid/lngGrid から再計算せず **h3R8 の親を取る**ことで、既存セル割当と必ず整合する。
- res6 列は追加しない（理由は §4.2）。
- なお `visitedAreas.h3R7`（タイムシフト用）とは別テーブル・別用途。locations 側の h3R7 は候補絞り込み専用で、タイムシフトのロジックには触れない。

### 2.2 近距離ステージ（毎回実行）

```ts
// queries.ts — 概形（疑似コード）
export async function getNearCandidates(db, selfUserId, selfH3R7) {
  const cells = kRing(selfH3R7, 2);              // 19セル・保証~4.5km
  const since = new Date(Date.now() - NEAR_WINDOW_MS);  // 現行踏襲 6h
  return db.select({ userId, latGrid, lngGrid, h3R8, recordedAt })
    .from(locations)
    .innerJoin(users, eq(users.id, locations.userId))
    .where(and(
      inArray(locations.h3R7, cells),
      gte(locations.recordedAt, since),
      isNull(locations.deletedAt),
      ne(locations.userId, selfUserId),
      eq(users.isSuspended, false),
    ))
    .orderBy(desc(locations.recordedAt))
    .limit(NEAR_LIMIT);                          // 例: 500
}
```

- 現行との差分は「`h3R8` k=1 → `h3R7` k=2」と LIMIT の明示のみ。返す型 `NearbyCandidate` は不変。
- **同一ユーザーの複数行はあえて残す**（DISTINCT しない）。「6時間のどこかの地点で500m以内をかすめた」＝すれ違いの本義であり、findMatches が相手ごとに最良ティアを選ぶ既存挙動をそのまま活かす。
- LIMIT を新設する理由: 都市部で19セル×6hの行数が将来膨らんでもペイロードを頭打ちにするため。`ORDER BY recordedAt DESC` で新しい足あと優先。

### 2.3 広域ステージ（条件付き実行）

```ts
// queries.ts — 概形（疑似コード）
export async function getWideCandidates(db, selfUserId, selfH3R5) {
  const cells = kRing(selfH3R5, 4);              // 61セル・50km地点を全方位カバー(実測確認済み)
  const since = new Date(Date.now() - WIDE_WINDOW_MS);  // 提案: 24h（§7-Q3）
  return db.selectDistinctOn([locations.userId], { userId, latGrid, lngGrid, h3R8, recordedAt })
    .from(locations)
    .innerJoin(users, eq(users.id, locations.userId))
    .where(and(
      inArray(locations.h3R5, cells),
      gte(locations.recordedAt, since),
      isNull(locations.deletedAt),
      ne(locations.userId, selfUserId),
      eq(users.isSuspended, false),
    ))
    .orderBy(locations.userId, desc(locations.recordedAt)) // DISTINCT ON 用
    .limit(WIDE_LIMIT);                          // 例: 500
}
```

- **こちらは `DISTINCT ON (userId)` で1ユーザー1行（最新位置）に潰す**。理由: (a) 高頻度チェックインユーザー1人が LIMIT 枠を食い潰して他候補を締め出すのを防ぐ、(b) 10〜50km帯では「最新のだいたいの位置」で十分（Tier3/4 は距離精度よりも到達性が価値）。
- 取得後は近距離候補と単純にマージして findMatches に渡すだけ。重複相手は findMatches の「相手ごと最良ティア」既存ロジックが吸収する。10〜50km帯の行も judgeTier(距離) が正しく Tier3/4 を割り当て、50km超の候補は距離判定で自然に落ちる（粗いセルで拾いすぎても最終判定は厳密）。

### 2.4 checkIn オーケストレーション（api/encounter.ts の変更概形）

```
1. （現行どおり）getNearCandidates / getTimeshiftCandidates / getBlockSet / getTodayPairSet を並列取得
2. immediate = findMatches({ self, nearbyCandidates: near, timeshiftCandidates, blockSet, todayPairSet })
3. immediate に距離マッチ（tier ≤ 4）が 1件もない かつ todayPairSet.size === 0 のとき:
     wide = await getWideCandidates(db, userId, h3R5)
     final = findMatches({ self, nearbyCandidates: [...near, ...wide], ... })
   それ以外: final = immediate
4. （現行どおり）excludeSelfMatches → insertEncounterIfNew ループ
```

- findMatches は純粋関数のまま2回呼ぶだけ。**core 層のシグネチャ変更なし**。
- ゲート判定は手元の値のみで完結（追加クエリ0）。

---

## 3. 過疎地対策（マッチ0件なら範囲を広げる）の同期適合

### 3.1 採用する設計

旧版 nico の「直近24hマッチ0件のユーザーだけ Tier2→3→4 と拡大」を、**「Tier1→2→3→4 の4段直列」ではなく「近距離(T1+T2)→広域(T3+T4) の2段直列・最大2クエリ」**に圧縮して移植する。

- 段数を4→2に圧縮できる根拠: ティアは取得後の距離計算で決まるため、「Tier2 まで検索」「Tier4 まで検索」の2種類の検索範囲があれば全ティアを表現できる。段ごとに検索し直す必要があるのは「範囲」だけで「ティア」ではない。
- ゲート（`当日マッチ0件`）の性質が同期処理と好相性である点が本設計の核:
  - **都市部ユーザー**: 近距離ステージでほぼ必ずマッチする or 当日既にマッチ済み → 広域ステージはほぼ発火しない。
  - **過疎地ユーザー**: 広域ステージが発火するが、過疎地の50km圏は**定義上、行数が少ない** → クエリは軽い。
  - つまり「広域クエリの実行頻度 × 1回あたりコスト」が構造的に小さく抑えられる（発火するのは重くない場所、重い場所では発火しない）。
- 最悪ケース（都市部で当日マッチ0の新規ユーザーが深夜にチェックイン → 東京50km圏を検索）も、37セル×複合インデックス×DISTINCT ON×LIMIT 500 で数十ms級に頭打ち。

### 3.2 直列多段クエリのリスク・メリット整理（タスク指示の論点への回答）

- リスク: 1リクエスト内の直列クエリはレイテンシ加算・コネクション占有時間増。4段直列なら最悪4往復で、Vercel Functions のタイムアウト予算を圧迫し得る。
- 本設計での帰結: 直列になるのは**広域ステージ発火時の1往復のみ**（+1クエリ、数十ms想定）。checkIn には既に reverseGeocode 2.5s タイムアウト等が同居しており、この増分は誤差レベル。4段直列案は「段=範囲」の混同から来る過剰設計として不採用。
- メリット（残すべき性質）: 「必要なユーザーにだけ広域コストを払う」という旧版の資源配分思想はゲートとして温存した。

---

## 4. パフォーマンス・DB負荷対策

### 4.1 対策一覧

| 対策 | 内容 |
|---|---|
| 解像度切り替え | `IN` 句セル数を近距離19・広域37に固定（res8 k-ring 拡大なら約9千）。 |
| 複合インデックス | `(h3R7, recordedAt)` / `(h3R5, recordedAt)`。セルごとの probe が時間窓付き range scan になり、Bitmap Index Scan + Top-N で安定。 |
| LIMIT | 近距離500 / 広域500（初期値。観測して調整）。 |
| DISTINCT ON（広域のみ） | ペイロードと LIMIT 独占を抑制（§2.3）。 |
| 発火ゲート | 広域クエリの実行頻度そのものを絞る（§3.1）。 |
| 時間窓 | 近距離6h（現行踏襲）・広域24h（提案。§7-Q3）。recordedAt 条件がインデックスで効くため窓拡大のコストは限定的。 |
| 観測 | 実装時に「広域発火率」「各ステージ行数」「クエリ所要時間」をログ計測（Sentry 併用可）で残し、LIMIT/k/窓のチューニング材料にする。 |

### 4.2 res6（中間段）を設けない理由

res6 × k=2（19セル・保証12km）で「Tier3 だけ先に試す」中間段も可能だが不採用。

- 列・インデックス・バックフィル・クエリ関数が1組増える割に、得られるのは「広域発火時のヒット行数削減」のみ。広域発火自体が稀 & 過疎地で軽い（§3.1）ため、複雑さに見合わない。
- Tier3 と Tier4 の区別は取得後の judgeTier が距離でつけるので、検索段を分ける必要がない。
- 将来、観測で「広域クエリが重い」と判明した場合の追加オプションとして温存（TIER_DEFS の res6/k2 ヒントはその時のために残してよい）。

### 4.3 会議提案「非同期二段階検索 + 通知」（旧ドラフトのバッチ案含む）を不採用とする理由

1. **確定制約と衝突**: 「マッチング処理はチェックイン時に同期実行（cronバッチではない）」は本タスクの変更不可前提。Vercel Cron / sweep 相乗りの後追いバッチ化はこの前提に反する。
2. **通知チャネル不在**: プッシュ通知が未実装のため「後から見つかったら知らせる」のUXが成立しない（チェックイン応答の `newEncounters` に載せられる同期方式が現行UXと整合）。
3. **不要**: §3.1 の通り、同期のままで負荷は構造的に抑えられる。危険視の根拠（数十万セル）は res8 k-ring 前提であり本設計には当てはまらない。
4. 補足: 旧ドラフトが推した「スキーマ変更なし・時間窓だけで広く取ってアプリ側でH3再計算する案（B案）」は、都市部で時間窓ヒット全行のフルスキャン転送になり LIMIT との相性も悪い（絞り込み前に切られる）。列追加（本設計）が正攻法。スキーマ変更は本タスクの禁止事項に含まれていない。

---

## 5. 実装時に守るべき制約（地雷マップ再掲・念押し）

1. **正確な lat/lng は永続保存**（48h削除の復活・座標の丸め保存への変更は禁止。確定済み方針転換）。
2. **マッチング距離計算は latGrid/lngGrid（500m丸め）同士で行う**。H3 列はあくまで候補絞り込み用。findMatches に生座標を渡さない。他ユーザーに渡る座標粒度を細かくしない。
3. **同期チェックイン処理を維持**（cron・ジョブキュー・別リクエスト分割の導入禁止）。
4. **h3-js 採用は変更しない**。ブロックペア除外・当日既マッチペア除外（blockSet / todayPairSet / UNIQUE(userAId,userBId,dayKey)）の既存ロジック維持。
5. **core 層（matching.ts / tiers.ts）は純粋関数のまま**。DB 依存を持ち込まない。judgeTier の距離閾値は変更しない。
6. Drizzle 地雷: 生 `sql` テンプレートに Date を直渡ししない（encounter.list 常時500の実障害あり。必ず `gte()`/`lt()` 等の演算子を通す）。`inArray` に空配列を渡さない（kRing は常に1件以上返すため通常は安全だが、防御的に扱う）。
7. `pnpm check` 0 エラー維持。スキーマ追加時は `drizzle/schema/index.ts` エクスポート確認。マイグレーションは `drizzle/migrations/` にコミット。
8. DM禁止・一方向リアクションのみ等のプロダクト方針は本設計の範囲外だが侵さない。

---

## 6. 実装フェーズ提案（小さく安全に。各フェーズで pnpm check + デプロイ確認）

- **Phase 1 — スキーマ & 二重書き込み（挙動変更なし）**
  `h3R7`/`h3R5` 列 + 複合インデックス追加（`pnpm db:push` + マイグレーションコミット）。`insertLocation` で `cellToParent` 併記開始。既存行バックフィルは Node スクリプトでバッチ実行（行数はまだ少ない想定。SQL 側で親セル計算はできない点に注意）。マッチング挙動は一切変えない。
- **Phase 2 — 近距離ステージ切替（Tier2 完全化）**
  `getNearbyCandidates` を h3R7×k2 版に差し替え（NULL の h3R7 を持つ未バックフィル行が漏れないことを確認してから）。これだけで Tier2 が仕様通り3kmをカバーする。レイテンシ・行数を観測。
- **Phase 3 — 広域ステージ + ゲート（Tier3/4 復活・過疎地対策）**
  `getWideCandidates` 新設 + checkIn のオーケストレーション変更（§2.4）。広域発火率・所要時間のログを仕込む。
- **Phase 4 — チューニング & テスト整備**
  観測値を見て LIMIT / k / 時間窓を調整。ユニットテスト: kRing セル数・カバー半径の回帰、都市部/過疎地シードでの findMatches 統合テスト（近距離0件→広域発火→Tier4 生成、当日既マッチ時は発火しない、ブロック除外維持）。

---

## 7. 未解決・要確認事項（プロダクト判断）

- **Q1. 過疎地体験の重視度**: ゲート「当日マッチ0件のときだけ広域」は旧版準拠の推奨案。もし「過疎地では毎チェックインで広域まで見せたい」なら、ゲートを「近距離0件なら常に広域」（todayPairSet 条件を外す）に緩められる。負荷増は限定的だが、都市部でも深夜などに発火頻度が上がる。→ 推奨: まず旧版準拠で出して観測。
- **Q2. Tier4 の 50km 厳密性**: 司令塔による全方位網羅実測（36方位×距離ごとにセル一致判定、東京駅座標）で追加検証。res5×k=3は **45km地点で4/36方位(約11%)、50km地点で15/36方位(約42%)がring外＝取りこぼす**。文書時点の想定より欠落率が高い。res5×k=4なら50km地点は0/36（完全カバー、実測確認済み）。→ **推奨を修正: k=3ではなくk=4（61セル）を採用**。61セルでも近距離ステージとの合算候補数は許容範囲内（§4.1のLIMIT設計内に収まる）。「同じ地域」の体験を損なわない方を優先し、コスト増よりも取りこぼし率42%のリスクを避ける。
- **Q3. 広域ステージの時間窓**: 近距離6hに対し、広域は24hを提案（過疎地は空間だけでなく時間もまばら。窓を広げないとゲート発火しても結局0件になりやすい）。旧版 nico の窓仕様と突き合わせて確定したい。encounters.occurredAt は従来通り min(両者のrecordedAt) で整合する。
- **Q4. タイムシフト(Tier5)を「当日マッチ済み」に数えるか**: 現行 todayPairSet はティア不問。Tier5 しか無い日でも広域を発火させたいなら getTodayPairSet を tier≤4 でフィルタする変更が要る。→ 推奨: まずは不問（既存セット流用・実装最小）で出し、過疎地ユーザーの声で再考。
- **Q5. バックフィル完了前の挙動**: Phase 2/3 は h3R7/h3R5 が NULL の行を候補から漏らす。バックフィルを Phase 1 完了条件にするか、移行期のみ h3R8 併用フォールバックを持つか。→ 推奨: 行数が少ない今のうちにバックフィルを完了させ、フォールバック実装は持たない（コード最小）。

---

## 付録: 本設計で触るファイルと触らないファイル

| ファイル | 扱い |
|---|---|
| `drizzle/schema/encounter.ts` | 変更（locations に h3R7/h3R5 列 + 複合インデックス） |
| `modules/encounter/db/queries.ts` | 変更（getNearCandidates 改修 / getWideCandidates 新設 / insertLocation 併記） |
| `modules/encounter/api/encounter.ts` | 変更（checkIn の2段オーケストレーション + 観測ログ） |
| `modules/encounter/core/geo.ts` | 微追加のみ（cellToParent ラッパー等。既存関数は不変） |
| `modules/encounter/core/matching.ts` | **無変更**（純粋関数のまま2回呼ぶ） |
| `modules/encounter/core/tiers.ts` | **無変更**（TIER_DEFS のヒントは res6 を除き本設計と一致。コメント追記は任意） |
