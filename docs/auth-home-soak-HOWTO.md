# 認証済みホーム ソークテスト HOWTO（v2）

`docs/auth-home-oom-diagnosis-v2.md` Phase 3 の「認証込み検証基盤」の実行手順。
X OAuth を毎回通さずに、認証済みホーム（ポストタブ）をヘッドレス・無人で検証できる。

v2 で OOM 専用から**症状非依存の異常検出器**に拡張した（設計は `docs/qa-toolkit-design.md`）。
「ちかちか」系の症状（リロードループ・ErrorBoundary ループ・再レンダ暴走・エラー多発）も判定に入る。

## 初回のみ: 認証状態の保存（人間の操作が1回だけ必要）

Git Bash で:

```bash
export PLAYWRIGHT_BASE_URL=https://surechigai.kimito.link
pnpm e2e:auth-save
```

ブラウザが開くので **X ログインを最後まで完了**させる（最大4分待機）。完了すると
`.auth/auth-state.json` に保存される（gitignore 済み・コミット厳禁）。

> ⚠️ **ログインを完了せずにブラウザを閉じると、空の auth-state.json（27バイト前後）が
> 保存される**。v1 はこの状態でも黙ってゲスト画面を計測してしまっていた（2026-07-04 に実際に発生）。
> v2 は空の認証状態を検出すると**エラーで即終了**する。保存後に
> `wc -c .auth/auth-state.json` が数KB以上あることを確認するとよい。

- セッションが失効したら同じ手順で再保存する。
- 保存先は `test-results/` の外なので Playwright 実行で消えることはない。

## 毎回: ソークテスト実行（無人・Claude が直接実行してよい）

```bash
pnpm soak:auth-home
```

既定: 本番 `https://surechigai.kimito.link` / **3分** / CPU 4x スロットリング / Pixel 5 viewport (393x851) / 45秒毎にタブ切替（checkin → zukan → home）+ スクロール。

### オプション

| コマンド | 意味 |
|---|---|
| `pnpm soak:auth-home --minutes=10` | 10分ソーク（本計測はこちら。まず3分で動作確認してから） |
| `pnpm soak:auth-home --lite` | `?romiLiteHome=1` で計測（レーダーステージ無しのベースライン。通常計測と比較して原因を二分する） |
| `pnpm soak:auth-home --heap-mb=256` | Chromium ヒープ上限を 256MB に絞り低メモリ端末を近似（OOM再現の加速） |
| `pnpm soak:auth-home --no-tabs` | タブ切替なし（ホーム滞在のみ。切り分け用） |
| `pnpm soak:auth-home --allow-guest` | 認証状態が空/無しでもゲストとして計測（ゲスト画面の基準値取り用） |
| `pnpm soak:auth-home --headed` | ブラウザ表示（デバッグ用） |
| `pnpm soak:auth-home --base-url=http://localhost:8081` | ローカル向け（認証状態はドメイン別なので auth-save もローカルで取り直すこと） |
| `--cpu-rate=6` / `--sample-sec=5` | スロットリング倍率 / サンプリング間隔の変更 |

## 出力の見方

`soak-results/<timestamp>/`（`--lite` 時は `-lite` サフィックス）に出力:

- `summary.json` — 判定と要約。`verdict` が結論（優先順位順）:
  - `OOM_CRASH` … `page.on("crash")` 発火＝タブクラッシュ（OOM の可能性大）。exit code 1
  - `RELOAD_LOOP` … 意図しないフルリロードが3回以上。**「ちかちか」の有力原因**
    （SW の古いキャッシュ × chunk-recover 自動リロードのループ等）。`serviceWorker` フィールドと `reloadTimesSec` を見る
  - `BOUNDARY_LOOP` … `[RadarStageBoundary]` の捕捉が2回以上＝レーダーステージがクラッシュ→remountを繰り返している
  - `MUTATION_STORM` … childList 変異が500ノード/秒超のサンプルが3連続＝マウント/アンマウントの暴走（再レンダリングループ）
  - `ERROR_STORM` … console error + pageerror が20件/分以上
  - `HEAP_GROWTH` … クラッシュ無しだがヒープが単調増加（>1MB/分 かつ Δ>10MB）
  - `OK` … 上記いずれも該当なし
- `metrics.csv` — 10秒毎の `JSHeapUsedSize` / `Nodes` / `paintFps` / `mutNodesPerSec` / `longTaskMs` 等の生データ
- `00-start.png` / `99-end.png` — 開始・終了時のスクリーンショット（ログイン済み画面かの目視確認に使う）

### 参考値の読み方

- `paintFps`（ペイントフレーム/秒）: レーダー等のアニメが常時回る画面なので絶対値では判定に使わない。
  **`--lite`（アニメ無し）のベースラインと比較**して、lite で 0 付近・通常で異常に高い（>30fps 持続）なら描画暴走を疑う。
  ゲスト基準値（2026-07-04 計測）: paint 0fps / DOM 214ノード固定。
- `longTaskTotalMs`: フリーズ傾向の指標。CPU 4x スロットリング下なので多少は出る。分あたり数千msが持続するなら異常。

成功基準（診断書 §5）: 初期ヒープ 150MB 以下、10分で +10MB 未満、クラッシュ 0、意図しないリロード 0。

## 推奨の使い方: 通常 vs lite の A/B

```bash
pnpm soak:auth-home --minutes=10            # 通常（レーダーステージあり）
pnpm soak:auth-home --minutes=10 --lite     # ベースライン（レーダーステージなし）
```

2つの `summary.json` を比較する。通常のみ異常 → 原因はレーダーステージ配下。
lite でも異常 → 原因は画面外（SW / persist / Clerk 側）。診断書 §4-1 の bisect の無人版。

## 注意

- `.auth/auth-state.json` はログイン情報そのもの。共有・コミットしない。
- 本番に対して読み取り中心の操作のみ（タブ切替とスクロール）。チェックイン等の書き込み操作はしない。
- スクリプトは `page.on("crash")` 検出時に即終了して集計する。Ctrl+C でも途中集計される。
