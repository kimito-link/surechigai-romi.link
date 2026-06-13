# 本番環境診断結果

## 1. /api/health レスポンス

```json
{
  "ok": true,
  "timestamp": 1769007718632,
  "version": "unknown",
  "gitSha": "unknown",
  "builtAt": "unknown",
  "nodeEnv": "production"
}
```

**分析:**
- `version: "unknown"` → APP_VERSION環境変数が設定されていない
- `gitSha: "unknown"` → GIT_SHA環境変数が設定されていない
- `builtAt: "unknown"` → BUILT_AT環境変数が設定されていない
- `nodeEnv: "production"` → 本番環境として動作している

**結論:** バックエンドはv6.50のコードがデプロイされている（/api/healthが新しいフィールドを返している）が、環境変数が未設定のため詳細なバージョン情報が取得できない。


## 2. 管理画面システム状態ページ

**結果:** 「アクセス権限がありません」エラー

管理画面へのアクセスには管理者権限が必要なため、ブラウザからは確認できませんでした。
ただし、/api/healthの結果から以下が判明:
- バックエンド: v6.50のコードがデプロイされている（新しいフィールドが返されている）
- フロントエンド: 確認できず（管理画面にアクセスできないため）


## 3. /event/90001 アクセス結果

**UI表示:** 「チャレンジが見つかりません」

**tRPC API直接呼び出し結果:**
```json
{
  "error": {
    "json": {
      "message": "Failed query: select `id`, `challengeId`, `userId`, `twitterId`, `displayName`, `username`, `profileImage`, `followersCount`, `message`, `companionCount`, `prefecture`, `gender`, `contribution`, `isAnonymous`, `createdAt`, `updatedAt`, `deletedAt`, `deletedBy` from `participations` where (`participations`.`challengeId` = ? and `participations`.`deletedAt` is null)\nparams: 90001",
      "code": -32603,
      "data": {
        "code": "INTERNAL_SERVER_ERROR",
        "httpStatus": 500,
        "path": "events.getById"
      }
    }
  }
}
```

**分析:**
- **DBクエリエラー** が発生している
- participationsテーブルへのクエリが失敗
- エラーコード: INTERNAL_SERVER_ERROR (500)
- 問題: DBクエリ自体が失敗している（データがないのではなく、クエリ実行時にエラー）

**原因候補:**
1. DBスキーマの不一致（deletedAt, deletedByカラムが本番DBに存在しない可能性）
2. DB接続の問題
3. テーブル構造の変更がマイグレーションされていない


## 4. /e/1-test アクセス結果

**UI表示:** 「イベントが見つかりません」「このURLのイベントは存在しないか、削除された可能性があります。」

**分析:**
- /e/[id] ルートは**存在する**（404ではなく、アプリ内のエラー画面が表示）
- slugルートはデプロイされている
- 問題はルーティングではなく、**DBクエリの失敗**

---

# 診断結論

## 原因特定

**根本原因: DBスキーマの不一致**

v6.40-v6.44で追加したソフトデリート機能により、`participations`テーブルに以下のカラムが追加された:
- `deletedAt`
- `deletedBy`

しかし、本番DBにはこれらのカラムが存在しないため、クエリが失敗している。

エラーメッセージ:
```
Failed query: select ... `deletedAt`, `deletedBy` from `participations` where (`participations`.`challengeId` = ? and `participations`.`deletedAt` is null)
```

## 除外された原因

1. ❌ Vercelの古いデプロイ → /api/healthが新フィールドを返しているので、v6.50がデプロイされている
2. ❌ Railwayの古いデプロイ → 同上
3. ✅ **DBデータ/クエリ条件** → DBスキーマが古い（deletedAt, deletedByカラムが存在しない）
4. ❌ ルーティング/slugパース → /e/[id]ルートは正常に動作している

## 修正方法

本番DBに対してマイグレーションを実行し、以下のカラムを追加する必要がある:
1. `participations.deletedAt` (DATETIME, nullable)
2. `participations.deletedBy` (VARCHAR, nullable)

または、Railwayのダッシュボードから `db:push` を実行する。

