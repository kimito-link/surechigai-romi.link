# テストカバレッジ不足レポート

**作成日**: 2026-02-09  
**レビュー対象**: セキュリティ関連の実装コード  
**テストフレームワーク**: Vitest

---

## 1. 不足しているテストケース一覧

| 優先度 | カテゴリ | 対象関数/機能 | テストシナリオ | 期待する結果 |
| :--- | :--- | :--- | :--- | :--- |
| **高** | セキュリティ | `getClientIp` | `x-forwarded-for`が複数IPを含む場合 | 先頭のIPが取得されること |
| **高** | セキュリティ | `getClientIp` | `x-forwarded-for`が配列形式の場合 | 配列の最初の要素からIPを取得 |
| **高** | セキュリティ | `getClientIp` | 無効なIP形式の場合 | フォールバックが使用されること |
| **高** | セキュリティ | `getClientIp` | IPv6アドレスの場合 | IPv6アドレスが正しく処理されること |
| **高** | セキュリティ | `extractBearerToken` | ヘッダーにBearerが含まれない場合 | nullまたは401エラーが返ること |
| **高** | セキュリティ | `extractBearerToken` | Bearerの後にスペースがない場合 | nullまたは401エラーが返ること |
| **高** | セキュリティ | `extractBearerToken` | 空のトークンの場合 | nullまたは401エラーが返ること |
| **高** | セキュリティ | `isAllowedOrigin` | 本番環境でlocalhostからのリクエスト | 拒否されること |
| **高** | セキュリティ | `isAllowedOrigin` | 悪意のあるオリジン（doin-challenge.com.evil.com） | 拒否されること |
| **高** | セキュリティ | `getSessionSecret` | JWT_SECRETが未設定の場合 | エラーがスローされること |
| **高** | セキュリティ | `getSessionSecret` | JWT_SECRETが空文字列の場合 | エラーがスローされること |
| **高** | セキュリティ | `decodeState` | 無効なBase64文字列の場合 | エラーがスローされること |
| **高** | セキュリティ | `decodeState` | デコード後の値が空の場合 | エラーがスローされること |
| **中** | 境界値 | `checkRateLimit` | 制限を超えた直後のリクエスト | `allowed: false`が返ること |
| **中** | 境界値 | `checkRateLimit` | 期限切れ後のリクエスト | 新しいエントリが作成されること |
| **中** | 境界値 | `checkRateLimit` | 異なるIPからの同時リクエスト | 独立してカウントされること |
| **中** | 境界値 | `checkRateLimit` | 異なるパスからの同時リクエスト | 独立してカウントされること |
| **中** | 境界値 | `rateLimiterMiddleware` | User-Agentが非常に長い場合 | 100文字で切り詰められること |
| **中** | 異常系 | `createErrorResponse` | 本番環境でのエラー詳細 | スタックトレースが含まれないこと |
| **中** | 異常系 | `createErrorResponse` | 開発環境でのエラー詳細 | スタックトレースが含まれること |
| **中** | 異常系 | `createErrorResponse` | 長いスタックトレース | 200文字で切り詰められること |
| **中** | 異常系 | `createErrorResponse` | 文字列エラーの場合 | 適切に処理されること |
| **中** | 異常系 | `createErrorResponse` | 未知のエラー型の場合 | デフォルトメッセージが返ること |
| **中** | 環境依存 | `isAllowedOrigin` | ALLOWED_ORIGINS環境変数が設定されている場合 | ホワイトリストが使用されること |
| **中** | 環境依存 | `isAllowedOrigin` | ALLOWED_ORIGINSが空の場合 | doin-challenge.comのみ許可 |
| **中** | 環境依存 | `getSessionCookieOptions` | x-forwarded-protoが配列の場合 | 正しく処理されること |
| **中** | 環境依存 | `getSessionCookieOptions` | x-forwarded-hostが配列の場合 | 正しく処理されること |
| **低** | 可読性 | `getRateLimitStats` | 統計情報の取得 | 正しい形式で返ること |
| **低** | 可読性 | `getRateLimitStats` | 期限切れエントリの除外 | 期限切れエントリが含まれないこと |

---

## 2. 追加すべきテストコード

### 2.1 Rate Limiter テスト

**ファイル**: `tests/rate-limiter.test.ts`

主要なテストケース:
- `getClientIp`関数の各種IP取得パターン
- `checkRateLimit`関数の境界値テスト
- `rateLimiterMiddleware`の統合テスト
- レート制限超過時のレスポンス検証

### 2.2 Twitter Routes セキュリティテスト

**ファイル**: `tests/twitter-routes-security.test.ts`

主要なテストケース:
- `extractBearerToken`関数の各種ヘッダーパターン
- `createErrorResponse`関数の環境依存テスト
- エラーハンドリングの統合テスト

### 2.3 CORS セキュリティテスト

**ファイル**: `tests/cors-security.test.ts`

主要なテストケース:
- `isAllowedOrigin`関数の開発/本番環境テスト
- ALLOWED_ORIGINS環境変数のテスト
- 悪意のあるオリジンの拒否テスト

### 2.4 SDK セキュリティテスト

**ファイル**: `tests/sdk-security.test.ts`

主要なテストケース:
- `decodeState`関数のエラーハンドリング
- `getSessionSecret`関数の環境変数検証

### 2.5 Cookies セキュリティテスト

**ファイル**: `tests/cookies-security.test.ts`

主要なテストケース:
- `getSessionCookieOptions`関数の各種リクエストパターン
- プロキシ経由のリクエスト処理
- セキュアフラグの設定

---

## 3. 実装上の注意点

### 3.1 Private関数のテスト

以下の関数はprivateのため、以下のいずれかの方法でテストする必要があります:

1. **テスト用にexportする**（推奨）
   ```typescript
   // テスト用にexport
   export function getClientIpForTesting(req: any): string {
     return getClientIp(req);
   }
   ```

2. **統合テストとして実装**
   - 実際のエンドポイント経由でテスト
   - より現実的なテストが可能

### 3.2 環境変数のモック

Vitestでは`vi.stubEnv`を使用:
```typescript
vi.stubEnv("NODE_ENV", "production");
vi.stubEnv("JWT_SECRET", "test-secret");
```

### 3.3 時間のモック

レート制限の期限切れテストには`vi.useFakeTimers`を使用:
```typescript
vi.useFakeTimers();
vi.setSystemTime(new Date("2026-01-01"));
// テスト実行
vi.useRealTimers();
```

---

## 4. 優先順位

1. **最優先（高）**: セキュリティ関連のテスト
   - IP取得、Bearerトークン検証、CORS、JWT_SECRET検証

2. **優先（中）**: 境界値・異常系テスト
   - レート制限の境界値、エラーハンドリング

3. **低優先度（低）**: 統計情報などの補助機能

---

## 5. 次のステップ

1. テストファイルを作成（上記の雛形を参考）
2. Private関数をテスト用にexportするか、統合テストとして実装
3. CI/CDパイプラインにテストを追加
4. カバレッジレポートを生成して不足箇所を確認
