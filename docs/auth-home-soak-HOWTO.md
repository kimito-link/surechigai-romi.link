# 認証済みホーム ソークテスト HOWTO

`docs/auth-home-oom-diagnosis-v2.md` Phase 3 の「認証込み検証基盤」の実行手順。
X OAuth を毎回通さずに、認証済みホーム（ポストタブ）の OOM をヘッドレス・無人で検証できる。

## 初回のみ: 認証状態の保存（人間の操作が1回だけ必要）

Git Bash で:

```bash
export PLAYWRIGHT_BASE_URL=https://surechigai.kimito.link
pnpm e2e:auth-save
```

ブラウザが開くので **X ログインを完了**させる（最大4分待機）。完了すると
`.auth/auth-state.json` に保存される（gitignore 済み・コミット厳禁）。

- セッションが失効したら（ソーク実行時に「clerk キーが見当たりません」警告が出たら）同じ手順で再保存する。
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
| `pnpm soak:auth-home --heap-mb=256` | Chromium ヒープ上限を 256MB に絞り低メモリ端末を近似（OOM再現の加速） |
| `pnpm soak:auth-home --no-tabs` | タブ切替なし（ホーム滞在のみ。切り分け用） |
| `pnpm soak:auth-home --headed` | ブラウザ表示（デバッグ用） |
| `pnpm soak:auth-home --base-url=http://localhost:8081` | ローカル向け（認証状態はドメイン別なので auth-save もローカルで取り直すこと） |
| `--cpu-rate=6` / `--sample-sec=5` | スロットリング倍率 / サンプリング間隔の変更 |

## 出力の見方

`soak-results/<timestamp>/` に出力:

- `summary.json` — 判定と要約。`verdict` が結論:
  - `OOM_CRASH` … `page.on("crash")` 発火＝タブクラッシュ（OOM の可能性大）。exit code 1
  - `HEAP_GROWTH` … クラッシュ無しだがヒープが単調増加（>1MB/分 かつ Δ>10MB）
  - `OK` … 上記いずれも該当なし
- `metrics.csv` — 10秒毎の `JSHeapUsedSize` / `Nodes` / `JSEventListeners` 等の生データ
- `00-start.png` / `99-end.png` — 開始・終了時のスクリーンショット（ログイン済み画面かの目視確認に使う）

成功基準（診断書 §5）: 初期ヒープ 150MB 以下、10分で +10MB 未満、クラッシュ 0。

## 最初の使い道: LIVE_PRESENCE_RADAR_ENABLED の A/B 比較

`components/post/post-authenticated-screen.tsx` の `LIVE_PRESENCE_RADAR_ENABLED` を
false（現状）と true でそれぞれデプロイ or ローカル起動し、**同条件で2回**ソークして
`summary.json` の `heapDeltaMB` / `slopeMBPerMin` / `crashed` を比較する。

## 注意

- `.auth/auth-state.json` はログイン情報そのもの。共有・コミットしない。
- 本番に対して読み取り中心の操作のみ（タブ切替とスクロール）。チェックイン等の書き込み操作はしない。
- スクリプトは `page.on("crash")` 検出時に即終了して集計する。Ctrl+C でも途中集計される。
