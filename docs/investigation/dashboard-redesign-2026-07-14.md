# ホーム／マイページ ダッシュボード再設計 — 実装設計書

> 3段構え(会議ハーネス→Fable設計→実装引き継ぎ)の②Fable設計フェーズの成果物。
> 外部会議ハーネス(meeting.mjs)は内部ファイルパス・コンポーネント名の外部送信になるため
> ユーザー確認の上スキップし、Fable(claude-fable-5)に直接設計させた。
> 実装は次のチャット/別AIに引き継ぐ。ここではまだコードは書いていない。

対象リポ: `surechigai-romi.link` ／ 前提: `pnpm check` 0エラー維持・ディレクティブ4（同ターン内デプロイ）適用

## 発端

ユーザー（プロダクトオーナー）からホーム画面（ポストタブ）とマイページのダッシュボード機能について詳細なUIUX再設計提案が届いた。要旨:
- ダッシュボードは「統計を見る場所」ではなく「今どこを記録しているか→何が届いたか→次に何をするか」が3秒で分かる画面にすべき
- ホーム＝行動ダッシュボード／マイページ＝管理ダッシュボードに役割分担
- 最新地点（"My Signal"）の表示を強化、統計カードの優先度を均等から差別化、デスクトップの地図オーバーレイ問題、「新着アカウント」という用語の違和感、マイページのプロフィールカード過大・タップ領域不足、等

事前にExploreエージェントで現状実装を調査し、その調査結果とユーザー提案原文をFableに渡して設計を依頼した。

## 調査で判明した、提案の前提を変える事実（最初に読むこと）

1. **座標は既にサーバー側で取得済みで、捨てられているだけ**。`modules/encounter/db/dashboard-queries.ts`の`getMySignalSummary()`は内部で`getMyTrailLocations(db, selfUserId, 1)`を呼んでおり、この戻り値には`lat`/`lng`/`accuracyM`/`address`が全部含まれている。現在は`latestPlaceLabel`（文字列）と`latestRecordedAt`だけ取り出して残りを破棄している。つまり「最新の足あと」カードに必要な型拡張は**追加クエリ0・約10行の差分**で済む。
2. **ホームは既に「行動ダッシュボード」の骨格を持っている**。`components/post/post-authenticated-screen.tsx`のモバイル分岐は「HomeStatusLine（状態）→ EnvelopeRail（未開封封筒）→ 地図 → SignalAccountGrid → CheckinCtaButton」の順で、提案の理想モバイル構成とほぼ一致している。「いまやることをホームへ移す」作業の大半は**もう済んでいる**。
3. **ホームにはOOM予算がある**。`docs/auth-home-oom-diagnosis-v2.md`起因の制約（無限アニメ本数上限・地図マウントの`InteractionManager`遅延・`romiLiteHome`キルスイッチ・「import()チャンクから直接描画禁止」）が生きている。**ホームに2枚目の地図を足す案はこの予算と衝突する**。
4. 「小さな地図」はMapLibre不要。`components/organisms/precision-tile-map.tsx`は自前のOSMタイルレンダラで、`lib/lazy-heavy-components`の`LazyPrecisionTileMap`として既にlazyチャンク化済み・チェックイン画面で実戦投入済み。
5. `SignalAccountGrid`のパネル外枠は既に`borderRadius: 8`でDESIGN.md準拠。違反しているのはマイページ系（20/16/12px）。→ DESIGN.mdが正、実装が逸脱。
6. ホームは`trpc.dashboard.mySignal.useQuery`を直接呼んでおり、`hooks/use-my-signal.ts`の`useMySignal()`（`refetchInterval: 60_000`付き）とオプションが不揃い。クエリキーは同一なのでキャッシュは共有されるが、実装は二重化している。

---

## (A) 役割分担の設計判断

**結論**: 「ホーム＝行動／マイページ＝管理」の役割分担は採用。ただし`MypageActionList`は**マイページに残す**（削除も移動もしない）。重複はUI上のみ許容し、実装は`useMySignal`共有で一本化する。

**根拠**:
- ホームには既にEnvelopeRail（未開封を開く）とCheckinCtaButton（チェックインする）がネイティブに存在する。`MypageActionList`の2大アクション（未開封・未チェックイン）はホームでは画面そのものになっている。ホームに複製する必要はない。
- マイページに残す理由: (1)`MypageActionList`は「参加予定の集まり」も束ねており、これはホームの守備範囲外。(2)データは`useMySignal`の同一クエリキャッシュなので残すコストはほぼゼロ。(3)マイページに直接着地する導線があるため、そこで行動を提示できる価値は残る。
- 「UIの重複」と「実装の重複」の区別: 未開封件数が3画面に出るのはUI重複で問題ない。問題は実装重複（事実6）。

**反論・リスク**: 「同じ情報が2画面にあると片方の更新漏れが起きる」→ 単一クエリキャッシュ＋既存invalidationで吸収済み。リスクは低い。

**具体案**:
1. `post-authenticated-screen.tsx`の直接クエリ（L209-213）を`useMySignal()`に差し替え。オプションの正はフック側とする。
2. マイページの表示順を変更（Step 1）: プロフィール（縮小）→**MypageActionList**→**LatestFootprintCard（新設）**→MySignalSummary（活動サマリー化）→HostEventsSummary→設定。JSX並び替えのみ。

---

## (B) 「最新の足あと」カードの実現可能性

**結論**: **型拡張（案1）を採用**。`MySignalSummary`型に`latestLocation: { lat, lng, accuracyM } | null`を追加。地図は`LazyPrecisionTileMap`を**マイページ側のカードのみ**に埋め込み、**ホームには地図を足さない**（HomeStatusLineの情報強化のみ）。

**根拠**:
- 型拡張のコスト: `getMySignalSummary()`は既に`latestTrail[0]`を持っている（事実1）。案2（`zukan.myTrail(limit:1)`を別途呼ぶ）はマイページに新規ネットワークリクエストを1本増やすが、案1は増やさない。
- 地図コンポーネント: `LazyPrecisionTileMap`はzoom17でタイル約2〜6枚の`<Image>`+静的マーカー。アニメ0本・チェックインタブで実績あり。
- ホームに足さない理由: ホームには既にJapanRadarMapがある。同一画面に地図2枚は価値の重複であり、OOM予算（事実3）にも抵触する。ホームでは**テキスト強化版HomeStatusLine**（場所名+時刻+精度+CTA、地図なし）で満たす。

**反論・リスク**:
- 「タイル読み込みでマイページ初期表示が遅くなる」→ lazyチャンクは表示時のみロード。実測で問題が出たら`InteractionManager.runAfterInteractions`でカード内地図のマウントを1tick遅らせる逃げ道を最初から入れておく。
- 「サーバー未デプロイの古いレスポンスに`latestLocation`が無い」→ クライアント型はoptional扱い（`latestLocation ?? null`）にし、無い場合は地図なし表示に自然フォールバック。additiveなので新旧どちらの組み合わせでも壊れない。
- タイル取得失敗（状態⑨）→ チェックイン画面と同じ`MapErrorBoundary`で包む。

**具体案（ファイルレベル）**:
1. `modules/encounter/db/dashboard-queries.ts`:
   - `MySignalSummary`型に`latestLocation: { lat: number; lng: number; accuracyM: number | null } | null`を追加。
   - `getMySignalSummary()`のreturnに`latestLocation: latest ? { lat: latest.lat, lng: latest.lng, accuracyM: latest.accuracyM } : null`を追加。
2. `modules/encounter/api/dashboard.ts`: DB不在フォールバックオブジェクトに`latestLocation: null`を追加。
3. 新規`components/dashboard/latest-footprint-card.tsx`（`LatestFootprintCard`）:
   - 内容: 見出し「最新の足あと」／`latestPlaceLabel`＋`formatDateTime(latestRecordedAt)`＋精度ピル（`accuracyM != null ? "±${Math.round(accuracyM)}m" : null`）／高さ約140pxの`LazyPrecisionTileMap`（`locations={[latestLocation]}`, `zoom={16}`, `showInfoPanel={false}`, `MapErrorBoundary`で包む）／アクション2つ: 「この場所を地図で見る」（`navigate.toMapTab()`）と「もう一度チェックイン」（`navigate.toCheckinTab()`、`checkedInToday`時はラベルを「今日もチェックイン」等に）。
   - `latestLocation === null`時: 地図なし・「まだ足あとがありません」＋チェックインCTA1つ（状態①）。
   - スタイル: `borderRadius: 8`・タッチターゲット`minHeight: 44`（DESIGN.md準拠、(D)参照）。
4. `components/post/home-status-line.tsx`強化（地図なし）: 現在の1行テキストを「場所名（太字）＋時刻＋精度ピル」の2行構成にし、`!checkedInToday`時はこのブロック内に`CheckinCtaButton compact`を出す。既存の一時停止ピルは維持。新規アニメ0本の予算内。併せて現在モバイル限定の表示をデスクトップ右ペインにも出す（(C)）。

---

## (C) デスクトップ2カラム化とSignalAccountGrid

**結論**: overlay廃止 → `flexDirection: "row"`の2カラム（地図`flex:1`＋右ペイン固定幅360px）に変更。改名は**「届いたすれ違い」**を採用。

**根拠**:
- 影響範囲は狭い: overlay構造は`post-authenticated-screen.tsx`の`styles.signalPanel`/`signalPanelDesktop`（`position:absolute, top:18, zIndex:30`）と`signal-account-grid.tsx`の`layout` propだけで成立している。デスクトップ分岐を`<View style={{flex:1, flexDirection:"row"}}>`にし、左に`renderRadarStage`＋`emptyOverlay`＋`sisterBanner`、右に`<ScrollView style={{width:360}}>`（HomeStatusLine強化版→EnvelopeRail→SignalAccountGrid `layout="docked"`）を置く。固定幅360px（1280px画面で地図約72%、1440pxで75%）は提案の65〜70%要求を満たしつつ、%指定より狭幅ウィンドウで破綻しにくい。
- 改名の判断: グリッドの`items`は未開封だけでなく開封済みも含む全encounters（`encounters ?? []`）である点が決め手。
  - 「新しい封筒」→ ✕ 未開封専用のEnvelopeRailと意味衝突、開封済みも並ぶ実態と不一致。
  - 「この場所ですれ違った人」→ ✕ 場所でフィルタしていない。
  - 「すれ違いの記録」→ △ アーカイブ（図鑑）の語感で、図鑑タブと役割が衝突。
  - **「届いたすれ違い」→ ○** 封筒メタファー（届く）と接続し、開封/未開封双方を包含し、既存空状態コピー「まだ封筒は届いていません」とトーンが揃う。
- 「どこで・いつ」を先に: `AccountCard`の`metaRow`は現在`@handle`＋フォロワー数。右側chipに`areaName`は既にある。2行目を「`labelFor(item)` · 日時」優先に組み替え、フォロワー数はchip側へ降格。

**反論・リスク**:
- overlay廃止でデスクトップの「地図の上にリストが浮く」情報密度は下がるが、提案の「地図を隠さない」が上位要求なので許容。
- `emptyOverlay`は地図カラム内に残す（未開封0件の案内は地図の上が自然）。ただし右ペインのグリッド空状態と文言が二重になるため、**デスクトップではグリッド側空状態を主、地図上のemptyOverlayは非表示**にする（`isDesktop`分岐1つ）。
- `romiLiteHome`キルスイッチ・`RadarStageBoundary`・マーカー上限ロジックは2カラム化で触らない（レイアウトのみの変更に留める）。

**具体案**:
1. `components/post/post-authenticated-screen.tsx`: デスクトップ分岐を上記2カラムJSXへ。`signalPanel`/`signalPanelDesktop`スタイル削除、`rightPane`（`width:360, borderLeftWidth:1, borderLeftColor:color.border`）追加。`signalGrid`は常に`layout="docked"`。
2. `components/organisms/signal-account-grid.tsx`: ヘッダー「新着アカウント」→「届いたすれ違い」、空状態タイトル「まだ新着アカウントはありません」→「まだすれ違いは届いていません」。`AccountCard`の`metaRow`を場所・日時優先に。

---

## (D) DESIGN.md違反（角丸8px）の扱い

**結論**: **DESIGN.mdが正、実装が逸脱**と判断する。ただし全画面一斉変更はせず、**今回触るコンポーネントだけ8px以下へ収束**させる。全体スイープは別タスクに切り出す。

**根拠**:
- DESIGN.mdは`layout: cardRadiusMax: 8`をトークンとして明記し、本文でも「標準カードの角丸は原則8px以下」「角丸カードを何重にも重ねた画面」をアンチパターンと断言している。20px/16pxはテンプレート由来の慣性で、思想を持った逸脱ではない。
- 後から書かれた`SignalAccountGrid`（panel: `borderRadius: 8`）は準拠している＝新しいコードほどDESIGN.mdに寄っており、収束方向はDESIGN.md側。
- 提案の「カードを減らし罫線と余白で区切る」はDESIGN.mdの「カードは反復項目・モーダル・入力フォームに限定」と完全に同じ方向。カード削減を先にやれば、角丸を直すべき箇所自体が減る。

**反論・リスク**: 「マイページだけ8px、他画面は20pxで不揃いになる過渡期が生じる」→ 生じる。ただし画面単位で揃っていれば違和感は小さく、全画面同時変更のほうが回帰リスクが大きい。過渡期を許容する。

**具体案**:
1. 今回のスコープ内で変更するもの（すべて`components/mypage/mypage-authenticated-screen.tsx`と`components/dashboard/*.tsx`のStyleSheet）:
   - `profileCard`: `borderRadius: 20 → 8`, `padding: 20 → 16`, アバター`72 → 52`（円形はアイコン・アバター例外なので`borderRadius: 26`の円のまま可）。
   - `section`/`my-signal-summary` `card`/`mypage-action-list` `section`/`host-events-summary` `card`: `borderRadius: 16 → 8`。ただしStep 5でカード自体を減らす（`backgroundColor`を外し`borderBottomWidth:1`の罫線区切りへ）ものはスタイル削除で解決。
   - `shareLocationButton`: `borderRadius: 16 → 8`。
   - `publicPagePreviewLink`: `minHeight: 36 → 44`（`layout.touchTargetMin`準拠）。プロフィール行内へ統合: `profileCard`下部に罫線区切りで配置。
2. スコープ外（別タスク化）: チェックイン画面・モーダル類・ボタン類の角丸。`theme/tokens/layout.ts`の値を参照していない直書き`borderRadius`の棚卸しはgrepで機械的に洗える。
3. `theme/tokens/layout.ts`に`cardRadius: 8`が未定義なら定数として追加し、今回触る箇所はトークン参照に置換（直書き再発防止）。

---

## (E) 実装順序の再評価

**結論**: 提案の順序は概ね妥当。**Step 0（コピー変更）とStep 2（サーバー型拡張）を挿入**した7段構成にする。各ステップは独立デプロイ可能。

| Step | 内容 | 触るファイル | 独立デプロイ |
|---|---|---|---|
| 0 | コピー統一: 「新着アカウント」→「届いたすれ違い」、「My Signal」→撤去（見出し再編はStep 4で） | `signal-account-grid.tsx` | ○ 文字列のみ |
| 1 | マイページ情報順序変更＋44px修正＋シェアCTA移設＋主催イベント行タップ化＋プロフィール縮小 | `mypage-authenticated-screen.tsx`, `host-events-summary.tsx` | ○ レイアウトのみ |
| 2 | **サーバー型拡張**: `latestLocation`追加（additive） | `dashboard-queries.ts`, `dashboard.ts` | ○ 旧クライアントは無視するだけ |
| 3 | `LatestFootprintCard`新設（マイページ）＋HomeStatusLine強化（ホーム、地図なし） | 新規`latest-footprint-card.tsx`, `home-status-line.tsx`, `post-authenticated-screen.tsx`(CTA dock整理) | ○ Step 2が本番反映済みであること（未反映でも`?? null`フォールバックで非表示になるだけ） |
| 4 | `MySignalSummary`再編: 2×2グリッド廃止 → 未開封は`MypageActionList`の強調行（オレンジ帯・`palette.kimitoOrange`）へ一本化、残り3統計は1行コンパクト表示「足あと128 · すれ違い24人 · 12都道府県」（行全体タップで図鑑へ） | `my-signal-summary.tsx`, `mypage-action-list.tsx` | ○ |
| 5 | カード削減＋角丸8px収束（(D)のスコープ） | マイページ系StyleSheet | ○ 見た目のみ |
| 6 | デスクトップ2カラム化 | `post-authenticated-screen.tsx`, `signal-account-grid.tsx` | ○ デスクトップ分岐のみ、モバイル無風 |

**根拠**: 型拡張はクライアントが使うStep 3より前に本番へ出す必要があるため、①と②の間が正位置。Step 6を最後に置くのは提案どおり（ホームはOOM実績のある画面で変更のブラスト半径が最大のため、他が安定してから）。

**反論・リスク**:
- 「Step 0-1を分けるのは細かすぎる」→ 0+1、4+5は同一PRに束ねてよい。ただし**Step 3（ホームを触る）とStep 6（ホームを触る）は必ず別デプロイ**にし、それぞれ実機ゲスト/認証済みで凍結有無を確認する（`romiLiteHome=1`での動作も毎回確認）。
- デプロイ検証: ディレクティブ4の注意どおり、ホーム系チャンク変更時はversion.json一致だけでなくマーカー文字列で配信確認。反映されない場合は`theme/tokens/index.ts`の`CDN_CACHE_EPOCH`+1。

---

## (F) 状態設計の実装可能性マトリクス

| # | 状態 | 判定式 | 既存データで可否 |
|---|---|---|---|
| 1 | 初回利用・足あと0件 | `data.trailCount === 0` | ○ `useMySignal`のみ |
| 2 | 今日未チェックイン | `!data.checkedInToday` | ○ 同上 |
| 3 | 今日チェックイン済み | `data.checkedInToday` | ○ 同上 |
| 4 | 未開封あり | `data.unopenedCount > 0` | ○ 同上 |
| 5 | 位置情報一時停止中 | `settings.locationPausedUntil > now` | △ `trpc.settings.get`が別途必要（ホームは取得済み・マイページも`settingsQuery`あり。新規取得は不要、propsで渡すだけ） |
| 6 | リアルタイム公開中 | `useLivePresenceControls().liveEnabled` | △ 同上（マイページに既存） |
| 7 | 通信中 | `isInitialQueryLoad(isLoading, data)`（`lib/authenticated-query-options.ts`に既存ヘルパー） | ○ |
| 8 | APIエラー | `query.isError` | △ データはあるがUI未実装。各ダッシュボードコンポーネントに「読み込めませんでした・再試行」1行＋`refetch`を追加する必要 |
| 9 | 地図だけ取得できない | `MapErrorBoundary`のフォールバック | △ 描画例外は既存boundaryで捕捉可。タイル画像404は空白になるだけ（許容。場所名テキストが常に併記されるため情報は失われない） |
| 10 | すれ違い0件だが足あとあり | `trailCount > 0 && encounterPartnerCount === 0` | ○ |

**ローディング**: 提案どおり「—」羅列をやめ、固定寸法スケルトンへ。`LatestFootprintCard`は高さを状態によらず固定（地図領域140px+テキスト2行分）、統計1行は`height: 20`固定のグレーバー。専用ライブラリ不要、`View`+`color.surfaceAlt`で足りる。

---

## 提案からの意図的な逸脱（実装者は変更しないこと）

1. **ホームに小地図は置かない** — OOM予算とJapanRadarMapとの重複のため。「最新の足あと」の地図付きフル版はマイページ、ホームはテキスト強化版。
2. **提案の理想モバイル構成末尾の統計行（足あと128/…）はホームに置かない** — 統計はマイページの管掌。ホームのDOM/情報量を増やさない。
3. **`MypageActionList`はホームへ移動しない** — ホームは画面自体が行動UIのため不要（(A)）。
4. 未開封CTAの新規コンポーネントは作らず、`MypageActionList`の未開封行の視覚強化で提案③を満たす（コード最小化）。

## 成功指標について（補足）

提案の指標のうち今すぐ計測系なしで拾えるのは「エラー・二重送信」（既存Sentry）程度。開封率・チェックイン到達時間は計測基盤が必要なので本再設計のスコープ外とし、必要なら別途イベントログ設計を起こすこと。
