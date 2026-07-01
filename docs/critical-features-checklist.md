# コア機能チェックリスト — 君斗りんくのすれ違ひ通信

本番: https://surechigai.kimito.link  
認証 E2E 用: `pnpm e2e:auth-save` → `.auth/auth-state.json` 保存後 `pnpm e2e:audit`

---

## A. 認証（A7）

| # | 確認項目 | Mobile | Desktop |
|---|----------|--------|---------|
| A7-1 | `/sign-in` から X OAuth 完了 | ☐ | ☐ |
| A7-2 | 着地が `/`（ポスト） | ☐ | ☐ |
| A7-3 | ヘッダーにアカウント名・アバター表示 | ☐ | ☐ |

---

## B. 6タブ — 認証済み

### A1 ポスト `/`

| # | 確認項目 | Mobile | Desktop |
|---|----------|--------|---------|
| A1-1 | 封筒 / レーダー UI が表示される | ☐ | ☐ |
| A1-2 | console.error なし | ☐ | ☐ |
| A1-3 | 固定ヘッダー下にコンテンツが隠れない | ☐ | ☐ |

### A2 チェックイン `/checkin`

| # | 確認項目 | Mobile | Desktop |
|---|----------|--------|---------|
| A2-1 | チェックインボタンタップ → 位置取得開始 | ☐ | ☐ |
| A2-2 | 成功 or **具体エラー**（UNKNOWN だけにならない） | ☐ | ☐ |
| A2-3 | Network: `encounter.checkIn` が 200（401/500 でない） | ☐ | ☐ |
| A2-4 | Network: `settings.get` が 200 | ☐ | ☐ |
| A2-5 | Desktop: 粗い測位時は adjust（地図ピン修正）画面 | ☐ | ☐ |
| A2-6 | 失敗時 Console に `[checkin]` ログが出る | ☐ | ☐ |

### A3 軌跡 `/map`

| # | 確認項目 | Mobile | Desktop |
|---|----------|--------|---------|
| A3-1 | 履歴一覧が表示される | ☐ | ☐ |
| A3-2 | 削除 → キャンセルが動く | ☐ | ☐ |
| A3-3 | 公開 / 非公開切替 | ☐ | ☐ |

### A4 集まり `/events`

| # | 確認項目 | Mobile | Desktop |
|---|----------|--------|---------|
| A4-1 | 予定 / ライブ / 主催タブ切替 | ☐ | ☐ |
| A4-2 | イベント作成 → 一覧に反映 | ☐ | ☐ |

### A5 現在地 `/zukan`

| # | 確認項目 | Mobile | Desktop |
|---|----------|--------|---------|
| A5-1 | 都道府県マップが描画される | ☐ | ☐ |
| A5-2 | 都道府県タップ → `/zukan/[prefecture]` | ☐ | ☐ |

### A6 マイページ `/mypage`

| # | 確認項目 | Mobile | Desktop |
|---|----------|--------|---------|
| A6-1 | プロフィール表示 | ☐ | ☐ |
| A6-2 | 設定（位置一時停止等） | ☐ | ☐ |
| A6-3 | ログアウト → ゲスト画面 | ☐ | ☐ |

---

## C. Guest 自動監査（E2E）

```bash
PLAYWRIGHT_BASE_URL=https://surechigai.kimito.link pnpm e2e:audit
```

Guest 6タブ + 非タブ主要ルートは `tests/e2e/full-site-audit.spec.ts` でカバー。  
最新結果: `docs/investigation/full-site-audit-results.md`

---

## D. 既知リスク（再発確認）

| 症状 | 系統 | 確認 |
|------|------|------|
| タブ上部がヘッダーに隠れる | レイアウト | ☐ |
| チェックイン「予期しないエラー…」のみ | 機能/API | ☐ |
| タブ切替で ErrorBoundary 全画面 | クラッシュ | ☐ |
| 地図 chunk 失敗で画面全体クラッシュ | クラッシュ | ☐ |

---

## テスト環境

- Chrome（Desktop + Mobile エミュレーション）
- 本番 `surechigai.kimito.link`（ローカルは `pnpm dev` + `PLAYWRIGHT_BASE_URL=http://localhost:8081`）
