# 認証済みホーム OOM 再発 — 診断書 + 対処設計書 v2

作成: Fable 5（診断・設計フェーズ。実装は別モデルが本書に従って行う）
対象: `components/post/post-authenticated-screen.tsx` とその描画経路・データ層
本番確認: `https://surechigai.kimito.link/version.json` の commitSha = `0d55579`（Phase 3 まで反映済みであることを実際に取得して確認した）

作成経緯: COUNCIL-HOWTO.md の会議ハーネス（tsuioku-no-kirameki.com/scripts/meeting.mjs, COUNCIL_QUALITY=1）でOOM再発の仮説を発散・批判させ、その素材＋既存の地雷マップ（`docs/auth-home-lightweight-PLAN.md`、メモリ`surechigai-auth-home-oom.md`）をFable(claude-fable-5)サブエージェントに渡し、実コードを直接読んで裏取りさせた診断書。

---

## 0. TL;DR（3行）

1. **今回追加した HomeStatusLine / EnvelopeRail は引き金ではない可能性が高い**（コード監査で無限アニメ0本・DOM増は数十ノード・クエリ2本は既存キーの重複observerに近い）。既存の未解決課題（未実装のまま残った PLAN 施策 C/J/K）が、初めて実機で本気のテストを受けて顕在化したと判断する。
2. ただし**コード監査だけでは確定できない**（Phase1/2 の効果は一度も実機検証されていない＝「直った」という前提自体が未検証）。よって最初の一手は修正ではなく、**認証不要で誰でも押せる bisect 用キルスイッチ（`?romiLiteHome=1`）を本番に入れて、ユーザーの実機1回のアクセスで原因領域を二分すること**。
3. 構造的盲点を1つ発見した: **expo-router の Tabs はタブ切替で画面をアンマウントしない**ため、Phase 1 で入れた `cancelAnimation` cleanup は**タブ切替では一度も発火しない**。「cleanup済みだから安全」は成立しておらず、フォーカス外アニメ停止（施策K）が未実装のままなのが実効的な穴。

---

## 1. コード裏取りの結果（事実。すべて実ファイルで確認済み）

### 1-1. Phase 1/2 の対策は本番コードに残っている ✅

- `components/organisms/japan-radar-map.tsx` L37-40: sweep回転 + mapOpacity に `cancelAnimation` cleanup あり。`useReducedMotion` 対応あり。
- `components/molecules/envelope-pulse.tsx` L58-62 / `components/molecules/character-here.tsx` L61-65: 同様に cleanup + `animate` prop あり。
- `components/post/post-authenticated-screen.tsx` L378-381: 上限あり（モバイル: 封筒マーカー4・アニメ2、居場所マーカー5・アニメ3+self）。超過分は集約チップ。

**常時稼働する無限ループの実数（モバイル・ホーム表示中）**: sweep 1本 + EnvelopePulse 2個×2ループ + CharacterHere 最大3個×2ループ(float+pulse) = **約11本**。PLAN の見積り「9本以下」とほぼ整合。51本時代からは大幅減だが、ゼロではない。

### 1-2. PLAN の未実装項目（`docs/auth-home-lightweight-PLAN.md` は現存する）✅

| 施策 | 状態 | 裏取り |
|---|---|---|
| A/B/D/E/F（cleanup・reduced-motion・上限） | **実装済み** | 上記 1-1 |
| **C: 地図SVGのモバイル静的画像化（DOM 700→1）** | **未実装** | `japan-radar-map.tsx` に700+要素のSVGがそのまま存在。`mapSize = minDim * 2.2`（モバイルで約860px四方）で常時マウント |
| **G: presence.list refetch 60→90秒（モバイル）** | **未実装** | `post-authenticated-screen.tsx` L256: `Math.max(LIVE_PRESENCE_PULSE_INTERVAL_MS, 30_000)` = 60秒のまま |
| **H: gcTime/staleTime の明示** | **未実装** | presence.list / encounter.list にgcTime指定なし。しかも `clerk-root-provider.tsx` L236-237 で QueryClient デフォルトが `staleTime: 30分, gcTime: 2時間` と長い |
| **I: アバター画像最適化（cachePolicy / `_normal`正規化）** | **未実装** | `character-here.tsx` L92 の expo-image は素の `source={{ uri }}` |
| **J: 地図の遅延マウント + ErrorBoundary** | **未実装** | `renderRadarStage` は Suspense のみ。地図がクラッシュすると `TabAuthenticatedShell` の外側 Boundary まで巻き込み画面全体が死ぬ |
| **K: タブ非フォーカス時の sweep 停止** | **未実装** | リポジトリ全体に `useFocusEffect` / `useIsFocused` が**1件もない**（grepで確認） |

### 1-3. 新規追加コード（Phase 3 = `0d55579`）の監査 ✅

- `home-status-line.tsx`: View + Text 数個。アニメ0。副作用0。※`formatDateTime` を `precision-tile-map.tsx` から import しているが、同モジュールの import は react-native-svg どまりで MapLibre 等の重量物は引き込まない（確認済み）。
- `envelope-rail.tsx`: FlatList horizontal・上限5件・静的カード。アニメ0。`initialNumToRender` デフォルト(10) > 上限5 なので全件即レンダだが、5件×小カードで無視できる量。
- 新規クエリ2本の実態:
  - `dashboard.mySignal`: **実は新規ではない**。同じキーを `useScreenContextBar("post")`（同画面 L242）→ `useMySignal()`（`refetchInterval: 60_000`）が以前から観測しており、タブアイコン（checkin/events）も同様。Phase 3 はキャッシュ済みクエリへの observer 追加であり、ネットワーク・キャッシュの増分はほぼゼロ。ペイロードも十数フィールドのサマリー（`modules/encounter/api/dashboard.ts`）。
  - `settings.get`: 同じく `LivePresenceBadge`（AppHeader内）と `useLivePresenceSync` が既に観測済み。増分は observer 1つ。

**結論: 仮説C（新規クエリの同時発火）とE（FlatList肥大）は棄却してよい。** Phase 3 が加えたメモリ負荷は誤差レベルで、「とどめ」になったとしても真因ではない。

### 1-4. tRPC Provider 経路の裏取り ✅

- 認証済みユーザーの `/` 着地: `app/_layout.tsx` L91 の `shouldUseGuestWebShell()` は `hasClerkSessionHint()`（localStorage の clerk キー / `__session` cookie）が真なら false → **ゲスト用 defer 境界（GuestWebProviders）を通らず**、`ClerkRootProvider` → `ClerkAwareTRPCProvider`（`clerk-root-provider.tsx` L247: `trpc.Provider` が常時存在）→ … → `AuthenticatedScreenSlot` → `PostAuthenticatedScreen` の経路。**Provider 不在レースは構造上起きない。ゲスト側OOMと同型のバグではない。**
- 唯一の理論上の穴は「X OAuth 完了直後でまだ localStorage に clerk キーが無い一瞬に `/` を踏む」ケースだが、その場合レンダリングされるのは PostGuestScreen（`app/(tabs)/index.tsx` L13-19 のゲート）であり、認証済み画面が Provider 無しでマウントされる経路は無い。

### 1-5. 構造的盲点: cleanup はタブ切替では発火しない ⚠️（今回の最重要発見）

expo-router の Tabs（react-navigation bottom-tabs）は、一度訪問したタブ画面を**アンマウントせず保持する**（web では display:none）。よって:

- Phase 1 の `cancelAnimation` cleanup は**ログアウトやルート離脱時にしか走らない**。
- reanimated web のアニメは JS スレッドの rAF 駆動なので、**display:none でも回り続ける**。ホーム→チェックイン→軌跡…とタブを巡るほど、ホームの約11本に各タブのアニメが「足し算」されていく（checkin の pulse 等）。
- つまり「会議の仮説A」は表現としては正確: **アニメは止まっていない。cleanupは入ったが発火する機会がない。** 施策K（フォーカス外停止）が実効的な対策であり、未実装。

### 1-6. その他の発見（副次的）

- **デッドコード**: `post-authenticated-screen.tsx` の `renderItem` / `HistoryCard` / `opened`（L346, L356-373, L80-179）と `EnvelopeCard` import は、現在の JSX から一切参照されていない（FlatList を使う旧レイアウトの残骸）。バンドルと可読性の無駄。
- `components/organisms/night-sky-backdrop.tsx`（流れ星の無限 `Animated.loop` 3本持ち）は**どこからも import されていない**未使用ファイル。現時点で無害だが、`japan-radar-map.tsx` L299 のコメントが「背面の夜空を透かす」と参照しており、将来誰かが安易にマウントすると無限ループ+SVGが増える地雷。
- `presence.list` は 60秒 refetch に加え、`useLivePresenceSync` の pulse 成功ごとに `utils.presence.list.invalidate()`（`use-live-presence.ts` L146）が走るため、居場所ON時は実質**最大60秒に2回**書き換わる。
- `lib/query-persist-policy.ts` の非永続化リストに **`presence` と `event` が入っていない** → presence.list が更新されるたび（＝60秒ごと）に `PersistQueryClientProvider` がキャッシュ全体を `JSON.stringify` → localStorage 書き込み（`query-persister.ts` L27）。ペイロード自体は小さいので OOM 主因ではないが、低メモリ端末での定常 GC 圧として無駄。

---

## 2. 仮説の判定

| 仮説 | 判定 | 根拠 |
|---|---|---|
| A: アニメ停止漏れ再燃 | **有力（形を変えて真）** | cleanup はあるがタブ切替でアンマウントされず発火しない（§1-5）。フォーカス外停止は未実装 |
| B: presence.list キャッシュ肥大 | **部分的に真（副因）** | gcTime 2時間デフォルト + 60秒×2系統の書き換え + 永続化対象。ただし1件あたりのデータが小さく、単独でOOMには届かない |
| C: 新規tRPCクエリ同時発火 | **棄却** | 両クエリとも既存キーへのobserver追加（§1-3） |
| D: 地図SVG 700要素の残存 | **有力（主因候補）** | 施策C未実装。約860px四方・700+ノードのSVG + その上で2000×2000のレイヤーが常時回転 |
| E: FlatList/DOM増加 | **棄却** | 上限5件・静的カードのみ |
| 逆張り案（全機能OFFで切り分け） | **採用（形を変えて）** | §4-1 のキルスイッチとして本番に組み込む。認証検証不能という制約下で最も情報量が多い一手 |

### 診断結論

**「今回のコードがとどめを刺した」のではなく、「Phase 1/2 で直り切っていなかったものが、Phase 3 デプロイ後のアクセスで観測された」が最有力。** 根拠:

1. Phase 1/2（アニメ51→11本）の効果は**一度も実機で検証されていない**（メモリ記録どおり）。「Phase 1/2 後は安定していた」という比較対象データが存在しない。
2. Phase 3 の増分は監査上ほぼゼロ（§1-3）。
3. 残っている大物（SVG 700ノード + 2000pxの回転レイヤー + rAF 11本 + フォーカス外停止なし + gcTime 2時間）は、いずれも PLAN が「OOM主因」と特定しながら未実装のまま残した項目。

ただしこれは状況証拠による推定であり、**断定には §4-1 の bisect が必要**。実装者は「修正を積んでから祈る」のではなく、bisect結果を見てから修正の当たりを確認する順序を守ること。

---

## 3. 対処設計（優先順位・検証ゲート付き）

### Phase 0: 切り分けスイッチ + 防御壁（最優先・当日中に出す価値がある）

**0-1. `?romiLiteHome=1` キルスイッチ（新規・小）**

- `post-authenticated-screen.tsx` に、web のみ `new URLSearchParams(window.location.search).has("romiLiteHome")` ‖ `localStorage.getItem("romiLiteHome")` で判定する `liteMode` を追加（既存の `romiAuthDebug` パターン = `clerk-root-provider.tsx` L117-123 を踏襲）。
- `liteMode` 時: `renderRadarStage()` を丸ごと描画せず、代わりに静的な空Viewと「軽量表示中」の一行を出す。HomeStatusLine / EnvelopeRail / signalGrid / CTA はそのまま。
- **これで認証済みユーザー本人が URL を1回踏むだけで二分探索が完了する**: lite で OOM が消える → 原因はレーダーステージ配下（施策C/K/Jへ直行）。lite でも OOM → 原因は画面外（presence/persist/Clerk/SW 側の再調査。Stop & Ask）。
- 実装後もこのフラグは**恒久的に残す**（今後の回帰切り分け資産）。

**0-2. 施策J: レーダーステージ専用 ErrorBoundary + 遅延マウント（PLAN §7 のとおり）**

- `renderRadarStage` を小さな class ErrorBoundary で包む。fallback は背景色のみのView。→ 地図起因のクラッシュでもステータスライン・封筒レール・シグナル一覧という「使える画面」が生き残る。
- `InteractionManager.runAfterInteractions`（または web は `requestIdleCallback`）まで地図マウントを遅らせ、初期ピークを分散。
- 検証ゲート: 地図コンポーネントで意図的に throw してシェルが生存すること。`pnpm check` 0。

### Phase 1: レーダーステージの実メモリ削減（bisect が「レーダー側」を示した場合の本命。示す前でも着手価値あり）

**1-1. 施策C: モバイル地図SVGの静的画像化（PLAN §4-3 の設計をそのまま使う）**

- 現行SVG（viewBox 0 0 1000 1000）を透過PNG/WebP 1024/2048px に事前レンダし `assets/images/` へコミット。モバイルは expo-image、デスクトップは当面SVG維持。`mapSize` 計算とマーカー%配置は不変。
- 検証ゲート: モバイル幅 before/after スクショ一致、地図領域DOMノード 700+→10未満。

**1-2. 施策K: フォーカス/可視性でアニメを止める（§1-5 の穴を塞ぐ本丸）**

- `post-authenticated-screen.tsx` で `useIsFocused()`（@react-navigation/native。expo-router から re-export あり）を取り、`focused` を `JapanRadarMap` / `LazyEnvelopePulse` / `LazyCharacterHere` の `animate` 系 prop に AND 条件で流す。`japan-radar-map.tsx` には `active?: boolean` prop を追加し、false で `cancelAnimation(rotation)`（useEffect の依存に含めれば既存 cleanup 構造のまま実現できる）。
- web ではさらに `document.visibilitychange` で hidden 時に停止（ブラウザタブ切替対応）。
- 検証ゲート: DEVカウンタ（PLAN §9 の方式）で、別タブ滞在中の稼働ループ本数が **0本**、戻ると再開すること。

### Phase 2: メモリ底上げ（bisect の結果に関わらずやる。小粒・低リスク）

- **施策G**: presence.list `refetchInterval` をモバイル 90秒に（`isDesktop ? 60_000 : 90_000`）。
- **施策H+α**: presence.list / encounter.list に `gcTime` 明示（5分/10分）。加えて `clerk-root-provider.tsx` の QueryClient デフォルト `gcTime: 2時間` を **30分**へ短縮（低メモリ端末で2時間分の全タブキャッシュ滞留は過剰）。
- **永続化ポリシー**: `query-persist-policy.ts` の `NON_PERSIST_ROUTERS` に `presence` を追加（60秒ごとの localStorage 全量シリアライズを止める。居場所はリアルタイムデータであり再訪時に古いキャッシュを出す意味もない）。
- **施策I**: `character-here.tsx` の expo-image に `cachePolicy="memory-disk"` + `recyclingKey`、X画像URLの `_normal`（48px）正規化。
- **デッドコード削除**: `renderItem` / `HistoryCard` / `opened` / `EnvelopeCard` import（§1-6）。`night-sky-backdrop.tsx` は削除するか「マウント禁止」コメントを付ける。
- 検証ゲート: `pnpm check` 0、Networkタブで90秒間隔、React Query Devtools で gcTime 後のキャッシュ回収。

### Phase 3: 認証込み検証基盤の常設化（「実機検証できない」制約の恒久解）

1. **Playwright storageState 方式**: このリポジトリの環境には `playwright-headless-recording` スキル（ログイン状態を一度保存→セッション再利用してヘッドレス実行）が既にある。これを流用し、**ユーザーに1回だけ有人ログインしてもらって `auth-state.json` を保存** → 以後 Claude が認証済みホームをヘッドレスで開ける状態を作る。
2. **OOM 再現・監視ハーネス**（新規スクリプト `scripts/auth-home-soak.mjs` 想定）:
   - Playwright で mobile viewport（Pixel 5 相当 393×851）+ CDP `Emulation.setCPUThrottlingRate(4)`。
   - **`page.on("crash")` イベントで OOM クラッシュを機械検出できる**（Chromium はタブOOM時に crash を発火する。これが「OOMが起きたか」を認証込み・無人で判定する決定打）。
   - CDP `Performance.getMetrics` の `JSHeapUsedSize` / `Nodes` を10秒ごとにサンプリングし、10分ソークで単調増加していないかを CSV に落とす。
   - 再現を加速したい場合は Chromium 起動引数 `--js-flags=--max-old-space-size=256` でヒープ上限を人工的に絞る（実機の低メモリ条件の近似）。
3. **本番用メモリデバッグオーバーレイ `?romiMemDebug=1`**: `AuthDebugPanel`（`clerk-root-provider.tsx` L125）と同型で、`performance.memory.usedJSHeapSize` と DOMノード数を右下に表示。ユーザーの実機スクショ1枚で数値が取れるようになる。
4. 検証ゲート: ソークテストが CI ではなくローカル手動運用でよいので、**Phase 1 実装前後で同条件2回計測し、ヒープと Nodes の差分を数値で残す**こと（PLAN §11 の成功基準を流用: 初期150MB以下、10分で+10MB未満、クラッシュ0）。

---

## 4. 実装者への注意（触るな / Stop & Ask）

**触るな**（PLAN §10 を継承。今回の裏取りで追加確認済み）:
- ゲスト側 defer 境界（`guest-web-providers.tsx` / `trpc-ready-context.tsx` / `clerk-public-routes.ts`）— 別件OOMの解決済み地雷。今回の経路と無関係であることを確認済みなので触る理由がない。
- `useLivePresenceSync` / `LivePresenceRunner`（位置送信側）、presence/encounter のサーバ側・データ形。
- Clerk 認証フロー、`lib/japan-radar-position.ts`。

**Stop & Ask**:
- `?romiLiteHome=1` でも OOM が再現した場合（＝原因がレーダー外。本書の診断を超えるので追加調査を勝手に広げない）。
- 静的画像化でモバイルの見た目に視認できる差が出る場合。
- ソークテストで Phase 1 実装後もヒープが単調増加する場合。

**デプロイ順序**: CLAUDE.md ディレクティブ4 に従い各 Phase をコミット→push→version.json 確認まで行うが、**Phase 0 を単独で先に出す**こと（キルスイッチが本番に無いと bisect が始まらない）。Phase 1 以降は Phase 3 のハーネスで前後比較の数値が取れてから。

---

## 5. 成功基準

| 指標 | 目標 | 測定 |
|---|---|---|
| ユーザー実機での OOM | `?romiLiteHome` 無しの通常表示で 0回（10分操作） | ユーザー確認 + Playwright crash イベント 0 |
| タブ非フォーカス時の無限ループ | **0本**（現状: ホーム分約11本が回り続ける） | DEVカウンタ |
| 地図領域 DOMノード | 10未満（現状 700+） | `?romiMemDebug` / CDP Nodes |
| JSヒープ | 初期150MB以下、10分ソークで +10MB未満 | ソークハーネス CSV |
| UX | sweep・パルス・吹き出し・封筒レール・ステータスラインの見た目維持（フォーカス中は現状と同一） | before/after スクショ |
| 機能 | 全封筒開封可・居場所5分以内鮮度・位置送信/認証に無変更 | 手動 + `pnpm e2e:audit` |

---

## 付記: 会議仮説素材の採点

- 会議の優先順位観「1) フォーカス外アニメ停止 2) 遅延マウント+ErrorBoundary 3) キャッシュ調整 4) 地図静的画像化」は概ね正しいが、**「cleanupが入っているから止まっているはず」という前提が全員誤り**だった（タブはアンマウントされない）。
- gpt-oss の逆張り案（全OFF切り分け）が、認証検証不能というこのプロジェクト固有の制約下では**最も価値の高い提案**だった。本設計では本番組み込みのキルスイッチとして採用した。
- 「30-50MB」等の数値見積もりは全て未検証のため本書では不採用。数値は Phase 3 のハーネスで実測してから語る。
