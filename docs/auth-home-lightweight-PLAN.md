# 認証済みホーム（ポスト画面）軽量化設計書 — OOM対策

対象: `components/post/post-authenticated-screen.tsx` とその配下（japan-radar-map / envelope-pulse / character-here）。
作成: Fable 5（設計フェーズ）。実装は別モデルが本書に従って行う。
回帰の起点コミット: `e0cbccf`「居場所リアルタイム公開をレーダーに表示」（**単純revert禁止** — §8参照）。

---

## 1. 現状診断の要約（3行）

- OOMの真因は「**巨大SVG（700+要素）を常時DOM保持** × **無限アニメ50+本がcleanup無しで蓄積** × **presence定期refetchによるキャッシュ肥大**」の複合。
- 未開封N件×2ループ + 居場所M人×2ループ + sweepが全て `withRepeat(-1)` で、**どのuseEffectにもcleanupが無く**、画面離脱後もreanimatedのUIスレッドで走り続けGCを圧迫する。
- 重要な実測事実: **japan-radar-map.tsx の地図SVG自体は回転していない**（回転は `styles.radarSweep` のリング1枚だけ、地図は初回800msフェードインのみ）。→ 地図は静的画像化しても視覚的に完全等価。

## 2. 軽量化の設計思想（3行）

- 死守するもの: レーダーのメタファー（sweep回転・パルス・「○○にいるよ」吹き出し）＝「会いたい君がいる現在地」の情緒。**アニメの種類は消さず、同時に動く本数だけ絞る**。
- 最優先: 「常時保持されるもの（DOMノード・無限ループ・キャッシュ）」の総量を上限付きにする。上限を超えた分は「代表＋集約表示」で情報自体は失わない。
- 前提: 位置送信（LivePresenceRunner）・すれ違い判定・presence.list / encounter.list のデータ形・Clerk認証・6タブIAには一切触れない。

## 3. 施策一覧テーブル

| # | 施策 | 効果（推定） | 難易度 | リスク | 会議・実態との整合 | 判定 | ローカル検証方法 |
|---|------|------------|--------|--------|------------------|------|----------------|
| A | japan-radar-map の回転/フェード useEffect に **cleanup（cancelAnimation）追加** | 画面離脱後のUIスレッド常駐ループ0本化。リーク根絶 | ★（数行） | ほぼ無し | 会議3体一致。実コードでcleanup無しを確認済み | **即やる** | タブ切替後にreanimatedループが止まることをDEVカウンタで確認（§9） |
| B | japan-radar-map に **useReducedMotion 対応**（sweep静止） | reduced環境でループ1本削減＋a11y | ★ | 無し（RadarHudに前例あり） | 会議一致。RadarHud L53と同パターン | **即やる** | ChromeレンダリングタブでEmulate prefers-reduced-motion→sweepが固定角で静止 |
| C | **モバイルの地図SVGを事前レンダ静的画像（PNG/WebP）に置換** | DOMノード約700→1。OOM主因①の根絶 | ★★（アセット生成含む） | 低（地図は静止しているため見た目は等価） | 会議「簡略化SVG or 静的画像化」→ 実態調査で地図非回転が判明したため**静的画像が最適解** | **即やる** | モバイル幅で表示比較スクショ（before/after一致）＋Elementsパネルでノード数確認 |
| D | envelope-pulse / character-here に **cleanup＋reduced-motion＋`animate` prop** 追加 | マーカー由来ループを制御可能に（前提工事） | ★★ | 低 | 会議一致 | **即やる** | animate=false時にwithRepeatが呼ばれないことをDEVカウンタで確認 |
| E | **未開封は最新N件のみアニメ＋総数上限＋「他M件」集約チップ** | 20件時: ループ40本→6本、マーカーDOM 20→4 | ★★ | 中（表示ロジック変更。開封導線を壊さないこと） | 会議一致（代表N件＋集約） | **やる** | encounter 20件のモック/実データで、マーカー4個＋集約チップ表示・全件がシグナル一覧から開封可能なこと |
| F | **居場所マーカーはモバイル上限5人＋float停止（pulseのみ）＋「他M人」集約** | 5人超過時のループ増加を頭打ちに | ★★ | 中（isSelfは必ず表示に含める） | 会議一致（モバイルはpulse1つ・人数上限） | **やる** | presence 8人相当のデータでマーカー5＋チップ、自分が常に含まれること |
| G | presence.list の **refetchInterval をモバイルのみ90秒に延長**（現行は実測60秒。会議の「45秒」は誤認） | fetch頻度-33%、キャッシュ書換頻度減 | ★ | 低（STALE_MS=5分なので鮮度は保たれる。§6根拠） | 会議「45→90」を実態（60秒）に合わせ「60→90」に修正 | **やる** | Networkタブでpresence.listの間隔が90秒であること。バッジ/マーカー更新が5分以内に追従 |
| H | presence.list / encounter.list に **gcTime/staleTime 明示**（キャッシュ滞留の上限化） | 古いスナップショットの滞留防止 | ★ | 低 | 会議「query cache上限」 | **やる** | React Query Devtools（web）でキャッシュエントリがgcTime後に消えること |
| I | character-here の expo-image に **サイズ最適化オプション**（cachePolicy、40px表示前提） | プロフィール画像のメモリ小削減 | ★ | 無し | 会議「画像lazy decode」 | **やる** | Memoryプロファイルで画像デコードサイズ確認 |
| J | 地図の**遅延マウント（1フレーム後）＋ErrorBoundary** | 初期ピーク削減＋地図クラッシュ時もシェル生存 | ★★ | 低 | 会議「軽量シェル先出し」。lazy分割は済みなので**マウントタイミングとBoundaryのみ追加** | **やる** | 地図で意図的にthrowしてシェル＋空状態が出続けること |
| K | sweep回転を**タブ非フォーカス時に停止**（useFocusEffect） | タブ滞在外のループ0本 | ★★ | 低 | 会議の「offscreen停止」のRN Web安全版（Platform非依存） | **やる** | 別タブへ移動→DEVカウンタで0本、戻ると再開 |
| L | IntersectionObserverによるonscreen判定 | — | ★★★ | **高（RNネイティブで動かない）** | 会議の批判役が訂正済み。E/Fの件数上限で代替 | **却下** | — |
| M | e0cbccf の revert | — | — | **機能喪失** | 会議で否決済み | **却下** | — |
| N | 都道府県パスの手動間引き（簡略SVG作成） | Cと同等以下 | ★★★ | 中（見た目が変わる） | Cが視覚等価で上位互換のため不要 | **提案止まり**（Cが不可の場合の代替） | — |
| O | encounter.list のページング/仮想リスト化 | 封筒リスト大量時に効くが現状はFlatList未使用箇所が主 | ★★★ | 中 | 会議対象外。現状refetchInterval:falseで増分も無くOOM主因でない | **提案止まり** | — |

## 4. P0施策の詳細設計（A・B・C — japan-radar-map.tsx）

### 4-1. cleanup追加（施策A）

対象: `components/organisms/japan-radar-map.tsx` L16-24 の useEffect。

現状:
```
React.useEffect(() => {
  rotation.value = withRepeat(withTiming(360, { duration: 4000, ... }), -1, false);
  mapOpacity.value = withTiming(0.5, { duration: 800 });
}, []);
```

設計: reanimated の `cancelAnimation` をimportし、**同じuseEffectのreturnで両sharedValueをcancel**する。

```
return () => {
  cancelAnimation(rotation);
  cancelAnimation(mapOpacity);
};
```

これだけで「画面離脱後も回り続けるsweep」が根絶される。ロジック追加ゼロ・見た目変化ゼロの最安全施策。

### 4-2. prefers-reduced-motion 対応（施策B）

同useEffect内で、`useReducedMotion()`（reanimated。**RadarHud L53 の既存パターンをそのまま踏襲**）を参照:

- `reduceMotion === true` のとき: `rotation.value = 0` のまま withRepeat を開始しない（sweepリングは**固定角で表示は残す** — レーダーの視覚的アイデンティティは静止画でも成立する）。`mapOpacity.value = 0.5` を直接代入（フェード省略）。
- false のとき: 現行どおり。
- useEffect の依存配列に `reduceMotion` を追加。

「情緒を殺さない」線引き: sweepリング自体・地図・マーカーの**表示は消さない**。止めるのは動きだけ。

### 4-3. モバイルの地図を静的画像化（施策C）

**なぜ「静的画像」で「パス間引き」「回転停止」ではないか**: 実コードで確認済みのとおり、回転しているのは `radarSweep`（ボーダー付きの単純なViewリング）であり、**700+要素のSVG地図は初回フェード後は完全に静止**している。よって:

- 回転停止 → 見当違い（地図は回っていない）。sweepは軽量View 1枚なので残してよい。
- パス間引き → 効果はCの下位互換で、見た目が変わるリスクだけ増える。
- **静的画像 → DOM/メモリ上のSVGツリーが丸ごと消え、ピクセル出力は同一**。これが正解。

設計:

1. **アセット生成**: 現行SVG（viewBox 0 0 1000 1000、fill #1A2B4C）を 1024×1024 と 2048×2048 のPNG（またはWebP）に事前レンダし `assets/images/japan-radar-map@1x.png` / `@2x.png` としてコミット。生成はローカルの一回きりのスクリプト（`sharp` か `resvg-js`）でよく、リポジトリにはアセットだけ入れる。背景は透過（`NightSkyBackdrop` を透かす現仕様を維持）。opacity 0.5 は**焼き込まず**、現行どおりスタイル側で適用（フェードイン演出を保つため）。
2. **分岐**: `japan-radar-map.tsx` 内で `useResponsive()` の `isDesktop` を使い、
   - **モバイル**: `expo-image` の `<Image source={require(...)} style={{ width: mapSize, height: mapSize }} contentFit="contain" />` を `Animated.View`（mapOpacityフェードはそのまま）内に描画。SVGツリーは**マウントしない**。
   - **デスクトップ**: 当面は現行SVGを維持（メモリ余裕があり、拡大時のシャープさを保つ）。Phase3以降で問題があれば画像に寄せる。
3. `mapSize = minDim * 2.2` の計算・`viewBox`基準の `latLngToRadarPercent` 配置は**一切変えない**（マーカー座標は地図のレイアウトサイズに対する%配置なので、SVG→画像置換の影響を受けない）。
4. sweepリング（`radarSweep` 2000×2000のView）は現行のまま。

検証: モバイル幅(393px)で置換前後のスクリーンショットを重ねて一致確認（フェード完了後）。Elementsパネルで地図領域のDOMノードが700+→数個に減ること。

## 5. 多重アニメ制御の設計（D・E・F — RN Web前提、IntersectionObserver非依存）

方針: **onscreen判定はしない**。「そもそも動かすものの数を上限で絞る」方が、Platform分岐が不要で確実・テスト容易。件数上限は renderRadarStage（post-authenticated-screen.tsx L354-387）で行い、各マーカーは `animate: boolean` を受けるだけの受動的な部品にする。

### 5-1. 部品側の前提工事（施策D）

- `envelope-pulse.tsx` L28-39 と `character-here.tsx` L33-44 の useEffect に **cleanup（cancelAnimation×各sharedValue）** と **useReducedMotion** を追加（4-1/4-2と同型）。
- 両者に `animate?: boolean`（default true）を追加。false のとき:
  - EnvelopePulse: `pulseCircle` の withRepeat を開始せず、**静的な小さめリング（scale 1.4固定・opacity 0.35固定）を表示**。金色のコアドット＋「シグナル」ラベルは残す → 「そこに封筒がある」情報と見た目の統一感は維持。押下時の withSequence（開封ガチャ演出）は**1回きりのアニメなので全件維持**。
  - CharacterHere: `float`（吹き出し上下）を開始しない。`pulse`（地面リング）は `animate` に従う。吹き出し・アイコン・名前は常に表示。

### 5-2. 未開封封筒: 代表N件＋アニメ上限＋集約（施策E）

renderRadarStage 内、`unopened.map(...)` を次に変更:

- `occurredAt` 降順でソートし、**表示上限 MAX_MARKERS: モバイル4 / デスクトップ10**。`slice(0, MAX)` を地図マーカーとして描画。
- そのうち **アニメは先頭 ANIMATE_N: モバイル2 / デスクトップ4** のみ `animate=true`、残りは `animate=false`。
- あふれた分 `M = unopened.length - MAX` が1以上なら、地図右下（sisterBannerと重ならない位置）に**集約チップ**を1つ表示: `+他M通のシグナル`。押下でモバイルは直下の LazySignalAccountGrid へスクロール（scrollRef 利用）、デスクトップはグリッドが常時表示なので視線誘導のみ（チップ自体は Pressable でグリッドの先頭項目へフォーカスでも可、P2では非操作でも許容）。
- **開封導線は不変**: 全件は従来どおり LazySignalAccountGrid（シグナル一覧）から `handleOpen` で開封できるため、地図に出ない封筒も機能的に失われない。

情緒の線引き: 「新しく届いたシグナルが脈打つ」体験は最新2件で最も濃く出る。20個が同時に脈打つ状態はむしろ視認性が悪く、DESIGN.md の「装飾過多禁止」「操作判断を迷わせない」にも反していた。集約チップの文言はDESIGN.mdのコピー基準（短く・少し詩的・実用）に沿い `+他M通のシグナル` とする。

### 5-3. 居場所マーカー: 人数上限＋pulse一本化（施策F）

`(livePresence ?? []).map(...)` を次に変更:

- **isSelf を必ず先頭に含めた上で**、表示上限 モバイル5人 / デスクトップ12人。超過分は `+他M人がどこかにいる` チップ（5-2と同じ集約チップ領域に併記、または2行目）。
- モバイルは全員 `animate=false` 相当で **float停止**。pulse（存在の信号）は **isSelf＋最新3人のみ** true。デスクトップは float も許容（上限12人まで）。
- `delay={index * 120}` の初回スタガーは1回きりの演出なので維持。

### 5-4. 効果の見積り（未開封20件＋居場所5人・モバイル）

| | 現状 | 施策後 |
|---|---|---|
| 無限ループ本数 | 20×2 + 5×2 + sweep = **51本** | 封筒2×2 + presence pulse 4×1 + sweep = **9本以下** |
| 地図DOMノード | 700+ | 1（画像） |
| マーカーDOM | 25個 | 9個＋チップ2 |

## 6. メモリ底上げ（G・H・I）

- **G — refetchInterval**: post-authenticated-screen.tsx L252-255。現行は `Math.max(LIVE_PRESENCE_PULSE_INTERVAL_MS, 30_000)` = **60秒**（会議メモの「45秒」は誤認、実装時に混同しないこと）。これを `isDesktop ? 60_000 : 90_000` に変更。根拠: `LIVE_PRESENCE_STALE_MS = 5分`（live-presence.ts L6）なので、90秒間隔でもstale判定窓の中で3回以上更新され、「いまいる人」の鮮度は体感不変。`useLivePresenceSync` のAppState停止（実装済み）はデータ**送信**側であり、この変更は**受信**側 — 役割が違うので二重対策にはならない、が競合もしない。
- **H — キャッシュ上限**: 同ファイルの useQuery オプションに `staleTime: 30_000, gcTime: 5 * 60_000`（presence.list）、`gcTime: 10 * 60_000`（encounter.list）を明示。tRPC/React QueryのデフォルトgcTimeは5分だが、明示することで将来のデフォルト変更や画面追加でキャッシュが無際限に滞留するのを防ぐ。**select/データ形は変えない**（すれ違い判定に触れない）。
- **I — 画像**: character-here.tsx の `<Image source={{ uri }} />`（L70）に `cachePolicy="memory-disk"` と `recyclingKey={imageUrl}` を付与。表示は40pxなので、URLがX由来の `_normal`（48px）サフィックス画像であることを確認し、大判を取得していないかだけチェック（大判なら `_normal` に正規化する小変換をpresence表示側でなくこのコンポーネント内で行う）。

## 7. 「落ちない」構造保証（施策J — 過剰にしない）

既に lazy 分割・Suspense fallback（DeferredRadarFallback）はあるので、追加は2点だけ:

1. **遅延マウント**: post-authenticated-screen.tsx に `const [mapReady, setMapReady] = useState(false)` を追加し、`useEffect` 内 `InteractionManager.runAfterInteractions(() => setMapReady(true))`（RN Webでも動作する）。`renderRadarStage` は `mapReady` まで DeferredRadarFallback を返す。→ ヘッダー・シグナル一覧・空状態という**軽量シェルが先に確実に描画**され、初期メモリピークが分散する。
2. **ErrorBoundary**: `renderRadarStage` の Suspense を包む小さな class ErrorBoundary（同ファイル内 or `components/atoms/`）。fallback は「地図なしでも成立する静かな面」= 背景色のみのView（NightSkyBackdropが透ける）＋既存 emptyOverlay/signalGrid はBoundaryの外なので生存。**リトライボタン等は付けない**（過剰装備にしない。クラッシュ時は再訪で再マウントされる）。

やらないこと: シェルの二重実装、地図のプレースホルダー画像切替アニメ、メモリ監視による動的デグレード（複雑さに見合わない）。

## 8. e0cbccf の扱い

**revertしない。** 「居場所リアルタイム公開」はプロダクト価値（会いたい君が**いま**いる現在地）の核であり、会議でも維持で合意済み。重いのは機能ではなく実装の3点であり、それぞれ本書の施策が対応する:

| e0cbccfが持ち込んだ重さ | 対応施策 |
|---|---|
| CharacterHere×N人の無限float+pulse | D・F（cleanup＋pulse一本化＋人数上限） |
| presence.list の定期refetch | G・H（モバイル90秒＋gcTime） |
| プロフィール画像のロード | I |

データ契約（presence.list の型・LivePresenceRunner・pulse送信）は一切変更しない。

## 9. 実装フェーズ順序（安全な順）

共通の検証環境: Chrome DevTools → Device Toolbar「Pixel 5」(393×851) ＋ Performance タブ CPU 4x slowdown ＋ Memory タブ。アニメ本数の計測は、開発中のみ `__DEV__` で `withRepeat` 開始/cancel時にカウンタをconsoleに出す一時コード（コミット前に削除、またはdev専用ユーティリティ化）で行う。

### Phase 1（最小・最安全・最大効果）: A + B + D(cleanupとreduced-motionのみ)
- 変更ファイル: japan-radar-map.tsx / envelope-pulse.tsx / character-here.tsx の useEffect 3箇所のみ。表示ロジック無変更。
- 検証: `pnpm check` 0エラー → Pixel5エミュレートでホーム表示 → 別タブへ遷移 → アニメカウンタが0になること → 10分放置してJSヒープが単調増加しないこと。
- revert基準: マーカーやsweepが表示されない/固まる等の視覚退行が1つでもあれば該当コミットをrevert。

### Phase 2: C（地図静的画像化・モバイルのみ）→ E・F・K（上限＋集約＋フォーカス停止）
- Cを先に単独コミット（視覚等価の確認が独立してできるため）。
- 検証: before/afterスクショ比較、DOMノード数、未開封20件＋居場所5人相当（開発用にモックデータ or ステージング）で無限ループ本数 ≤ 9、開封導線（マーカー・シグナル一覧の両方から）が生きていること。
- revert基準: 地図の見た目差異が視認できる／集約チップで開封不能な封筒が生じる場合、E/Fのみrevert（Cは独立）。

### Phase 3: G・H・I・J（メモリ・構造）
- 検証: Networkタブで90秒間隔、React Query Devtoolsでキャッシュ回収、地図throw実験でシェル生存、`pnpm e2e:audit` 通過。
- revert基準: 居場所の更新が体感で遅い（5分超えて古い表示）／E2E退行。

各Phase完了ごとに: `pnpm check` → コミット → Pixel5エミュレートで「§11の成功基準」を再計測 → 数値が改善していなければ次Phaseに進まず原因を特定（効果のない施策を積まない）。本番反映はCLAUDE.mdディレクティブ4に従うが、**ローカルで効果と無退行を確認できたPhaseのみ**push対象にする。

## 10. 絶対に触るな / Stop & Ask

**触るな（このタスクのスコープ外・過去の事故箇所）**:
- ゲスト側のProvider/描画境界（`app/_layout` 系、ゲスト用スクリーン）— 別件OOM事故の地雷。今回の変更は認証済みホームの配下3コンポーネント＋post-authenticated-screen.tsxに限定。
- `modules/encounter/core/live-presence.ts` の定数・`useLivePresenceSync`・LivePresenceRunner（位置**送信**側）。
- presence.list / encounter.list のサーバ側・tRPCルーター・データ形。
- Clerk認証フロー、6タブのIA、`lib/japan-radar-position.ts` の座標変換。
- DESIGN.md のコントラスト契約・コピー基準に反する文言/色変更。

**Stop & Ask（止めて人間に聞く条件）**:
- 静的画像化(C)でモバイルの見た目に視認できる差が出る場合（アセット解像度で解決できないとき）。
- 集約チップの文言・配置がsisterBanner/emptyOverlayと衝突してレイアウト調整が必要になった場合（DESIGN.md判断が絡む）。
- Phase1実施後もPixel5エミュレートでヒープが単調増加する場合（＝本書の診断以外の原因があるサイン。追加調査を勝手に広げない）。
- `pnpm check` / `pnpm e2e:audit` の失敗が本変更と無関係に見える場合。

## 11. 成功基準（Pixel 5相当・未開封20件＋居場所5人）

| 指標 | 目標 | 測定方法 |
|---|---|---|
| OOMクラッシュ | 10分間の操作（開封3回・スクロール・タブ往復）で0回 | Pixel5エミュレート＋可能なら実機 |
| 無限アニメループ本数 | **9本以下**（現状51本） | DEVカウンタ |
| 地図領域のDOMノード | **10未満**（現状700+） | Elementsパネル |
| JSヒープ | 初期表示後 **150MB以下**、10分放置での増加 **+10MB未満** | Memoryタブ heap snapshot 2点比較 |
| フレーム | sweep回転がCPU 4xでも目視でなめらか、200ms超のLong Task が定常時に出ない | Performance録画 |
| デザイン | before/afterスクショで地図・sweep・マーカー・吹き出しの見た目が維持。最新シグナルは脈打つ。「会いたい君がいる現在地」の情緒が保たれている（DESIGN.md Anti-Slopチェック通過） | 目視＋スクショ比較 |
| 機能 | 全封筒が開封可能・居場所が5分以内の鮮度で更新・位置送信/すれ違い判定/認証に無変更 | 手動確認＋ `pnpm e2e:audit` |
