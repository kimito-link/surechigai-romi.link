# QA ツールキット設計 — 初回マウント OOM を最優先で捕まえる

作成: 2026-07-04（Fable）
関連: `docs/auth-home-oom-diagnosis-v2.md` / `scripts/auth-home-soak.mjs` / メモリ [[surechigai-auth-home-oom]]

---

## 0. 最優先の検出対象（ユーザー報告 2026-07-04 で確定）

ユーザーの実際の症状報告（原文）:

> サイトにACCESSする　かなり重い　一瞬みえたあとしろくなる　そのあと　エラーコード out off memory でまっくら

時系列に分解すると:

1. アクセス直後から**かなり重い**（読み込みが遅い／固まる）
2. **一瞬コンテンツが見える**（React は少なくとも1回コミットしている）
3. **白くなる**（ルートが白画面化。ErrorBoundary 外の例外か、レンダ不能なメモリ圧）
4. **"out of memory" で真っ暗**（Chromium のタブクラッシュ画面）

**含意: これは「タブ滞在中に劣化する問題」ではなく「初回アクセス・初回マウントの数秒〜十数秒で起きる急性の問題」である可能性が高い。**

これまでの対策（Phase 1/2 のタブ非フォーカス時アニメ停止・presence refetch 延長、Phase 0 のキルスイッチ+RadarStageBoundary）は主に滞在中の劣化に効くもので、初回マウントの重さには効かない可能性がある。また現状の RadarStageBoundary は地図ステージのみを囲んでおり、画面全体の白画面化は防げない。

### 検討すべき初回マウントの容疑者（本ツールで観測して切り分ける）

- 地図 SVG（約700要素）の初回パース+レンダリング
- tRPC クエリの同時発火（本数・タイミング・レスポンスサイズ）
- reanimated の初期化コスト
- Clerk 認証状態の確定を待つ間のループ／再レンダ嵐
- 「OOM」表示が真のヒープ枯渇なのか、無限ループ/スタックオーバーフロー等が OOM として表示されているだけなのか

---

## 1. 既存 soak テストの盲点（なぜ今回の症状を見逃すか）

`scripts/auth-home-soak.mjs` は「滞在中のヒープ単調増加」を検出する設計で、以下の理由で**初回クラッシュの中身を記録できない**:

| 問題 | 該当箇所 | 影響 |
|------|---------|------|
| goto 直後に `waitForTimeout(8_000)` で待ってから計測開始 | L136 | 初回0〜8秒のヒープ・DOM推移が一切残らない。8秒以内に落ちると「crashed: true, サンプル0件」だけの結果になる |
| サンプリング間隔が10秒 | `SAMPLE_SEC` 既定10 | 急性期（数秒単位の急増）の解像度がない |
| スクリーンショットは8秒後の1枚のみ | L149 | 「一瞬見えた→白くなった」の視覚的証拠が残らない |
| 白画面検出の仕組みがない | — | コンテンツ描画→消失の遷移を機械検出できない |
| タイミングイベント（DOMContentLoaded / FCP / tRPC発火）を記録しない | — | 「何が起きた直後に落ちたか」の因果が追えない |

※ `page.on("crash")` 自体は goto 前に登録されているため「落ちた事実」だけは検出できる。問題は**落ちるまでの過程が空白**なこと。

---

## 2. ツールキット構成（役割分担）

| ツール | 対象 | 状態 |
|--------|------|------|
| **`scripts/first-load-crash.mjs`（新規・最優先）** | 初回アクセス〜クラッシュ/白画面までの再現・記録 | 本設計で実装 |
| `scripts/auth-home-soak.mjs`（既存） | 滞在中のヒープ単調増加・タブ切替劣化 | 変更なし（役割維持） |
| romiLiteHome キルスイッチ（Phase 0 実装済） | 容疑コンポーネントの bisect | first-load プローブの `--url` と組み合わせて使う |

**初回症状が確認されたら**: first-load プローブをキルスイッチ ON/OFF で回して bisect するのが最短の切り分けルート。

---

## 3. `scripts/first-load-crash.mjs` の設計

### 原則: 「待ってから計測」ではなく「goto の瞬間から全部記録」

1. **リスナー全登録 → その後に goto**。crash / pageerror / console(error) / request / response（`/api/trpc` は procedure 名付き）を navigation 開始前に仕込む。
2. **即時フラッシュのタイムラインログ**（`events.ndjson`、1イベント1行 append）。クラッシュしてもそこまでの全イベントがディスクに残る。
3. **高頻度サンプリング**: CDP `Performance.getMetrics` を既定500ms間隔で。ヒープ/DOMノード/リスナー数を `metrics.csv` にも並行出力。
4. **白画面ステートマシン**: 定期的に root の `innerText` 長と子要素数を evaluate し、`NONE → CONTENT（一瞬見えた）→ BLANK（白くなった）` の遷移を時刻付きで記録。evaluate が1.5秒返らなければ `MAIN_THREAD_BLOCKED`（=「かなり重い」の機械検出）としてイベント記録。
5. **連続スクリーンショット**: 最初の30秒は2秒毎、以降は10秒毎。「一瞬見えた」フレームを画像で押さえる。
6. **タイミングイベント**: `Page.lifecycleEvent`（DOMContentLoaded / load / firstContentfulPaint 等）+ `addInitScript` で PerformanceObserver（longtask, paint, buffered:true）を注入し、long task の発生時刻・長さを回収。React 初回コミットは厳密には取れないため「first-contentful-paint + root にコンテンツが初出現した時刻」で近似する。
7. **再現条件の増幅**: CPU スロットリング（既定 4x、`--cpu-rate` で変更）と `--heap-mb`（`--max-old-space-size`）でユーザーの端末条件に寄せる／再現を加速する。
8. **反復実行**: クラッシュは flaky になり得るため `--iterations=N`（既定3）で繰り返し、判定を集計。

### 観測ウィンドウ

既定 **90秒**（`--window-sec`）。症状は「数秒〜十数秒」なので十分な余裕を持ちつつ、soak のような長時間滞在はしない。タブ切替等の操作は**しない**（初回マウントの純粋な観測に徹する）。

### 判定（verdict）

| verdict | 条件 |
|---------|------|
| `CRASH_ON_FIRST_LOAD` | ウィンドウ内に page crash（時刻・直前のヒープ・直前イベント列を summary に含める） |
| `WHITE_SCREEN` | CONTENT → BLANK 遷移を検出（クラッシュ未満でも異常） |
| `LOAD_TIMEOUT` | DOMContentLoaded がタイムアウトまでに来ない |
| `SUSPICIOUS` | クラッシュしないが、ヒープ最大値が閾値（既定800MB）超 or MAIN_THREAD_BLOCKED 多発 |
| `OK` | 上記いずれもなし |

### 出力（`qa-results/first-load/<timestamp>/iter-N/`）

- `events.ndjson` — 全イベントの時系列（tMs 起点は goto 発行時刻）
- `metrics.csv` — ヒープ/ノードの高頻度サンプル
- `shots/t{ms}.png` — 連続スクリーンショット
- `summary.json` — 判定・キーイベント時刻（DCL / FCP / 初コンテンツ / 白画面化 / crash）・tRPC 発火一覧・long task 集計
- 親ディレクトリに `aggregate.json` — 反復全体の集計（クラッシュ率など）

### 使い方

```bash
pnpm qa:first-load                          # 既定: 本番URL・3回反復・CPU 4x・90秒窓
pnpm qa:first-load --iterations=5 --cpu-rate=6
pnpm qa:first-load --heap-mb=512            # 再現加速
pnpm qa:first-load --headed                 # 目視デバッグ
pnpm qa:first-load --base-url=http://localhost:8081
```

前提は soak と同じ（`.auth/auth-state.json`。無ければ `pnpm e2e:auth-save`）。

---

## 4. 将来拡張（今回はやらない）

- CI（GitHub Actions）への常設: 認証状態のシークレット化が必要（diagnosis-v2 Phase 3 と合流）
- ゲスト `/` 用のプロファイル追加（NavLivePrefecturePanel 系の再発監視）
- Lighthouse/PageSpeed 連携（`surechigai-pagespeed-100-plan` と別トラック）

大きな QA 基盤の話より、まず目の前の急性症状（初回マウント OOM）を捕まえることに全振りする、が現時点の方針。
