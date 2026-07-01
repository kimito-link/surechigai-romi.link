# 集まり（主催）— 検証チェックリスト結果

**実施日:** 2026-06-30  
**環境:** 本番 `https://surechigai.kimito.link`  
**デプロイ SHA:** `fc7bf84`（2026-07-01 確認済み）

## 自動検証

| 項目 | 結果 | 根拠 |
|------|------|------|
| `pnpm check` | PASS | tsc 0 エラー |
| Vitest バリデーション | PASS | 10 tests (event-create-validation + date-utils) |
| `invoke-event-create.ts` | PASS | online/offline 作成 → cancel |
| Playwright guest 主催誘導 | PASS | `events-host.smoke.spec.ts` |
| Playwright guest タブ instant | PASS | `tab-instant-display.spec.ts` |
| Playwright auth 主催 smoke | SKIP | `.auth/auth-state.json` なし |
| API `event.listUpcoming` | PASS | 200 `[]` |
| API `event.listLive` | PASS | 200（ライブ 1 件） |

## 3-A 主催タブ（H1–H10）

| # | 操作 | 結果 | メモ |
|---|------|------|------|
| H1 | オンライン + URL + 公開 → 作成 | **POST-DEPLOY** | API smoke で create OK。UI はデプロイ後要確認 |
| H2 | オンライン + URL なし → UI 阻止 | **PASS (Vitest)** | `validateEventCreateForm` + E2E バリデーション spec |
| H3 | リアル + 都道府県 + 限定 + 合言葉 | **PASS (API)** | invoke-event-create offline unlisted |
| H4 | リアル + 都道府県未選択 | **PASS (Vitest)** | |
| H5 | 種別タグ複数 | POST-DEPLOY | UI 手動 |
| H6 | quickStart | POST-DEPLOY | UI 手動 |
| H7 | goLive → ライブ中 | POST-DEPLOY | UI 手動 |
| H8 | endLive | POST-DEPLOY | UI 手動 |
| H9 | cancel | **PASS (API)** | invoke cancel OK。UI はデプロイ後 |
| H10 | 作成後 /mypage 反映 | POST-DEPLOY | invalidate 実装済み、デプロイ後確認 |

## 3-B 予定 / ライブ中（P1–P3）

| # | 操作 | 結果 | メモ |
|---|------|------|------|
| P1 | 未ログイン閲覧 + 主催誘導 | **PASS** | Playwright guest |
| P2 | カレンダー日付選択 | POST-DEPLOY | 手動 |
| P3 | ライブ 30s ポーリング | POST-DEPLOY | 手動 |

## 3-C 参加表明・reveal（R1–R5）

| # | 操作 | 結果 | メモ |
|---|------|------|------|
| R1–R5 | 参加/reveal/参加者一覧 | POST-DEPLOY | 2 アカウント要・手動 |

## 3-D エッジ・回帰

| 項目 | 結果 |
|------|------|
| 主催タブ Suspense 白画面 | POST-DEPLOY |
| 既存 events-date-utils | PASS |

## 認証 E2E を走らせるには

```bash
pnpm e2e:auth-save --headed
pnpm exec playwright test tests/e2e/events-host.smoke.spec.ts --project=events-host-smoke
```
