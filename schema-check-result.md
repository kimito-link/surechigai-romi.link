# スキーマチェック結果（v6.51デプロイ後）

## /api/health?schema=true レスポンス

```json
{
  "ok": true,
  "timestamp": 1769024084466,
  "version": "unknown",
  "gitSha": "unknown",
  "builtAt": "unknown",
  "nodeEnv": "production",
  "schema": {
    "status": "mismatch",
    "expectedVersion": "0023",
    "missingColumns": [
      {"table": "participations", "column": "deletedAt"},
      {"table": "participations", "column": "deletedBy"},
      {"table": "challenges", "column": "targetCount"},
      {"table": "challenges", "column": "currentCount"},
      {"table": "challenges", "column": "organizerId"},
      {"table": "users", "column": "twitterId"},
      {"table": "users", "column": "username"},
      {"table": "users", "column": "displayName"},
      {"table": "users", "column": "profileImage"}
    ],
    "errors": [],
    "checkedAt": "2026-01-21T19:34:44.466Z",
    "actualVersion": "9820a711"
  }
}
```

## 分析

v6.51のコードはデプロイされている（schemaフィールドが返されている）。

しかし、スキーマチェックが「mismatch」を報告している。これは**スキーマチェックの期待値定義が実際のDBと異なる**ため。

### 問題点

server/schema-check.tsのEXPECTED_SCHEMAで定義した「期待するカラム」が、実際のDBのカラム名と異なっている可能性がある。

例えば：
- 期待: `deletedAt` → 実際: `deleted_at`（スネークケース）
- 期待: `targetCount` → 実際: `target_count`

### 対応方針

1. 実際のDBスキーマを確認
2. server/schema-check.tsのEXPECTED_SCHEMAを修正
