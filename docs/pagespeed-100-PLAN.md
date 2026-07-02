# PageSpeed 100 実行計画書（モバイル）

**改訂 2026-07-02 v2: 新実測反映**（初版 2026-07-02 / Fable 設計フェーズ）
**対象:** surechigai.kimito.link ゲスト `/` 初回表示
**実装担当への申し送り:** v1 の施策 S1〜S5 は**本日 `b769c2b` / `ed01671` で実装済み**（§0 参照）。この v2 はその実測結果を踏まえた「次の一手」。順序どおりに進め、各 Phase の終わりに PSI（Google 実サーバー）とローカル LH の**両方**で再計測し、悪化したら即 revert。

---

## 0. v1 からの差分サマリ — まず事実関係の訂正

**「S1 未実施」という前提は誤り。リポジトリの実物で確認済み:**

| v1 施策 | 実施状況 | 証拠 |
|---------|---------|------|
| S1 ファンネル化 | ✅ **実装済み**（`b769c2b` 2026-07-02 13:07） | `components/tabs/authenticated-screen-funnel.tsx` + `authenticated-screen-slot.tsx`。6 タブ全てが Slot 経由（例 `app/(tabs)/index.tsx:23`） |
| S2 `.browserslistrc` | ✅ 実装済み（同上） | リポジトリ直下に存在。`_classCallCheck` 等はバンドルから消滅確認済み |
| S3/S4 layout lazy | ✅ 実装済み（同上） | `app/_layout.tsx` の OnboardingGate lazy 化等。root `_layout` chunk 268KB→16KB |
| S5 `sideEffects` | ✅ 実装済み | `package.json:10-18` |
| MaterialIcons SVG 化 | ✅ 実装済み（`ed01671`） | ゲスト `/` の初回 349KB フォント要求は消滅 |

**実装の結果（`docs/investigation/pagespeed-100-after-local.md` に記録済み）:**

- ローカル Lighthouse（simulate）は `ed01671` 時点で **96 / 97 / 97**（14:21 JST 記録）。
- しかし `__common` の**ファイルサイズはほぼ不動**: 2,179KB → 2,170KB（−8.9KB）。source size は −471KB 減ったが minify 後は変わらず。現 dist 実物も 2,146KB。
- そして **PSI（Google 実測）は 69**、同日 18:53 のローカル再計測は **63 / LCP 17.9s**。

つまり v2 の出発点はこう変わる: **「S1 をやる」ではなく、「S1 をやっても `__common` 2.1MB が残り、かつ LCP がハイドレーション依存で計測ごとに崩壊する」構造への対処**。本命は §4（LCP=FCP 化）と §5（第2世代デホイスト）の 2 本柱。

## 1. 現状診断 — 3 つの計測値の使い分け

| 計測 | 時刻(JST) | スコア | LCP | TBT | SI | FCP | 位置づけ |
|------|-----------|--------|-----|-----|-----|-----|---------|
| ローカル LH（`ed01671` 直後） | 07-02 14:21 | **96-97** | 1.2-1.4s | 170-210ms | 1.2-2.9s | 1.2s | 過去最良。**再現条件の特定が必要** |
| ローカル LH（`pagespeed-report.json`） | 07-02 18:53 | **63** | **17.9s（97%が Render Delay）** | 320ms | 5.6s | 1.4s | 内訳分析用。LCP 絶対値は鵜呑み禁止 |
| **PSI（Google 実サーバー）** | 07-02 | **69** | **5.7s** | 290ms | 4.9s | 0.9s | **主目標。以後スコアはこれで語る** |

- **同一マシン・同一日で 97 → 63**。この間のコミットは `ac160ae`〜`69e9894`（one-tap X login 復元 / auth ページ静的チャンク化 / presence 修正）。回帰かノイズかは未確定 → Phase 4 の Gate 1 で最初に切り分ける（§9）。
- 初回同期ロード JS（dist 実測、いずれも `defer`）: `__common` 2,146KB + `entry` 985KB + metro-runtime 10KB + `_layout`×2 26KB + `index` 7KB ≈ **3.17MB raw**。PSI の「JS合計3,160KB」と一致。
- PSI 診断: レンダリングブロック 1.45s / キャッシュポリシー 11 リソース / 未使用 JS 552KB / レガシー JS 2 本。→ §6・§8 で個別に扱う。**注意: 「未使用JS」「キャッシュポリシー」「レガシーJS」はいずれも診断（diagnostics）であり、スコア重みは 0**。スコアは 5 メトリクス（FCP10% / SI10% / LCP25% / TBT30% / CLS25%）のみで決まる。診断項目をスコア目的で追わない。

## 2. 効果の物理（v2 更新）— LCP の正体は「SSG 済みテキストのハイドレーション再ペイント」

v1 は「LCP 要素はハイドレーション後にしか確定しない」と書いたが、**実測で半分否定された**。新しい事実:

1. **LCP 要素は `components/post/post-guest-screen.tsx:52-54` の `heroSub`**（「移動の足あとを残して、すれ違いと聖地巡礼を」）。`pagespeed-report.json` の `largest-contentful-paint-element` で確定。
2. **この要素は静的エクスポート HTML に既に含まれている**。`dist/index.html`（49.9KB）は expo の static rendering でゲストホーム全体（ヒーロー・CTA・ベネフィット行まで）を SSG 済み。フォントも system-ui のみで Web フォント待ちなし。
3. それなのに LCP phase 内訳は **TTFB 3% / Load Delay 0 / Load Time 0 / Render Delay 97%（17.3s/17.9s）**。
4. **結論: 初回 HTML のペイント（FCP 0.9-1.4s）では LCP が確定せず、`__common`+`entry` 実行完了後（＝ハイドレーション時）に同要素が「再ペイント」され、その時刻が LCP として記録されている。** JS 完了時刻は throttling で激変する（PSI 4G→5.7s / ローカル simulate→17.9s / 好条件→1.2s）。**これが LCP 不安定性（97↔63）の唯一の説明**。

最有力メカニズム: ハイドレーション時に React が SSG DOM を採用（adopt）できず、hero 周辺のノードが**破棄→再生成**されている（hydration mismatch、または Suspense/asyncRoutes 境界の remount）。DOM ノードが作り直されると LCP に新エントリが立ち、CLS 0 のまま LCP だけ後ろへ飛ぶ — 観測と完全に一致する。

**したがって 100 点への物理は 2 段:**
- **(A) LCP を JS から切り離す**: 再ペイントを止め、SSG の初回ペイント（0.9-1.4s）をそのまま LCP として成立させる。成功すれば **LCP はバンドルサイズと無関係になり、どの計測環境でも安定**する。→ §4
- **(B) TBT/SI を JS 削減で下げる**: LCP が直っても TBT 290ms / SI 4.9s が 100 を阻む。`__common` 2.1MB の parse/eval が源泉。→ §5

## 3. 施策一覧テーブル（v2: 新実測での効果再評価つき）

| # | 施策 | v1 判定 | **新実測での効果再評価** | 新判定 |
|---|------|---------|--------------------------|--------|
| S1 | 認証画面ファンネル化 | 本命 | **実施済み**。auth 6 chunk→1 funnel(142KB)、root _layout −252KB。ただし `__common` file size −8.9KB のみ。「__common を痩せさせる」目的は未達 | **完了（不足）→ S10 へ継承** |
| S2 | `.browserslistrc` | 即やる | **実施済み**。レガシーヘルパー消滅を確認。PSI「レガシーJS 2本」の残りはサードパーティ（§8）で自前では消せない | **完了** |
| S3/S4 | layout lazy 化 | 即やる | **実施済み**。gesture-handler はクライアント chunk から消滅確認済み | **完了** |
| S5 | `sideEffects` | 下地 | **実施済み**（no-op 確認済み） | **完了** |
| **S9** | **LCP=FCP 化（ハイドレーション再ペイント解消）**（§4） | — | ★★★★★ LCP 5.7s→0.9-1.4s 相当 / **+15〜22点** / 計測不安定性の根治。**100 点の必要条件** | **新本命 A（Phase 4）** |
| **S10** | **`__common` 第2世代デホイスト**（§5） | — | ★★★★ Atlas 実測で `__common` に Clerk(@clerk/react+shared)・reanimated 群・buffer 等が残存。async 起点の再統合で raw −0.6〜1.2MB / TBT 290→150ms 級 / SI 改善 | **新本命 B（Phase 5）** |
| **S11** | **render-blocking CSS のインライン化**（§6） | — | ★★ PSI「レンダリングブロック 1.45s」の実体はほぼ `web-*.css`（10.9KB）1 本。HTML へインライン化で往復 1 回分の FCP/LCP 前倒し | **やる（Phase 4・低リスク）** |
| S6 | Metro 実験 tree-shaking | 提案止まり | 変更なし（実験フラグのリスク据え置き） | 提案止まり |
| S7 | LCP 先出し | 条件付き | **S9 に吸収・具体化**（「同期テキスト優先の延長」の最終形が S9） | S9 へ統合 |
| S8 | SW precache | 優先度下 | 変更なし（初回スコアに 0 効果） | 提案止まり |
| — | 静的 LCP HTML シェル（+html.tsx へフォールバック HTML 追加） | 却下 | **却下のまま**。S9 は「新規 HTML を足す」のではなく「既にある SSG HTML を React に採用させる」方向であり別物（§4-D で峻別） | **却下維持** |
| — | Clerk/tRPC/Sentry defer、MapLibre、DOM/画像/CLS、transform-import-meta 削除 | 却下 | 変更なし | **却下維持** |
| — | Speed Insights / Clerk telemetry を外す（§8） | — | **スコア重み 0 の診断項目**であり、100 点の必要条件ではない。load 後実行を trace で確認の上「残す」が既定 | **原則やらない** |

## 4. 新本命 S9 — LCP=FCP 化（ハイドレーション再ペイントの解消）

### 4-A. Gate（実装前の裏取り・必須）

仮説「hero ノードがハイドレーションで再生成されている」を先に確定させる。`npx serve dist`（または本番 URL）で:

1. **DevTools コンソールに React の hydration mismatch 警告が出るか**（`Hydration failed` / `Text content does not match` / Error #418/#423）。出れば一発で確定。
2. **Performance トレースで LCP エントリが 2 回立つか**: `PerformanceObserver`（type `largest-contentful-paint`, `buffered:true`）で entry を全部出し、`element` と `startTime` を記録。1 回目 ≈FCP・2 回目 ≈JS 完了なら仮説どおり。
3. **ノード同一性**: ハイドレーション前に hero の DOM ノードへ `node.__probe=1` を付け、5 秒後に消えていれば「破棄→再生成」確定。
4. 記録は `docs/investigation/lcp-rehydration-probe.md` へ（before スナップショット）。

**Gate 判定:** 再生成が確認できなければ S9 の設計は成立しない → Stop&Ask（その場合 LCP は「本当に JS 後にしか出ない」ことになり、100 点の到達可能性判定が変わる）。

### 4-B. mismatch 候補（調査順・ファイル粒度）

SSG（Node 実行）とクライアント初回レンダーで出力が変わり得る箇所。上から順に潰す:

1. **`app/_layout.tsx:92` `deferNativeWind`** — ゲスト `/` で `ThemeProvider deferNativeWind=true`。SSG 時に NativeWind スタイルつきで出力した DOM を、クライアントが「defer 中」の状態で初回レンダーすると class/style が食い違う可能性。SSG 時とクライアント初回で同じ値になるよう初期値を固定する。
2. **`useWindowDimensions` / `useWebSideNavActive`** — SSG では width 0 → `app/(tabs)/_layout.tsx:69` の `compactTabs`（<480）や side-nav 判定がクライアント実寸と食い違う（特にデスクトップ）。モバイル計測では両方 true で一致するはずだが、初期値の由来（`initialWindowMetrics`）を確認。
3. **Suspense/asyncRoutes 境界** — `dist/index.html` の body に `<!--$-->` マーカーあり。expo-router `asyncRoutes: web` 下で index ルートの lazy 解決がハイドレーションと競合し、境界ごと client-render に落ちていないか（React DevTools Profiler か `onRecoverableError` で捕捉）。
4. **`app/_layout.tsx` の `useEffect` 群**は初回レンダー後なので mismatch 源ではない。触らない。

### 4-C. 直し方の原則

- **方向は常に「クライアント初回レンダーを SSG 出力に合わせる」**。SSG 側に新しい HTML を足さない。
- mismatch が特定の Provider の初期値なら、初期値を SSG と同値に固定（例: defer フラグの初期整合）。
- 境界 remount が原因なら、hero を含むゲストホーム部分が lazy/Suspense の内側に落ちないよう境界位置を調整（`PostGuestScreen` は既に同期 import — `app/(tabs)/index.tsx:6` — なので境界は上位レイヤ側）。
- **成功判定: PSI とローカル LH の両方で LCP phase の Render Delay が 10% 未満**（＝Load/TTFB 支配）になり、LCP ≈ FCP になること。これが「どの環境でも安定」の定義。

### 4-D. 却下済み「静的 LCP シェル」との峻別（地雷を踏まない条件）

- 🔴 `becdb51`→`c15090b` で撤回されたのは「`+html.tsx` に**フォールバック HTML を追記**し、React マウント後に実 UI と**二重表示**になった」件。
- S9 は **HTML を 1 バイトも追加しない**。既に expo が生成している SSG DOM を React のハイドレーションに正しく採用させるだけ。二重表示の物理的余地がない（DOM は常に 1 系統）。
- 禁止条件を明文化: (a) `app/+html.tsx` にコンテンツ HTML を足さない、(b) `dist` の後加工で body に要素を注入しない、(c) 検証は `pnpm e2e:audit` 全 green ＋ `/zukan` `/events` の二重表示目視（Playwright スクリーンショット）を必須とする。

## 5. 新本命 S10 — `__common` 第2世代デホイスト

### 5-A. Atlas 実測で判明している `__common` の中身（after スナップショットより）

`__common`（2,170KB / **762 モジュール**）の上位: `@clerk/react` 66+58KB、`@clerk/shared` 40KB、`MaterialIcons.json` 44KB、`tailwind-merge` 21KB、`react-native-reanimated` 多数（util/Zoom/Colors/index…）、`buffer` 21KB。**ゲスト `/` が 1 バイトも実行しない Clerk・reanimated が初回同期ロードに乗り続けている。**

原理は v1 §2 と同じ:「2 つ以上の async チャンクから static import されたモジュールは `__common` へ巻き上げ」。S1 で auth **画面**は 1 本化したが、**async 起点はまだ多数残っている**:

| async 起点 | 場所 | 巻き上げの共犯関係 |
|-----------|------|-------------------|
| `clerk-root-provider`（4,993KB chunk） | `app/_layout.tsx:31` | Clerk を import |
| `onboarding-gate`（258KB chunk） | `app/_layout.tsx:36` | Clerk/共有 UI を import の疑い（10 モジュールで 258KB は依存の複製/巻き上げの兆候） |
| auth ページ静的チャンク（`sign-in` 等、`ca1577c`） | `app/auth/*` | Clerk を import → **clerk-root-provider と 2 起点になり Clerk が `__common` へ** |
| tab icon lazy ×2 + `tab-authenticated-chrome` | `app/(tabs)/_layout.tsx:22-36` | funnel と依存共有（reanimated 等） |
| prefetch 小物 4 本（web-trail-map / event-calendar / envelope-pulse / character-here） | `lib/bootstrap/prefetch-tab-chunks.ts:3-12` | funnel 内画面と依存共有 |
| guest 小物 2 本（events-guest-content / public-web-providers） | 同 :14-17 | ゲスト側依存を共有 |

### 5-B. 設計 — async 起点の統合・第2ラウンド

方針は会議合議「分割しすぎるな」の続行。**dynamic import の「起点の数」を減らす**:

1. **Clerk ファンネル**: Clerk を消費する全 lazy 起点（clerk-root-provider / onboarding-gate / auth ページ群）が **1 つの chunk 系列**に収まるよう、auth ページの実装を clerk-root-provider 側チャンクから re-export する形へ寄せる（または auth ページの lazy を clerk-root-provider 経由の単一ファンネルに変更）。**成功判定: Atlas で `@clerk/*` が `__common` から消える**。
2. **tab 付随 UI の統合**: `(tabs)/_layout.tsx` の 3 つの lazy（checkin-tab-icon / events-tab-icon / tab-authenticated-chrome）を 1 本の lazy（例: tab-authenticated-chrome に icon 2 種を re-export）へ。
3. **prefetch 小物の統合**: `PREFETCH_MODULES` の web-trail-map / event-calendar / envelope-pulse / character-here が funnel 内画面からも static import されているか Atlas で確認し、されていれば **funnel から re-export して個別 dynamic import を廃止**（prefetch は funnel 1 本で足りる）。**注意: v1 の「naive な re-export ファンネルで `__common` が 2.37MB に膨れた」失敗が after ドキュメントに記録済み** — 単純 re-export ではなく、S1 で採用された「単一 loader + funnel」パターンを踏襲すること。
4. reanimated が「funnel × guest 側チャンク」の共有で残る場合は、guest 側（envelope-pulse/character-here 等）から reanimated 依存を外せるか個別判断（外せなければ受け入れる — ここが構造下限）。

### 5-C. 期待値（正直なレンジ）と検証

- 削減見込み: Clerk 系 + reanimated 群 + 小物で **raw −0.6〜1.2MB**（`__common` 2.1MB → 0.9〜1.5MB）。確定は Atlas after で。
- スコアへの効き先は **TBT（290→150-200ms）と SI（4.9→3.5s 前後）**。S9 完了後なら LCP には効かない（それが正しい状態）。
- 検証: `EXPO_ATLAS=1 npx expo export -p web` → `__common` のモジュール数/サイズ比較 → PSI ×3 → `pnpm e2e:audit`（認証タブ全通過）。

## 6. render-blocking CSS のインライン化（S11・新規）

- dist の render-blocking リソースは実質 `/_expo/static/css/web-*.css` **10.9KB の 1 本**（JS は全て `defer`）。PSI throttling（RTT 150ms）では往復分がまるごと FCP/LCP を遅らせ、PSI 診断の 1.45s の主体。
- **設計:** エクスポート後処理（deploy workflow 内の Node スクリプト）で、`dist/**/*.html` の `<link rel="stylesheet" href="/_expo/static/css/...">` を `<style>` インライン（10.9KB → HTML 49.9→61KB 程度）に置換。元の `<link>` は削除。
- **条件:** `app/+html.tsx` には触らない（§4-D）。後処理は `<head>` 内の link→style 置換のみで body 不可侵。SW（`public/sw.js`）は HTML を network-first で扱うため悪影響なし。
- 効果: FCP/LCP −0.3〜0.5s（PSI 環境）。S9 成功後は LCP が FCP に一致するため、この 1 本がそのまま LCP 短縮になる。

## 7. 計測不安定性の解消（新章）

**不安定の根本は §2 のとおり「LCP が JS 完了時刻に張り付いている」こと。S9 が根治策。** それに加えて運用ルールを固定する:

1. **主指標は PSI**（`https://pagespeed.web.dev/` または PSI API で本番 URL）。ローカル LH は**内訳（LCP element / phase / チャンク一覧）を読む道具**とし、スコアと LCP 絶対値は比較に使わない。
2. 各 Phase の合否は **PSI 3 回の中央値**で判定。ローカルは同時に 3 回とり、**LCP Render Delay 比率**（97%→10%未満が S9 の合格線）だけを追う。
3. **97→63 の回帰疑い切り分け（Phase 4 Gate 1）**: HEAD で再計測して 63 帯が再現するか確認 → 再現したら `ed01671` と HEAD の dist をエクスポートしてチャンクサイズ diff（`ac160ae`〜`69e9894` のどれかが guest 初回経路に何かを足していないか）。再現しなければ「18:53 の 63 はローカルノイズ（EBUSY 併発の記録あり）」と結論して先へ。
4. 計測時のローカル条件を固定: 他の Claude/Chrome セッションを閉じる（グローバルルール §8 の多重起動問題はそのまま Lighthouse 分散の原因になる）。

## 8. サードパーティ script の扱い（新章・Speed Insights / Clerk telemetry）

**結論から: どちらも 100 点の妨げではない。外さない。**

1. **キャッシュポリシー audit（`uses-long-cache-ttl`）はスコア重み 0 の診断項目**。11 リソース指摘が全部残っても 100 点は取れる。TTL 是正のためだけに Speed Insights を外す/self-host するのは工数の無駄 → **やらない**。
2. `_vercel/speed-insights/script.js` は既に `app/+html.tsx:92` で **window.load 後に注入**済み。LCP/FCP/TBT の計測窓に原理上乗らない。Phase 4 の trace で「load 後に読まれている」ことを 1 度だけ確認し、乗っていたら注入をさらに遅延（`requestIdleCallback`）する — それ以上はしない。
3. **Clerk telemetry（`in.js`）がゲスト `/` の PSI に出たのは要調査（AUD-1）**: ゲスト経路では Clerk を初期化しない設計（`GuestAuthProvider`）のはず。ネットワーク trace で「ゲスト `/` が `clerk-root-provider`（約 5MB）chunk を DL/実行していないか」を確認。もし prefetch や auth ページ静的チャンク化（`ca1577c`）の副作用でゲストが Clerk を起動しているなら、それは telemetry ではなく **guest 経路への Clerk 混入**という本体バグであり、S10 の Clerk ファンネル設計で同時に潰す。
4. 自前アセットのキャッシュ（11 リソースの残り、`/pwa-icon-*.png` 等）: `vercel.json` の headers で `public/` 配下静的画像に `max-age=31536000, immutable` を付けるだけの 1 行仕事。スコアには効かないが安価なので Phase 5 のついでに。

## 9. 実装フェーズ順序（v2）

### Phase 4 — LCP 安定化（1〜2日・新本命 A）
1. **Gate 1**: 97→63 回帰切り分け（§7-3）。回帰コミットが特定されたらまず revert/修正。
2. **Gate 2**: S9 の再ペイント裏取り（§4-A の 4 手順）。不成立なら Stop&Ask。
3. S9 実装（§4-B を上から）→ 合格線: ローカル LH で LCP Render Delay <10% ＆ PSI で LCP ≤2.0s。
4. S11 CSS インライン化 → PSI ×3。
5. **Revert 基準:** e2e:audit red / PSI 中央値が before 比 −2 点以上 / `/zukan` `/events` 二重表示。

### Phase 5 — JS 削減第2ラウンド（2〜3日・新本命 B）
1. Atlas before スナップショット再取得（現 HEAD）。
2. S10-1 Clerk ファンネル → Atlas で `@clerk/*` の `__common` 退去確認 → PSI ×3。
3. S10-2 tab 付随 UI 統合、S10-3 prefetch 小物統合 → 同上。
4. AUD-1（ゲスト Clerk 混入調査）と vercel.json headers はこの Phase 内で消化。
5. **Revert 基準:** `__common` が痩せても TBT/SI が改善しない場合は当該コミットのみ revert して Stop&Ask。

### Phase 6 — 100 への最終磨き（着手前にユーザー相談）
- TBT の残り（>50ms タスクの分割）と SI の最後の 0.5s。選択肢は S6（実験 tree-shaking）を含み、いずれもリスクが利得を上回り得るため **Phase 5 完了時点の PSI 実測を見てから判断**。

## 10. 絶対に触るな / Stop&Ask（v1 から維持・一部更新）

**危険ファイル（変更禁止 or 最小差分のみ）:**
- `babel-plugins/transform-import-meta.cjs` — Clerk 必須。**完全変更禁止。**
- `app/_layout.tsx` の既存 lazy 構造（ClerkRootProvider/GuestWebProviders 分岐） — S9 で初期値整合を直す場合も**分岐ロジック自体は不変**。境界の追加・初期値固定のみ可。
- `components/providers/clerk-root-provider.tsx` / `lib/clerk-public-routes.ts` — 経路判定変更禁止（S10 の Clerk ファンネルは「lazy 起点の統合」であり公開経路判定には触れない）。
- `public/sw.js` — network-first 維持。S11 は SW に触れない。
- `app/+html.tsx` — **コンテンツ HTML の追加禁止**（§4-D）。

**再提案禁止（実装済み/却下済み）:** S1〜S5 一式 / Clerk lazy / tRPC・Sentry defer / MaterialIcons SVG 化 / 静的 LCP シェル / DOM・画像・CLS 最適化 / naive re-export ファンネル（`__common` 2.37MB に膨れた失敗記録あり）。

**Stop&Ask 条件:** Gate 2 で再ペイントが確認できない / Atlas が §5-A と矛盾 / PSI が revert しても戻らない / 危険ファイルに触れないと進めない / e2e:audit の失敗原因が 30 分で特定できない。

## 11. ゴールの現実 — 3 段仕分けと「100 に必要な条件」

**スコアの物理（Lighthouse v12 重み: LCP25% / TBT30% / CLS25% / FCP10% / SI10%）で試算:**

現状 PSI 69 の内訳 ≈ CLS 1.00・FCP ≈1.00・LCP(5.7s) ≈0.28・TBT(290ms) ≈0.85・SI(4.9s) ≈0.55 → 加重 0.73。実測 69 と整合。

| 段階 | 施策 | 試算 | 判定 |
|------|------|------|------|
| **確実に取る** | Phase 4（S9+S11+回帰切り分け） | LCP 5.7→1.2-2.0s（≈0.95-1.0）、SI 若干改善 → **PSI 85〜93** | 高確度。S9 の Gate 通過が前提 |
| **100 の壁を越えるなら** | Phase 5（S10 で raw −0.6〜1.2MB） | TBT 290→150ms 級（≈0.95）、SI 4.9→3.0-3.5s（≈0.75-0.85） → **PSI 92〜97** | 中確度。Clerk 退去が鍵 |
| **上限の正直な試算** | Phase 6 まで全部 | TBT ≤100ms・SI ≤2.5s が揃った場合のみ加重 ≥0.985 → **97〜99、ベストランで 100** | 下記の構造下限による |

**100 に必要な 3 条件と実現可能性:**
1. **LCP ≤1.5s がどの計測でも安定** — S9 が成立すれば LCP=FCP(0.9-1.4s) で **達成可能**。唯一かつ最大の前提。
2. **TBT ≤100ms** — 構造下限あり: `entry` 985KB（608 モジュール、react-native-web + expo-router + React 本体）は削れず、Moto G 級 4x CPU 減速での parse/eval が TBT 下限 ≈100-200ms を形成。S10 後でも**「常時 ≤100ms」は保証できない**。
3. **SI ≤2.5s** — SSG が先に絵を出す＋S9 で再描画が消えれば射程内だが、残 JS 量（S10 後でも初回 ≈2MB raw）の実行中の視覚変化次第。

**結論（過大約束しない）:** v1 の「100 は無理筋」を、v2 では「**S9 が Gate を通れば 97±2 が安定圏、100 は複数回計測のベストランで現実圏。常時 100 は entry の構造下限（≈1MB raw / TBT 100-200ms）により保証不能**」へ更新する。90+ の妥結ラインは Phase 4 完了時点（85-93）で一度ユーザーに現状を報告し、Phase 5 以降の投資判断を仰ぐこと。
