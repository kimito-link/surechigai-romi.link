# E2E スモークテスト（surechigai-romi.link）

Playwright による Web スモークテストです。

## テスト構成

| プロジェクト | ファイル | 認証 | 内容 |
|-------------|---------|------|------|
| `public-smoke` | `tests/e2e/public.smoke.spec.ts` | 不要 | ホーム・図鑑・軌跡・チェックイン・LP |
| `trail-auth-smoke` | `tests/e2e/trail-auth.smoke.spec.ts` | `.auth/auth-state.json` 必須 | 削除モーダル・公開切替・チェックイン loading |
| （spec ではない） | `scripts/save-auth-state.mjs` | 手動 X ログイン | `pnpm e2e:auth-save`。ログイン完了を cookie で自動検知し、保存後に別ブラウザで実効性まで検証（一度だけ） |

> 迷ったら `pnpm qa:doctor`。認証状態の診断 → ログイン保存 → soak / first-load / e2e をメニューから一気通貫で実行できる。

## 実行

### 公開ページのみ（CI / 日常）

```bash
pnpm e2e
```

本番向け:

```bash
PLAYWRIGHT_BASE_URL=https://surechigai.kimito.link pnpm e2e
```

### 認証付き（削除・公開・チェックイン）

1. セッション保存（初回のみ・ブラウザが開くので X ログイン。既定の対象は本番 URL）:

```bash
pnpm e2e:auth-save
# ローカル対象なら: node scripts/save-auth-state.mjs --base-url=http://localhost:8081
```

ログイン完了はスクリプトが Clerk cookie（`__client_uat`）で自動検知する。
完了前にブラウザを閉じたりタイムアウトした場合は **何も保存されない**
（空の auth-state.json ができて下流がゲストで走る事故は構造的に起きない）。
保存済み状態が今も有効かは `pnpm e2e:auth-verify` で確認できる。

2. 認証付きスモーク実行:

```bash
PLAYWRIGHT_BASE_URL=https://surechigai.kimito.link pnpm e2e
```

`.auth/auth-state.json` は **git にコミットしない**（`.gitignore` 済み）。

## 自動監視

- `console.error`（既知パターン除く）
- 未処理 `pageerror`
- 想定外 4xx/5xx（tRPC 401 未ログイン・favicon 404 等は許容）

## 削除フローの手動確認

1. 図鑑 or 軌跡 → 「最近の移動履歴」
2. ゴミ箱（`testID=trail-location-delete-{id}`）タップ
3. 「足あとを削除」モーダル → `confirm-modal-confirm` で削除

## トラブルシューティング

- **auth テストが全部 skip**: `pnpm e2e:auth-save` を実行（空/ゲスト状態の auth-state.json は「無い」扱いで skip される）
- **古い JS**: ハードリロード or `version.json` でデプロイ SHA を確認
- **ローカル**: `pnpm dev:metro` が 8081 で起動していること
