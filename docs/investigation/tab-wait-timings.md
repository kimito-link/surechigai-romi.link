# タブ遷移待ち — 計測結果（WS2）

Playwright 調査スクリプト `tests/e2e/tab-wait-investigation.spec.ts` の出力を集約。  
アーティファクト: `docs/investigation/artifacts/tab-wait-samples-guest-production.json`

---

## 本番 — ゲスト（2026-07-01）

環境: `https://surechigai.kimito.link`（commit `9415340e`）  
ビューポート: Desktop Chrome 1280×800（Playwright デフォルト）

| scenario | route | cold/warm | shellVisible_ms | mainContent_ms | fullSpinner_ms | chunk_kb | trpc_count | shellDuringSpinner |
|----------|-------|-----------|-----------------|----------------|----------------|----------|------------|-------------------|
| layerA_guest_home_to_events | /events | cold | — | **667** | 0* | 0 | 3 | **yes** |
| layerA_guest_events_to_zukan | /zukan | warm | 658 | 773 | 0* | 0 | 1 | no |
| guest_cold_direct_post | / | cold | — | 604 | 0* | 0 | 2 | no |
| guest_cold_direct_checkin | /checkin | cold | 501 | 598 | 0* | 0 | 1 | no |
| guest_cold_direct_events | /events | cold | 521 | 602 | 0* | 0 | 2 | no |
| guest_cold_direct_zukan | /zukan | cold | — | 574 | 0* | 0 | 1 | yes |
| guest_cold_direct_map | /map | cold | 549 | 622 | 0* | 0 | 2 | no |
| guest_cold_direct_mypage | /mypage | cold | 537 | 602 | 0* | 0 | 1 | no |
| guest_warm_home_to_events | /events | warm | — | 630 | 0* | 0 | 1 | yes |
| guest_warm_events_to_home | / | warm | 440 | **505** | 0* | 0 | 1 | no |
| guest_spinner_probe_events | /events | warm | — | — | **445** | 0 | 0 | no |

\* `role=progressbar` ポーリングは 50ms 刻みのため、短いスピナー（&lt;50ms）は 0 と記録されうる。専用 probe `guest_spinner_probe_events` で **445ms** を確認。

### 本番ゲスト — サマリー

| 指標 | コールド直リンク | ウォーム往復 |
|------|----------------|-------------|
| mainContent_ms（中央値） | **602ms** | **568ms** |
| shellVisible_ms（記録あり） | 501–549ms | 440ms |
| trpc_count / 遷移 | 1–2 | 1 |
| fullSpinner（probe） | — | **445ms**（/→/events） |

**Layer A 判定（ゲスト `/` → 他タブ）:** **Yes（部分的主因）**

- 根拠: `guest_spinner_probe_events` で全画面 spinner **~445ms**。`layerA_guest_home_to_events` では `shellVisibleDuringSpinner=true`（サイドナビ「君斗りんく」は spinner 中も DOM に存在しうる）だが、`mainContent_ms` は **667ms** で shell より遅い。
- tRPC: 初回 `/events` で **3 リクエスト**（PublicWebProviders マウント + データ prefetch）。
- JS chunk: 本番キャッシュ済みのため Playwright resource 計測では **0 KB 増**（初回コールドは WS4 静的プローブ参照）。

### 本番 — 認証済み

`.auth/auth-state.json` 未配置のため **スキップ**。再計測手順:

```bash
pnpm e2e:auth-save   # 初回のみ
PLAYWRIGHT_BASE_URL=https://surechigai.kimito.link \
  pnpm exec playwright test tab-wait-investigation.spec.ts --project=tab-wait-investigation -g "authenticated"
```

---

## ローカル — ゲスト（2026-07-01・部分）

環境: `http://localhost:8081`（`pnpm dev:metro`）  
結果: Metro 初回バンドル待ちにより **mainContent_ms ≈ 23s**（タイムアウト境界）。`/events` 見出し未到達で 2 テスト失敗。

| scenario | mainContent_ms | 備考 |
|----------|----------------|------|
| layerA_guest_home_to_events | ~23,000 | 初回 chunk コンパイル支配 |
| guest_cold_direct_checkin | ~23,000 | 同上 |

**解釈:** ローカルは Layer C（Metro オンデマンドバンドル）が支配的。本番との比較は **ウォーム 2 周目以降** または **本番ビルド preview** が必要。今回は本番数値を KPI 基準とする。

---

## WS4 — 初回 JS chunk（本番静的プローブ）

`node scripts/tab-wait-probe.mjs` → `docs/investigation/artifacts/chunk-probe-production.json`

全 6 タブで HTML 初期 script タグは同一（route 別の追加 chunk はクライアント lazy ロード）。

| 順位 | ファイル | サイズ | 備考 |
|------|---------|--------|------|
| 1 | `__common-*.js` | **2182 KB** | 全タブ共通 |
| 2 | `entry-*.js` | **961 KB** | エントリ |
| 3 | `_layout-16592e*.js` | **270 KB** | tabs layout |
| 4 | `_layout-40334b*.js` | 34 KB | root layout |
| 5 | `index-26e4d*.js` | 5 KB | ポスト route shell |

**prefetch 候補 Top 5（route lazy・未登録）**

| 優先度 | モジュール | 期待効果 |
|--------|-----------|---------|
| P0 | `post-authenticated-screen` | 認証済みポスト初回 |
| P0 | `events-authenticated-screen` | 集まり初回 |
| P0 | `events-guest-content` | ゲスト集まり（Layer A 後の C） |
| P0 | `zukan-authenticated-screen` | 図鑑初回 |
| P1 | `public-web-providers` | ゲスト tRPC 初回マウント短縮 |

ゲスト shell 時は `prefetchHeavyTabChunks()` が **no-op**（`app/_layout.tsx` L97）。

---

## Layer D — refetch 影響（静的 + 本番 Network 観察）

`AUTHENTICATED_QUERY_OPTIONS`: `staleTime: 0`, `refetchOnMount: true`

- zukan / map / events 等はタブ再訪問で **毎回 `/api/trpc` 1+ 本**（本番ゲストでも各遷移 1–3 本確認）。
- 認証済みウォーム往復の定量比較は auth state 取得後に実施。

---

## WS3 — ベースライン E2E

| テスト | ファイル | 本番結果 |
|--------|---------|---------|
| ゲスト /→/events 往復 | `tab-instant-display.spec.ts` | 拡張済み（15s 以内 assert） |
| shell 遷移中 visible | `tab-wait-investigation.spec.ts` | **pass**（本番） |
| 認証済み 6 タブ 2s | `tab-instant-display.spec.ts` | auth state 要 |

再実行:

```bash
pnpm exec playwright install chromium
PLAYWRIGHT_BASE_URL=https://surechigai.kimito.link \
  pnpm exec playwright test tab-wait-investigation.spec.ts --project=tab-wait-investigation
```
