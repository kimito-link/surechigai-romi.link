# E2E スモークテスト（surechigai-romi.link）

Playwright による Web スモークテストです。

## テスト構成

| プロジェクト | ファイル | 認証 | 内容 |
|-------------|---------|------|------|
| `public-smoke` | `tests/e2e/public.smoke.spec.ts` | 不要 | ホーム・図鑑・軌跡・チェックイン・LP |
| `trail-auth-smoke` | `tests/e2e/trail-auth.smoke.spec.ts` | `.auth/auth-state.json` 必須 | 削除モーダル・公開切替・チェックイン loading |
| `save-auth` | `tests/e2e/save-auth-state.spec.ts` | 手動 X ログイン | セッション保存（一度だけ） |

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

1. セッション保存（初回のみ・ブラウザが開くので X ログイン）:

```bash
PLAYWRIGHT_BASE_URL=https://surechigai.kimito.link pnpm e2e:auth-save
```

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

- **auth テストが全部 skip**: `pnpm e2e:auth-save` を実行
- **古い JS**: ハードリロード or `version.json` でデプロイ SHA を確認
- **ローカル**: `pnpm dev:metro` が 8081 で起動していること
