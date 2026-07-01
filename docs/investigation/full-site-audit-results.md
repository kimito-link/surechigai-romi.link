# 全ページ監査結果 — surechigai.kimito.link

**実施日:** 2026-06-30  
**対象 URL:** https://surechigai.kimito.link  
**デプロイ SHA:** `ecd85dc3ab6ff3a7030ce6fbe05f6a77ee2b10fc`  
**監査タグ:** `prod-final`  
**実行コマンド:**

```bash
PLAYWRIGHT_BASE_URL=https://surechigai.kimito.link \
  pnpm exec playwright test tests/e2e/full-site-audit.spec.ts \
  --project=audit-guest-mobile --project=audit-guest-desktop
```

---

## API ヘルス（認証不要）

| エンドポイント | 結果 | 備考 |
|----------------|------|------|
| `GET /version.json` | PASS | commitSha 一致 |
| `GET /api/health` | PASS | DB / Clerk 設定 OK |
| `GET /api/trpc/event.listUpcoming` | PASS | HTTP < 500 |
| `GET /api/trpc/event.listLive` | PASS | HTTP < 500 |

---

## 6タブ — Guest

| ルート | ラベル | Mobile (Pixel 5) | Desktop | エラー種別 |
|--------|--------|------------------|---------|------------|
| `/` | ポスト | PASS | PASS | — |
| `/checkin` | チェックイン | PASS | PASS | — |
| `/events` | 集まり | PASS | PASS | — |
| `/zukan` | 現在地 | PASS | PASS | — |
| `/map` | 軌跡 | PASS | PASS | — |
| `/mypage` | マイページ | PASS | PASS | — |

**Guest 6タブ × mobile/desktop: 12/12 PASS**

スクリーンショット: `test-results/audit/guest-audit-guest-*-prod-final-*.png`

---

## 非タブ主要ルート — Guest

| ルート | ラベル | Mobile | Desktop | 備考 |
|--------|--------|--------|---------|------|
| `/sign-in` | サインイン | PASS | PASS | Clerk iframe — URL 到達のみ検証 |
| `/lp/` | LP | PASS | PASS | 静的 HTML — smoke clean 省略 |
| `/auth/kimito-link` | Xログイン案内 | PASS | PASS | — |
| `/install-instructions` | PWA | PASS | PASS | — |
| `/zukan/東京都` | 都道府県別 | PASS | PASS | — |
| `/visit` | グループ訪問 | PASS | PASS | — |

**非タブ 6ルート × mobile/desktop: 12/12 PASS**

---

## 認証済み 6タブ

| 条件 | 結果 |
|------|------|
| `.auth/auth-state.json` あり | **未実行（skip）** |
| 手動チェックリスト | `docs/critical-features-checklist.md` で補完要 |

認証 E2E を有効にする手順:

```bash
pnpm e2e:auth-save   # X OAuth 完了後 .auth/auth-state.json を保存
pnpm e2e:audit       # audit-auth-mobile / audit-auth-desktop を含む
```

---

## 既知の未カバー / フォローアップ

| 項目 | 優先度 | 状態 |
|------|--------|------|
| `/checkin` auth — `encounter.checkIn` UNKNOWN_ERROR | 高 | コード側: 生エラーログ + メッセージ強化済（未デプロイ） |
| Auth 6タブ E2E | 中 | auth-state 保存後に `audit-auth-*` 実行 |
| `/u/[slug]` 公開共有 | 低 | 監査ルート未追加（有効 slug 要） |

---

## コード修正サマリ（本プラン）

| PR | 内容 | ファイル |
|----|------|----------|
| PR-1 | レイアウト統一 | `app/visit.tsx` → `headerProps` パターン |
| PR-2 | チェックインエラー | `checkin-authenticated-screen.tsx`, `shared/error-messages.ts` |
| PR-3 | クラッシュ耐性 | `TabAuthenticatedShell`, `MapErrorBoundary`, `precision-tile-map` hooks |
| PR-4 | E2E CI | `package.json`, `.github/workflows/e2e-smoke.yml`, `full-site-audit.spec.ts` |

---

## 初回監査との差分メモ

初回実行（`prod-2026-06-30`）では、監査ヘルパーが固定ヘッダー内テキスト（例: タブタイトル「チェックイン」）を本文と誤判定し、レイアウト FAIL が多発。  
`audit-assertions.ts` を修正（`role="header"` 除外 + 動的 headerBottom 計測）後、`prod-final` で Guest 全ルート PASS を確認。
